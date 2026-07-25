"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  listarContasFixas,
  listarContasVariaveis,
  listarPessoas,
} from "@/lib/dados";
import { prisma } from "@/lib/prisma";
import type { IntentCadastro, PessoaDTO } from "@/lib/tipos";
import { obterContexto } from "@/lib/workspace";

const POE_URL = "https://api.poe.com/v1/responses";
const MODELO = "gpt-4o-mini";

const MES = /^\d{4}-(0[1-9]|1[0-2])$/;
const DATA = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const COR = /^#[0-9a-fA-F]{6}$/;

/** Formato bruto que a IA devolve: nomes de pessoa em texto, ainda sem IDs. */
const intentBrutoSchema = z.discriminatedUnion("tipo", [
  z.object({
    tipo: z.literal("pessoa"),
    dados: z.object({
      nome: z.string().trim().min(1),
      email: z.string().trim().optional(),
      salario: z.coerce.number().min(0).optional(),
    }),
  }),
  z.object({
    tipo: z.literal("contaFixa"),
    dados: z.object({
      nome: z.string().trim().min(1),
      valor: z.coerce.number().min(0),
      categoria: z.string().trim().optional(),
      tipoConta: z.enum(["COMPARTILHADA", "INDIVIDUAL"]).optional(),
      pessoaNome: z.string().trim().optional(),
      dataInicio: z.string().trim().optional(),
      observacao: z.string().trim().optional(),
    }),
  }),
  z.object({
    tipo: z.literal("contaVariavel"),
    dados: z.object({
      nome: z.string().trim().min(1),
      valorTotal: z.coerce.number().min(0),
      categoria: z.string().trim().optional(),
      pessoaNome: z.string().trim().min(1),
      data: z.string().trim().optional(),
      parcelas: z.coerce.number().int().min(1).max(360).optional(),
      observacao: z.string().trim().optional(),
    }),
  }),
  z.object({
    tipo: z.literal("meta"),
    dados: z.object({
      nome: z.string().trim().min(1),
      emoji: z.string().trim().optional(),
      valorAlvo: z.coerce.number().positive(),
      valorAtual: z.coerce.number().min(0).optional(),
      contribuicaoMensal: z.coerce.number().min(0).optional().nullable(),
      cor: z.string().trim().optional(),
    }),
  }),
]);

type IntentBruto = z.infer<typeof intentBrutoSchema>;

/** Casa o nome dito pelo usuário com uma pessoa já cadastrada (exato ou parcial). */
function encontrarPessoa(pessoas: PessoaDTO[], nomeBusca: string) {
  const alvo = nomeBusca.trim().toLowerCase();

  return (
    pessoas.find((pessoa) => pessoa.nome.trim().toLowerCase() === alvo) ??
    pessoas.find((pessoa) => {
      const nome = pessoa.nome.trim().toLowerCase();
      return nome.includes(alvo) || alvo.includes(nome);
    })
  );
}

