"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import type { ResultadoAcao } from "@/lib/tipos";
import { obterContexto } from "@/lib/workspace";

/** A chave pública vai para o cliente; sem ela o navegador nem se inscreve. */
export async function pushConfigurado() {
  return Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY,
  );
}

export async function salvarInscricao(dados: {
  endpoint: string;
  p256dh: string;
  auth: string;
  diasAntes?: number;
  resumoDiario?: boolean;
}): Promise<ResultadoAcao> {
  const { workspaceId, userId } = await obterContexto();

  const { endpoint, p256dh, auth } = dados;

  if (!endpoint || !p256dh || !auth) {
    return { ok: false, mensagem: "Inscrição inválida." };
  }

  const diasAntes = Math.min(15, Math.max(0, dados.diasAntes ?? 3));

  // O endpoint identifica o aparelho: reinscrever o mesmo atualiza, não duplica.
  await prisma.inscricaoPush.upsert({
    where: { endpoint },
    update: {
      p256dh,
      auth,
      userId,
      workspaceId,
      diasAntes,
      resumoDiario: dados.resumoDiario ?? true,
    },
    create: {
      endpoint,
      p256dh,
      auth,
      userId,
      workspaceId,
      diasAntes,
      resumoDiario: dados.resumoDiario ?? true,
    },
  });

  revalidatePath("/perfil");

  return { ok: true, mensagem: "Avisos ligados neste aparelho." };
}

export async function removerInscricao(
  endpoint: string,
): Promise<ResultadoAcao> {
  const { userId } = await obterContexto();

  await prisma.inscricaoPush.deleteMany({ where: { endpoint, userId } });

  revalidatePath("/perfil");

  return { ok: true, mensagem: "Avisos desligados neste aparelho." };
}

/** Quantos aparelhos deste usuário estão recebendo avisos. */
export async function contarInscricoes() {
  const { userId } = await obterContexto();

  return prisma.inscricaoPush.count({ where: { userId } });
}

/**
 * Dispara um aviso agora, para a pessoa conferir se chega. Sem isso, só
 * dava para testar esperando o horário do agendador.
 */
export async function enviarTeste(): Promise<ResultadoAcao> {
  const { userId } = await obterContexto();

  const inscricoes = await prisma.inscricaoPush.findMany({ where: { userId } });

  if (inscricoes.length === 0) {
    return { ok: false, mensagem: "Nenhum aparelho inscrito." };
  }

  const { enviarPush } = await import("@/lib/push");

  const enviados = await enviarPush(inscricoes, {
    titulo: "🐷 Fyntra",
    corpo: "Deu certo! É assim que os avisos vão chegar.",
    tag: "teste",
  });

  return {
    ok: enviados > 0,
    mensagem:
      enviados > 0
        ? `Aviso enviado para ${enviados} aparelho(s).`
        : "Não foi possível enviar. Verifique as chaves de notificação.",
  };
}
