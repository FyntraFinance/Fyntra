import { prisma } from "@/lib/prisma";
import type { MembroDTO } from "@/lib/tipos";

export type FamiliaResumo = {
  id: string;
  nome: string;
  criadaEm: string;
  totalPessoas: number;
  totalMembros: number;
  dono: { nome: string | null; email: string } | null;
};

/** Lista todas as famílias (workspaces) do sistema, para o painel do admin. */
export async function listarFamiliasAdmin(
  busca?: string,
): Promise<FamiliaResumo[]> {
  const termo = busca?.trim();

  const workspaces = await prisma.workspace.findMany({
    where: termo
      ? {
          OR: [
            { nome: { contains: termo, mode: "insensitive" } },
            {
              membros: {
                some: {
                  user: {
                    OR: [
                      { name: { contains: termo, mode: "insensitive" } },
                      { email: { contains: termo, mode: "insensitive" } },
                    ],
                  },
                },
              },
            },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { pessoas: true, membros: true } },
      membros: {
        where: { role: "OWNER" },
        take: 1,
        select: { user: { select: { name: true, email: true } } },
      },
    },
  });

  return workspaces.map((workspace) => ({
    id: workspace.id,
    nome: workspace.nome,
    criadaEm: workspace.createdAt.toISOString(),
    totalPessoas: workspace._count.pessoas,
    totalMembros: workspace._count.membros,
    dono: workspace.membros[0]
      ? {
          nome: workspace.membros[0].user.name,
          email: workspace.membros[0].user.email,
        }
      : null,
  }));
}

export type RelatorioFamilia = {
  workspace: { id: string; nome: string; criadaEm: string };
  membros: MembroDTO[];
} | null;

/** Dados básicos da família (nome + quem tem acesso), sem escopo por usuário logado. */
export async function obterFamilia(workspaceId: string): Promise<RelatorioFamilia> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: {
      id: true,
      nome: true,
      createdAt: true,
      membros: {
        orderBy: { joinedAt: "asc" },
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });

  if (!workspace) return null;

  return {
    workspace: {
      id: workspace.id,
      nome: workspace.nome,
      criadaEm: workspace.createdAt.toISOString(),
    },
    membros: workspace.membros.map((membro) => ({
      id: membro.id,
      nome: membro.user.name,
      email: membro.user.email,
      role: membro.role,
      ehVoce: false,
    })),
  };
}