/** Resolve o bruto vindo da IA em um cadastro pronto para salvar, ou um erro para responder ao usuário. */
async function resolverIntent(
  bruto: IntentBruto,
  workspaceId: string,
  mes: string,
): Promise<IntentCadastro | { erro: string }> {
  if (bruto.tipo === "pessoa") {
    return {
      tipo: "pessoa",
      dados: {
        nome: bruto.dados.nome,
        email: bruto.dados.email || undefined,
        salario: bruto.dados.salario ?? 0,
      },
    };
  }

  const pessoas = await listarPessoas(workspaceId);

  if (bruto.tipo === "contaFixa") {
    const tipoConta = bruto.dados.tipoConta === "INDIVIDUAL"
      ? "INDIVIDUAL" as const
      : "COMPARTILHADA" as const;

    let pessoaId: string | null = null;
    let pessoaNome: string | null = null;

    if (tipoConta === "INDIVIDUAL") {
      if (!bruto.dados.pessoaNome) {
        return {
          erro: "Para uma conta fixa individual, diga também de quem é a conta.",
        };
      }

      const encontrada = encontrarPessoa(pessoas, bruto.dados.pessoaNome);

      if (!encontrada) {
        return {
          erro: `Não encontrei "${bruto.dados.pessoaNome}" nas pessoas cadastradas.`,
        };
      }

      pessoaId = encontrada.id;
      pessoaNome = encontrada.nome;
    }

    return {
      tipo: "contaFixa",
      dados: {
        nome: bruto.dados.nome,
        valor: bruto.dados.valor,
        categoria: bruto.dados.categoria?.trim() || "Outros",
        tipoConta,
        pessoaId,
        pessoaNome,
        dataInicio:
          bruto.dados.dataInicio && MES.test(bruto.dados.dataInicio)
            ? bruto.dados.dataInicio
            : mes,
        observacao: bruto.dados.observacao,
      },
    };
  }

  if (bruto.tipo === "contaVariavel") {
    const encontrada = encontrarPessoa(pessoas, bruto.dados.pessoaNome);

    if (!encontrada) {
      return {
        erro: `Não encontrei "${bruto.dados.pessoaNome}" nas pessoas cadastradas.`,
      };
    }

    return {
      tipo: "contaVariavel",
      dados: {
        nome: bruto.dados.nome,
        valorTotal: bruto.dados.valorTotal,
        categoria: bruto.dados.categoria?.trim() || "Outros",
        pessoaId: encontrada.id,
        pessoaNome: encontrada.nome,
        data:
          bruto.dados.data && DATA.test(bruto.dados.data)
            ? bruto.dados.data
            : `${mes}-01`,
        parcelas: bruto.dados.parcelas ?? 1,
        observacao: bruto.dados.observacao,
      },
    };
  }

  return {
    tipo: "meta",
    dados: {
      nome: bruto.dados.nome,
      emoji: bruto.dados.emoji?.trim() || "🎯",
      valorAlvo: bruto.dados.valorAlvo,
      valorAtual: bruto.dados.valorAtual ?? 0,
      contribuicaoMensal: bruto.dados.contribuicaoMensal ?? null,
      cor:
        bruto.dados.cor && COR.test(bruto.dados.cor)
          ? bruto.dados.cor
          : "#10b981",
    },
  };
}

