"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { adicionarMeses, obterMesAtual } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import type { ResultadoAcao } from "@/lib/tipos";
import { primeiroErro, tokenIaSchema } from "@/lib/validators";
import { obterContexto, podeAdministrar } from "@/lib/workspace";

function revalidarTudo() {
  revalidatePath("/dashboard");
  revalidatePath("/pessoas");
  revalidatePath("/contas-fixas");
  revalidatePath("/contas-variaveis");
  revalidatePath("/perfil");
}

export async function salvarTokenIa(token: string): Promise<ResultadoAcao> {
  const parsed = tokenIaSchema.safeParse({ token });

  if (!parsed.success) {
    return { ok: false, mensagem: primeiroErro(parsed.error) };
  }

  const { workspaceId } = await obterContexto();

  await prisma.configuracao.upsert({
    where: { workspaceId },
    create: { workspaceId, poeApiKey: parsed.data.token },
    update: { poeApiKey: parsed.data.token },
  });

  revalidatePath("/perfil");

  return { ok: true, mensagem: "Token salvo com sucesso!" };
}

export async function limparTokenIa(): Promise<ResultadoAcao> {
  const { workspaceId } = await obterContexto();

  await prisma.configuracao.upsert({
    where: { workspaceId },
    create: { workspaceId },
    update: { poeApiKey: null },
  });

  revalidatePath("/perfil");

  return { ok: true, mensagem: "Token removido." };
}

/**
 * Consentimento da família para que a contabilidade veja os dados financeiros
 * no painel contábil. Desligado, a família deixa de aparecer para o ADMIN do
 * sistema. Só quem administra o workspace decide por todos.
 */
export async function definirCompartilhamentoContadora(
  compartilhar: boolean,
): Promise<ResultadoAcao> {
  const { workspaceId, role } = await obterContexto();

  if (!podeAdministrar(role)) {
    return {
      ok: false,
      mensagem: "Apenas o dono ou um administrador da família pode alterar isso.",
    };
  }

  await prisma.configuracao.upsert({
    where: { workspaceId },
    create: { workspaceId, compartilharComContadora: compartilhar },
    update: { compartilharComContadora: compartilhar },
  });

  revalidatePath("/perfil");
  revalidatePath("/admin");

  return {
    ok: true,
    mensagem: compartilhar
      ? "Compartilhamento com a contabilidade ativado."
      : "Compartilhamento desativado. Seus dados não aparecem mais para a contabilidade.",
  };
}

export async function zerarDados(): Promise<ResultadoAcao> {
  const { workspaceId } = await obterContexto();

  await prisma.$transaction([
    prisma.contaVariavel.deleteMany({ where: { workspaceId } }),
    prisma.contaFixa.deleteMany({ where: { workspaceId } }),
    prisma.meta.deleteMany({ where: { workspaceId } }),
    prisma.convite.deleteMany({ where: { workspaceId } }),
    prisma.pessoa.deleteMany({ where: { workspaceId } }),
    prisma.configuracao.updateMany({
      where: { workspaceId },
      data: { poeApiKey: null, divisaoPorSalario: false },
    }),
  ]);

  revalidarTudo();

  return { ok: true, mensagem: "Todos os dados foram apagados." };
}

export async function obterBackup() {
  const { workspaceId } = await obterContexto();

  const [pessoas, contasFixas, contasVariaveis, metas] = await Promise.all([
    prisma.pessoa.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "asc" },
    }),
    prisma.contaFixa.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "asc" },
    }),
    prisma.contaVariavel.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "asc" },
    }),
    prisma.meta.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return {
    versao: 2,
    exportadoEm: new Date().toISOString(),
    pessoas: pessoas.map((p) => ({
      id: p.id,
      nome: p.nome,
      email: p.email,
      salario: Number(p.salario),
    })),
    contasFixas: contasFixas.map((c) => ({
      id: c.id,
      nome: c.nome,
      valor: Number(c.valor),
      categoria: c.categoria,
      tipo: c.tipo,
      pessoaId: c.pessoaId,
      dataInicio: c.dataInicio,
      observacao: c.observacao,
    })),
    contasVariaveis: contasVariaveis.map((c) => ({
      id: c.id,
      nome: c.nome,
      valorTotal: Number(c.valorTotal),
      valorParcela: Number(c.valorParcela),
      categoria: c.categoria,
      pessoaId: c.pessoaId,
      data: c.data,
      parcelas: c.parcelas,
      observacao: c.observacao,
    })),
    metas: metas.map((m) => ({
      id: m.id,
      nome: m.nome,
      emoji: m.emoji,
      valorAlvo: Number(m.valorAlvo),
      valorAtual: Number(m.valorAtual),
      contribuicaoMensal:
        m.contribuicaoMensal === null ? null : Number(m.contribuicaoMensal),
      cor: m.cor,
    })),
  };
}

