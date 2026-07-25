import { cookies } from "next/headers";

import { normalizarMes } from "@/lib/format";

export const COOKIE_MES = "fyntra_mes";

/**
 * O mês em foco vive num cookie, não na query string: o layout precisa dele
 * para o cabeçalho, e layouts do App Router não recebem searchParams — ler
 * pela query obrigaria a suspender toda a árvore até a hidratação.
 */
export async function obterMesSelecionado() {
  const armazenados = await cookies();

  return normalizarMes(armazenados.get(COOKIE_MES)?.value);
}