export async function perguntarIa(
  pergunta: string,
  mes: string,
): Promise<{ ok: boolean; resposta: string; intent?: IntentCadastro }> {
  const texto = pergunta.trim();

  if (!texto) {
    return { ok: false, resposta: "Escreva uma pergunta." };
  }

  const contexto = await obterContexto();

  const configuracao = await prisma.configuracao.findUnique({
    where: { workspaceId: contexto.workspaceId },
    select: { poeApiKey: true },
  });

  if (!configuracao?.poeApiKey) {
    return {
      ok: false,
      resposta:
        "Token da Poe não configurado. Vá em **Perfil → Token da Poe IA** para cadastrar.",
    };
  }

  const [pessoas, contasFixas, contasVariaveis] = await Promise.all([
    listarPessoas(contexto.workspaceId),
    listarContasFixas(contexto.workspaceId),
    listarContasVariaveis(contexto.workspaceId),
  ]);

  const prompt = [
    "Você é um assistente financeiro familiar.",
    "",
    `Pessoas: ${JSON.stringify(
      pessoas.map(({ nome, salario }) => ({ nome, salario })),
    )}`,
    "",
    `Contas Fixas: ${JSON.stringify(contasFixas)}`,
    "",
    `Contas Variáveis: ${JSON.stringify(contasVariaveis)}`,
    "",
    `Mês selecionado no app agora: ${mes}`,
    "",
    "Além de responder perguntas, você pode CADASTRAR uma pessoa, conta fixa,",
    "conta variável ou meta quando o usuário pedir (\"adiciona\", \"cria\",",
    "\"cadastra\", etc). Quando identificar esse pedido E tiver todos os dados",
    "obrigatórios, responda SOMENTE com o bloco abaixo, sem nenhum outro texto:",
    "",
    "@@CADASTRO@@",
    '{"tipo": "pessoa|contaFixa|contaVariavel|meta", "dados": { ... }}',
    "@@FIM@@",
    "",
    "Formato de \"dados\" por tipo:",
    '- pessoa: { "nome": string, "email"?: string, "salario"?: number }',
    '- contaFixa: { "nome": string, "valor": number, "categoria"?: string, "tipoConta"?: "COMPARTILHADA"|"INDIVIDUAL", "pessoaNome"?: string, "dataInicio"?: "AAAA-MM", "observacao"?: string }',
    '- contaVariavel: { "nome": string, "valorTotal": number, "categoria"?: string, "pessoaNome": string, "data"?: "AAAA-MM-DD", "parcelas"?: number, "observacao"?: string }',
    '- meta: { "nome": string, "emoji"?: string, "valorAlvo": number, "valorAtual"?: number, "contribuicaoMensal"?: number, "cor"?: "#rrggbb" }',
    "",
    "Regras do cadastro:",
    '- "tipoConta" só é "INDIVIDUAL" se o usuário citar uma pessoa específica para a conta fixa; nesse caso "pessoaNome" é obrigatório.',
    '- Em contaVariavel, "pessoaNome" é sempre obrigatório — use exatamente um dos nomes já cadastrados listados acima.',
    "- Se faltar alguma informação obrigatória (valor, nome, ou a pessoa de uma conta variável), NÃO gere o bloco @@CADASTRO@@: responda normalmente pedindo o que falta.",
    "- Se a mensagem não for um pedido de cadastro, ignore essas instruções e responda a pergunta normalmente.",
    "",
    `Pergunta: ${texto}`,
    "",
    "Responda em português de forma clara e objetiva.",
  ].join("\n");

  try {
    const resposta = await fetch(POE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${configuracao.poeApiKey}`,
      },
      body: JSON.stringify({ model: MODELO, input: prompt }),
    });

    if (!resposta.ok) {
      return {
        ok: false,
        resposta: `A API da Poe respondeu com erro ${resposta.status}.`,
      };
    }

    const dados = await resposta.json();

    const conteudo =
      dados?.output?.[0]?.content?.[0]?.text ??
      dados?.output_text ??
      dados?.text ??
      "";

    const cadastro = conteudo.match(/@@CADASTRO@@([\s\S]*?)@@FIM@@/);

    if (cadastro) {
      try {
        const bloco = cadastro[1]
          .trim()
          .replace(/^```(json)?/i, "")
          .replace(/```$/, "")
          .trim();

        const bruto = intentBrutoSchema.parse(JSON.parse(bloco));
        const resolvido = await resolverIntent(bruto, contexto.workspaceId, mes);

        if ("erro" in resolvido) {
          return { ok: true, resposta: resolvido.erro };
        }

        return {
          ok: true,
          resposta: "Encontrei os dados abaixo. Confira e confirme:",
          intent: resolvido,
        };
      } catch {
        return {
          ok: true,
          resposta: "Não consegui entender os dados para cadastrar. Pode detalhar de novo?",
        };
      }
    }

    return { ok: true, resposta: conteudo || "Sem resposta." };
  } catch {
    return { ok: false, resposta: "Erro ao comunicar com a IA." };
  }
}

const contasDetectadasSchema = z.array(
  z.object({
    nome: z.string().trim().min(1),
    valor: z.coerce.number().min(0),
  }),
);

/** Cria em lote as contas fixas que o assistente extraiu do texto. */
export async function criarContasDetectadas(
  contas: unknown,
  mes: string,
): Promise<{ ok: boolean; mensagem: string }> {
  const parsed = contasDetectadasSchema.safeParse(contas);

  if (!parsed.success || parsed.data.length === 0) {
    return { ok: false, mensagem: "Nenhuma conta válida para adicionar." };
  }

  const { workspaceId } = await obterContexto();

  await prisma.contaFixa.createMany({
    data: parsed.data.map((conta) => ({
      nome: conta.nome,
      valor: conta.valor,
      categoria: "Outros",
      tipo: "COMPARTILHADA" as const,
      dataInicio: mes,
      observacao: "Adicionado via IA",
      workspaceId,
    })),
  });

  revalidatePath("/contas-fixas");
  revalidatePath("/dashboard");

  return {
    ok: true,
    mensagem: `${parsed.data.length} conta(s) adicionada(s).`,
  };
}
