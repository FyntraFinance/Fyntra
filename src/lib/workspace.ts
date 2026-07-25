import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type Contexto = {
  userId: string;
  userNome: string;
  userEmail: string;
  workspaceId: string;
  workspaceNome: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
};

/**
 * Contexto de toda leitura/escrita: quem está logado e em qual workspace.
 * Um usuário sem workspace ganha um na hora — evita telas vazias caso o
 * cadastro tenha sido interrompido no meio.
 */
export async function obterContexto(): Promise<Contexto> {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  const membro = await prisma.workspaceMembro.findFirst({
    where: { userId },
    orderBy: { joinedAt: "asc" },
    include: {
      workspace: { select: { id: true, nome: true } },
      user: { select: { name: true, email: true } },
    },
  });

  if (membro) {
    return {
      userId,
      userNome: membro.user.name ?? "Você",
      userEmail: membro.user.email,
      workspaceId: membro.workspace.id,
      workspaceNome: membro.workspace.nome,
      role: membro.role,
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });

  if (!user) {
    redirect("/login");
  }

  const workspace = await prisma.workspace.create({
    data: {
      nome: user.name ? `Família ${user.name.split(" ")[0]}` : "Minha Família",
      membros: {
        create: { userId, role: "OWNER" },
      },
      configuracao: { create: {} },
    },
    select: { id: true, nome: true },
  });

  return {
    userId,
    userNome: user.name ?? "Você",
    userEmail: user.email,
    workspaceId: workspace.id,
    workspaceNome: workspace.nome,
    role: "OWNER",
  };
}

/** Só OWNER e ADMIN podem convidar ou remover membros. */
export function podeAdministrar(role: Contexto["role"]) {
  return role === "OWNER" || role === "ADMIN";
}
