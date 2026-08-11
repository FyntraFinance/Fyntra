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

export type FamiliasAdmin = {
  familias: FamiliaResumo[];
  /** Famílias que existem mas optaram por não compartilhar com a contabilidade. */
  ocultas: number;
};

/**
 * Lista as famílias (workspaces) que autorizaram o compartilhamento com a
 * contabilidade. Quem desmarcou a opção em Perfil não aparece — nem nome, nem
 * dono, nem contagem de pessoas.
 */
export async function listarFamiliasAdmin(
  busca?: string,
): Promise<FamiliasAdmin> {
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
      configuracao: { select: { compartilharComContadora: true } },
      membros: {
        where: { role: "OWNER" },
        take: 1,
        select: { user: { select: { name: true, email: true } } },
      },
    },
  });

  const autorizadas = workspaces.filter((workspace) =>
    compartilha(workspace.configuracao),
  );

  return {
    ocultas: workspaces.length - autorizadas.length,
    familias: autorizadas.map((workspace) => ({
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
    })),
  };
}

/** Workspace sem registro de configuração cai no padrão do schema (autorizado). */
function compartilha(
  configuracao: { compartilharComContadora: boolean } | null,
): boolean {
  return configuracao?.compartilharComContadora ?? true;
}

export type RelatorioFamilia =
  | {
      estado: "ok";
      workspace: { id: string; nome: string; criadaEm: string };
      membros: MembroDTO[];
    }
  /** A família existe, mas revogou o compartilhamento: nada é devolvido. */
  | { estado: "bloqueado" }
  | null;

/** Dados básicos da família (nome + quem tem acesso), sem escopo por usuário logado. */
export async function obterFamilia(workspaceId: string): Promise<RelatorioFamilia> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: {
      id: true,
      nome: true,
      createdAt: true,
      configuracao: { select: { compartilharComContadora: true } },
      membros: {
        orderBy: { joinedAt: "asc" },
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });

  if (!workspace) return null;

  if (!compartilha(workspace.configuracao)) {
    return { estado: "bloqueado" };
  }

  return {
    estado: "ok",
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
