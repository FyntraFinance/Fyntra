"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { ResultadoAcao } from "@/lib/tipos";
import {
  eventoSchema,
  gastoEventoSchema,
  participanteEventoSchema,
  primeiroErro,
} from "@/lib/validators";
import { obterContexto } from "@/lib/workspace";

function revalidar() {
  revalidatePath("/dashboard");
  revalidatePath("/contas-variaveis");
}

/** Garante que o evento é do workspace de quem está logado. */
async function eventoDoWorkspace(eventoId: string, workspaceId: string) {
  return prisma.evento.findFirst({
    where: { id: eventoId, workspaceId },
    select: { id: true, nome: true },
  });
}

/**
 * Reescreve as cotas do evento: cada gasto é dividido igualmente entre TODOS
 * os participantes, mas só vira lançamento (conta variável) para quem está
 * vinculado a uma pessoa da família — convidado de fora apenas aumenta o
 * divisor. Apagar e recriar mantém tudo coerente quando entra ou sai gente.
 */
async function sincronizarCotas(
  tx: Prisma.TransactionClient,
  eventoId: string,
) {
  const evento = await tx.evento.findUnique({
    where: { id: eventoId },
    include: {
      participantes: { select: { pessoaId: true } },
      gastos: true,
    },
  });

  if (!evento) return;

  await tx.contaVariavel.deleteMany({
    where: { gastoEventoId: { in: evento.gastos.map((gasto) => gasto.id) } },
  });

  const divisor = evento.participantes.length;

  if (divisor === 0) return;

  const pessoas = evento.participantes
    .map((participante) => participante.pessoaId)
    .filter((pessoaId): pessoaId is string => Boolean(pessoaId));

  if (pessoas.length === 0) return;

  for (const gasto of evento.gastos) {
    const cota = Number(gasto.valor) / divisor;
    const mes = gasto.data.slice(0, 7);

    await tx.contaVariavel.createMany({
      data: pessoas.map((pessoaId) => ({
        nome: `${evento.emoji} ${evento.nome} — ${gasto.nome}`,
        valorTotal: cota,
        valorParcela: cota,
        categoria: gasto.categoria,
        pessoaId,
        data: gasto.data,
        mesInicio: mes,
        mesFim: mes,
        parcelas: 1,
        observacao: `Cota do evento ${evento.nome} (dividido por ${divisor})`,
        workspaceId: evento.workspaceId,
        gastoEventoId: gasto.id,
      })),
    });
  }
}

export async function salvarEvento(dados: {
  id?: string;
  nome: string;
  emoji: string;
  descricao?: string;
  dataInicio: string;
  dataFim?: string;
}): Promise<ResultadoAcao> {
  const parsed = eventoSchema.safeParse(dados);

  if (!parsed.success) {
    return { ok: false, mensagem: primeiroErro(parsed.error) };
  }

  const { workspaceId } = await obterContexto();
  const { id, nome, emoji, descricao, dataInicio, dataFim } = parsed.data;

  if (dataFim && dataFim < dataInicio) {
    return { ok: false, mensagem: "A data final é anterior à inicial." };
  }

  const campos = {
    nome,
    emoji: emoji || "🧳",
    descricao: descricao || null,
    dataInicio,
    dataFim: dataFim || null,
  };

  if (id) {
    if (!(await eventoDoWorkspace(id, workspaceId))) {
      return { ok: false, mensagem: "Evento não encontrado." };
    }

    // O nome do evento aparece nas cotas: renomear obriga a regravá-las.
    await prisma.$transaction(async (tx) => {
      await tx.evento.update({ where: { id }, data: campos });
      await sincronizarCotas(tx, id);
    });

    revalidar();

    return { ok: true, mensagem: "Evento atualizado." };
  }

  await prisma.evento.create({ data: { ...campos, workspaceId } });

  revalidar();

  return { ok: true, mensagem: "Evento criado. Agora adicione quem vai." };
}

export async function encerrarEvento(
  id: string,
  encerrado: boolean,
): Promise<ResultadoAcao> {
  const { workspaceId } = await obterContexto();

  const resultado = await prisma.evento.updateMany({
    where: { id, workspaceId },
    data: { encerrado },
  });

  if (resultado.count === 0) {
    return { ok: false, mensagem: "Evento não encontrado." };
  }

  revalidar();

  return {
    ok: true,
    mensagem: encerrado ? "Evento encerrado." : "Evento reaberto.",
  };
}

