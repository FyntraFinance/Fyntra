"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import type { ResultadoAcao } from "@/lib/tipos";
import { ganhoExtraSchema, primeiroErro } from "@/lib/validators";
import { obterContexto } from "@/lib/workspace";

function revalidar() {
  revalidatePath("/dashboard");
  revalidatePath("/perfil");
}

export async function salvarGanhoExtra(dados: {
  id?: string;
  nome: string;
  valor: number | string;
  categoria: string;
  pessoaId: string;
  data: string;
  recorrente?: boolean;
  observacao?: string;
}): Promise<ResultadoAcao> {
  const parsed = ganhoExtraSchema.safeParse(dados);

  if (!parsed.success) {
    return { ok: false, mensagem: primeiroErro(parsed.error) };
  }

  const { workspaceId } = await obterContexto();
  const {
    id,
    nome,
    valor,
    categoria,
    pessoaId,
    data,
    recorrente,
    observacao,
  } = parsed.data;

  const pessoa = await prisma.pessoa.findFirst({
    where: { id: pessoaId, workspaceId },
    select: { id: true },
  });

  if (!pessoa) {
    return { ok: false, mensagem: "Selecione uma pessoa válida." };
  }

  const campos = {
    nome,
    valor,
    categoria,
    pessoaId,
    data,
    mes: data.slice(0, 7),
    recorrente,
    observacao: observacao || null,
  };

  if (id) {
    const atual = await prisma.ganhoExtra.findFirst({
      where: { id, workspaceId },
      select: { id: true },
    });

    if (!atual) {
      return { ok: false, mensagem: "Ganho não encontrado." };
    }

    await prisma.ganhoExtra.update({ where: { id }, data: campos });
  } else {
    await prisma.ganhoExtra.create({ data: { ...campos, workspaceId } });
  }

  revalidar();

  return { ok: true, mensagem: "Ganho extra salvo." };
}

export async function removerGanhoExtra(id: string): Promise<ResultadoAcao> {
  const { workspaceId } = await obterContexto();

  const resultado = await prisma.ganhoExtra.deleteMany({
    where: { id, workspaceId },
  });

  if (resultado.count === 0) {
    return { ok: false, mensagem: "Ganho não encontrado." };
  }

  revalidar();

  return { ok: true, mensagem: "Ganho removido." };
}
