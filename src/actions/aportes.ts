"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import type { ResultadoAcao } from "@/lib/tipos";
import { aporteSchema, primeiroErro } from "@/lib/validators";
import { obterContexto } from "@/lib/workspace";

function revalidar() {
  revalidatePath("/dashboard");
  revalidatePath("/perfil");
}

/**
 * Registra dinheiro guardado para uma meta. São dois efeitos no mesmo ato: o
 * valor entra na meta e sai do caixa do mês, por isso a transação — deixar o
 * lançamento sem a meta (ou o contrário) desencontraria o saldo.
 */
export async function registrarAporte(dados: {
  metaId: string;
  valor: number | string;
  data: string;
  pessoaId?: string | null;
  observacao?: string;
}): Promise<ResultadoAcao> {
  const parsed = aporteSchema.safeParse(dados);

  if (!parsed.success) {
    return { ok: false, mensagem: primeiroErro(parsed.error) };
  }

  const { workspaceId } = await obterContexto();
  const { metaId, valor, data, pessoaId, observacao } = parsed.data;

  if (valor <= 0) {
    return { ok: false, mensagem: "Informe um valor maior que zero." };
  }

  const meta = await prisma.meta.findFirst({
    where: { id: metaId, workspaceId },
    select: { id: true, nome: true },
  });

  if (!meta) {
    return { ok: false, mensagem: "Meta não encontrada." };
  }

  if (pessoaId) {
    const pessoa = await prisma.pessoa.findFirst({
      where: { id: pessoaId, workspaceId },
      select: { id: true },
    });

    if (!pessoa) {
      return { ok: false, mensagem: "Pessoa inválida." };
    }
  }

  await prisma.$transaction([
    prisma.aporteMeta.create({
      data: {
        metaId,
        valor,
        data,
        mes: data.slice(0, 7),
        pessoaId,
        observacao: observacao || null,
        workspaceId,
      },
    }),

    prisma.meta.update({
      where: { id: metaId },
      data: { valorAtual: { increment: valor } },
    }),
  ]);

  revalidar();

  return {
    ok: true,
    mensagem: `Guardado em ${meta.nome}. O valor saiu da sobra do mês.`,
  };
}

/** Desfaz um aporte: devolve o valor ao caixa do mês e tira da meta. */
export async function removerAporte(id: string): Promise<ResultadoAcao> {
  const { workspaceId } = await obterContexto();

  const aporte = await prisma.aporteMeta.findFirst({
    where: { id, workspaceId },
    select: { id: true, metaId: true, valor: true },
  });

  if (!aporte) {
    return { ok: false, mensagem: "Aporte não encontrado." };
  }

  await prisma.$transaction([
    prisma.aporteMeta.delete({ where: { id: aporte.id } }),

    prisma.meta.update({
      where: { id: aporte.metaId },
      data: { valorAtual: { decrement: aporte.valor } },
    }),
  ]);

  revalidar();

  return { ok: true, mensagem: "Aporte desfeito." };
}
