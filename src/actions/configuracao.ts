"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import type { ResultadoAcao } from "@/lib/tipos";
import { obterContexto, podeAdministrar } from "@/lib/workspace";

function revalidarTudo() {
  revalidatePath("/dashboard");
  revalidatePath("/pessoas");
  revalidatePath("/contas-fixas");
  revalidatePath("/contas-variaveis");
  revalidatePath("/perfil");
}

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

