"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import type { ResultadoAcao } from "@/lib/tipos";
import { metaSchema, primeiroErro } from "@/lib/validators";
import { obterContexto } from "@/lib/workspace";

function revalidar() {
  revalidatePath("/perfil");
  revalidatePath("/dashboard");
}

export async function salvarMeta(dados: {
  id?: string;
  nome: string;
  emoji: string;
  valorAlvo: number | string;
  valorAtual: number | string;
  contribuicaoMensal: number | string | null;
  cor: string;
}): Promise<ResultadoAcao> {
  const parsed = metaSchema.safeParse(dados);

  if (!parsed.success) {
    return { ok: false, mensagem: primeiroErro(parsed.error) };
  }

  const { workspaceId } = await obterContexto();
  const { id, nome, emoji, valorAlvo, valorAtual, cor } = parsed.data;

  const contribuicaoMensal = parsed.data.contribuicaoMensal ?? null;

  const campos = {
    nome,
    emoji: emoji || "🎯",
    valorAlvo,
    valorAtual,
    contribuicaoMensal,
    cor,
  };

  if (id) {
    const atual = await prisma.meta.findFirst({
      where: { id, workspaceId },
      select: { id: true },
    });

    if (!atual) {
      return { ok: false, mensagem: "Meta não encontrada." };
    }

    await prisma.meta.update({ where: { id }, data: campos });

    revalidar();

    return { ok: true, mensagem: "Meta atualizada!" };
  }

  await prisma.meta.create({ data: { ...campos, workspaceId } });

  revalidar();

  return { ok: true, mensagem: "Meta criada!" };
}

export async function removerMeta(id: string): Promise<ResultadoAcao> {
  const { workspaceId } = await obterContexto();

  const resultado = await prisma.meta.deleteMany({
    where: { id, workspaceId },
  });

  if (resultado.count === 0) {
    return { ok: false, mensagem: "Meta não encontrada." };
  }

  revalidar();

  return { ok: true, mensagem: "Meta excluída." };
}
