"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { normalizarMes } from "@/lib/format";
import { COOKIE_MES } from "@/lib/mes";

const UM_ANO = 60 * 60 * 24 * 365;

export async function selecionarMes(mes: string, pathname: string) {
  const armazenados = await cookies();

  armazenados.set(COOKIE_MES, normalizarMes(mes), {
    path: "/",
    maxAge: UM_ANO,
    sameSite: "lax",
  });

  revalidatePath(pathname);
}
