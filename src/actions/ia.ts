"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  listarContasFixas,
  listarContasVariaveis,
  listarPessoas,
} from "@/lib/dados";
import { prisma } from "@/lib/prisma";
import { obterContexto } from "@/lib/workspace";

const POE_URL = "https://api.poe.com/v1/responses";
const MODELO = "gpt-4o-mini";

export async function perguntarIa(
  pergunta: string,
): Promise<{ ok: boolean; resposta: string }> {
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
