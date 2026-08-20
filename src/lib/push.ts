import webpush from "web-push";

import { prisma } from "@/lib/prisma";

/**
 * Envio de Web Push. As chaves VAPID identificam o servidor para o serviço de
 * push do navegador; sem elas configuradas, o envio é ignorado em silêncio em
 * vez de derrubar a rota que chamou.
 */

let configurado = false;

function configurar() {
  if (configurado) return true;

  const publica = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privada = process.env.VAPID_PRIVATE_KEY;

  if (!publica || !privada) return false;

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:contato@fyntra.app",
    publica,
    privada,
  );

  configurado = true;

  return true;
}

export type Aviso = {
  titulo: string;
  corpo: string;
  tag?: string;
  url?: string;
};

type Inscricao = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

/**
 * Manda o aviso para cada aparelho. Inscrição que o serviço recusa com 404 ou
 * 410 está morta (app desinstalado, permissão revogada) e é apagada — senão a
 * lista só cresce com endereços que nunca mais respondem.
 */
export async function enviarPush(
  inscricoes: Inscricao[],
  aviso: Aviso,
): Promise<number> {
  if (!configurar()) return 0;

  const conteudo = JSON.stringify(aviso);

  let enviados = 0;
  const mortas: string[] = [];

  await Promise.all(
    inscricoes.map(async (inscricao) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: inscricao.endpoint,
            keys: { p256dh: inscricao.p256dh, auth: inscricao.auth },
          },
          conteudo,
        );

        enviados++;
      } catch (erro) {
        const status = (erro as { statusCode?: number }).statusCode;

        if (status === 404 || status === 410) {
          mortas.push(inscricao.id);
        }
      }
    }),
  );

  if (mortas.length > 0) {
    await prisma.inscricaoPush.deleteMany({ where: { id: { in: mortas } } });
  }

  return enviados;
}