export async function removerEvento(id: string): Promise<ResultadoAcao> {
  const { workspaceId } = await obterContexto();

  const resultado = await prisma.evento.deleteMany({
    where: { id, workspaceId },
  });

  if (resultado.count === 0) {
    return { ok: false, mensagem: "Evento não encontrado." };
  }

  revalidar();

  return { ok: true, mensagem: "Evento removido com os gastos dele." };
}

export async function adicionarParticipante(dados: {
  eventoId: string;
  nome: string;
  pessoaId?: string | null;
}): Promise<ResultadoAcao> {
  const parsed = participanteEventoSchema.safeParse(dados);

  if (!parsed.success) {
    return { ok: false, mensagem: primeiroErro(parsed.error) };
  }

  const { workspaceId } = await obterContexto();
  const { eventoId, nome, pessoaId } = parsed.data;

  if (!(await eventoDoWorkspace(eventoId, workspaceId))) {
    return { ok: false, mensagem: "Evento não encontrado." };
  }

  if (pessoaId) {
    const pessoa = await prisma.pessoa.findFirst({
      where: { id: pessoaId, workspaceId },
      select: { id: true },
    });

    if (!pessoa) {
      return { ok: false, mensagem: "Pessoa inválida." };
    }

    const repetida = await prisma.participanteEvento.findFirst({
      where: { eventoId, pessoaId },
      select: { id: true },
    });

    if (repetida) {
      return { ok: false, mensagem: "Essa pessoa já está no evento." };
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.participanteEvento.create({
      data: { eventoId, nome, pessoaId },
    });

    await sincronizarCotas(tx, eventoId);
  });

  revalidar();

  return { ok: true, mensagem: `${nome} entrou na divisão.` };
}

export async function removerParticipante(
  participanteId: string,
): Promise<ResultadoAcao> {
  const { workspaceId } = await obterContexto();

  const participante = await prisma.participanteEvento.findFirst({
    where: { id: participanteId, evento: { workspaceId } },
    select: { id: true, eventoId: true },
  });

  if (!participante) {
    return { ok: false, mensagem: "Participante não encontrado." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.participanteEvento.delete({ where: { id: participante.id } });
    await sincronizarCotas(tx, participante.eventoId);
  });

  revalidar();

  return { ok: true, mensagem: "Participante removido e cotas refeitas." };
}

export async function salvarGastoEvento(dados: {
  id?: string;
  eventoId: string;
  nome: string;
  valor: number | string;
  categoria: string;
  data: string;
  observacao?: string;
}): Promise<ResultadoAcao> {
  const parsed = gastoEventoSchema.safeParse(dados);

  if (!parsed.success) {
    return { ok: false, mensagem: primeiroErro(parsed.error) };
  }

  const { workspaceId } = await obterContexto();
  const { id, eventoId, nome, valor, categoria, data, observacao } =
    parsed.data;

  if (!(await eventoDoWorkspace(eventoId, workspaceId))) {
    return { ok: false, mensagem: "Evento não encontrado." };
  }

  const campos = {
    nome,
    valor,
    categoria,
    data,
    observacao: observacao || null,
  };

  if (id) {
    const atual = await prisma.gastoEvento.findFirst({
      where: { id, eventoId, workspaceId },
      select: { id: true },
    });

    if (!atual) {
      return { ok: false, mensagem: "Gasto não encontrado." };
    }
  }

  await prisma.$transaction(async (tx) => {
    if (id) {
      await tx.gastoEvento.update({ where: { id }, data: campos });
    } else {
      await tx.gastoEvento.create({
        data: { ...campos, eventoId, workspaceId },
      });
    }

    await sincronizarCotas(tx, eventoId);
  });

  revalidar();

  return { ok: true, mensagem: "Gasto do evento salvo e dividido." };
}

export async function removerGastoEvento(
  id: string,
): Promise<ResultadoAcao> {
  const { workspaceId } = await obterContexto();

  const gasto = await prisma.gastoEvento.findFirst({
    where: { id, workspaceId },
    select: { id: true },
  });

  if (!gasto) {
    return { ok: false, mensagem: "Gasto não encontrado." };
  }

  // As cotas têm `onDelete: Cascade` — somem junto com o gasto.
  await prisma.gastoEvento.delete({ where: { id } });

  revalidar();

  return { ok: true, mensagem: "Gasto removido." };
}