const numero = z.coerce.number().default(0);
const texto = z.string().trim().default("");

/** Aceita tanto o backup do app antigo (localStorage) quanto o novo. */
const backupSchema = z.object({
  pessoas: z
    .array(
      z.object({
        id: z.string().optional(),
        nome: texto,
        email: z.string().trim().optional().nullable(),
        salario: numero,
      }),
    )
    .default([]),

  contasFixas: z
    .array(
      z.object({
        nome: texto,
        valor: numero,
        categoria: z.string().trim().default("Outros"),
        tipo: z.string().trim().default("COMPARTILHADA"),
        pessoaId: z.string().optional().nullable(),
        dataInicio: z.string().optional().nullable(),
        observacao: z.string().optional().nullable(),
      }),
    )
    .default([]),

  contasVariaveis: z
    .array(
      z.object({
        nome: texto,
        valorTotal: numero,
        categoria: z.string().trim().default("Outros"),
        pessoaId: z.string().optional().nullable(),
        data: z.string().optional().nullable(),
        parcelas: z.coerce.number().int().min(1).default(1),
        observacao: z.string().optional().nullable(),
      }),
    )
    .default([]),

  metas: z
    .array(
      z.object({
        nome: texto,
        emoji: z.string().trim().default("🎯"),
        valorAlvo: numero,
        valorAtual: numero,
        contribuicaoMensal: z.coerce.number().nullable().optional(),
        cor: z.string().trim().default("#10b981"),
      }),
    )
    .default([]),
});

export async function importarBackup(
  conteudo: unknown,
): Promise<ResultadoAcao> {
  const parsed = backupSchema.safeParse(conteudo);

  if (!parsed.success) {
    return { ok: false, mensagem: "Arquivo de backup inválido." };
  }

  const { workspaceId } = await obterContexto();
  const dados = parsed.data;

  const mesPadrao = obterMesAtual();
  const hoje = new Date().toISOString().slice(0, 10);

  await prisma.$transaction(async (tx) => {
    await tx.contaVariavel.deleteMany({ where: { workspaceId } });
    await tx.contaFixa.deleteMany({ where: { workspaceId } });
    await tx.meta.deleteMany({ where: { workspaceId } });
    await tx.pessoa.deleteMany({ where: { workspaceId } });

    const mapaPessoas = new Map<string, string>();

    for (const pessoa of dados.pessoas) {
      if (!pessoa.nome) continue;

      const criada = await tx.pessoa.create({
        data: {
          nome: pessoa.nome,
          email: pessoa.email || null,
          salario: pessoa.salario,
          workspaceId,
        },
        select: { id: true },
      });

      if (pessoa.id) {
        mapaPessoas.set(pessoa.id, criada.id);
      }
    }

    for (const conta of dados.contasFixas) {
      if (!conta.nome) continue;

      const individual = conta.tipo.toUpperCase() === "INDIVIDUAL";

      const pessoaId = conta.pessoaId
        ? mapaPessoas.get(conta.pessoaId) ?? null
        : null;

      await tx.contaFixa.create({
        data: {
          nome: conta.nome,
          valor: conta.valor,
          categoria: conta.categoria,
          tipo: individual && pessoaId ? "INDIVIDUAL" : "COMPARTILHADA",
          pessoaId: individual ? pessoaId : null,
          dataInicio: conta.dataInicio || mesPadrao,
          observacao: conta.observacao || null,
          workspaceId,
        },
      });
    }

    for (const conta of dados.contasVariaveis) {
      if (!conta.nome) continue;

      const pessoaId = conta.pessoaId
        ? mapaPessoas.get(conta.pessoaId)
        : undefined;

      // Conta variável exige pessoa: sem vínculo válido, o lançamento é ignorado.
      if (!pessoaId) continue;

      const data = conta.data || hoje;
      const mesInicio = data.slice(0, 7);

      await tx.contaVariavel.create({
        data: {
          nome: conta.nome,
          valorTotal: conta.valorTotal,
          valorParcela: conta.valorTotal / conta.parcelas,
          categoria: conta.categoria,
          pessoaId,
          data,
          mesInicio,
          mesFim: adicionarMeses(mesInicio, conta.parcelas - 1),
          parcelas: conta.parcelas,
          observacao: conta.observacao || null,
          workspaceId,
        },
      });
    }

    for (const meta of dados.metas) {
      if (!meta.nome) continue;

      await tx.meta.create({
        data: {
          nome: meta.nome,
          emoji: meta.emoji || "🎯",
          valorAlvo: meta.valorAlvo,
          valorAtual: meta.valorAtual,
          contribuicaoMensal: meta.contribuicaoMensal ?? null,
          cor: meta.cor,
          workspaceId,
        },
      });
    }
  });

  revalidarTudo();

  return { ok: true, mensagem: "Dados importados com sucesso!" };
}
