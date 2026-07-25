import { prisma } from "@/lib/prisma";
import type {
  ContaFixaDTO,
  ContaVariavelDTO,
  MembroDTO,
  MetaDTO,
  PessoaDTO,
} from "@/lib/tipos";

export async function listarPessoas(workspaceId: string): Promise<PessoaDTO[]> {
  const pessoas = await prisma.pessoa.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "asc" },
    include: {
      convites: {
        where: { status: "PENDENTE" },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, status: true, expiraEm: true },
      },
    },
  });

  return pessoas.map((pessoa) => ({
    id: pessoa.id,
    nome: pessoa.nome,
    email: pessoa.email,
    salario: Number(pessoa.salario),
    userId: pessoa.userId,
    convite: pessoa.convites[0]
      ? {
          id: pessoa.convites[0].id,
          status: pessoa.convites[0].status,
          expiraEm: pessoa.convites[0].expiraEm.toISOString(),
        }
      : null,
  }));
}

export async function listarContasFixas(
  workspaceId: string,
): Promise<ContaFixaDTO[]> {
  const contas = await prisma.contaFixa.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "asc" },
  });

  return contas.map((conta) => ({
    id: conta.id,
    nome: conta.nome,
    valor: Number(conta.valor),
    categoria: conta.categoria,
    tipo: conta.tipo,
    pessoaId: conta.pessoaId,
    dataInicio: conta.dataInicio,
    dataFim: conta.dataFim,
    observacao: conta.observacao,
  }));
}

export async function listarContasVariaveis(
  workspaceId: string,
): Promise<ContaVariavelDTO[]> {
  const contas = await prisma.contaVariavel.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "asc" },
  });

  return contas.map((conta) => ({
    id: conta.id,
    nome: conta.nome,
    valorTotal: Number(conta.valorTotal),
    valorParcela: Number(conta.valorParcela),
    categoria: conta.categoria,
    pessoaId: conta.pessoaId,
    data: conta.data,
    mesInicio: conta.mesInicio,
    mesFim: conta.mesFim,
    parcelas: conta.parcelas,
    observacao: conta.observacao,
  }));
}

export async function listarMetas(workspaceId: string): Promise<MetaDTO[]> {
  const metas = await prisma.meta.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "asc" },
  });

  return metas.map((meta) => ({
    id: meta.id,
    nome: meta.nome,
    emoji: meta.emoji,
    valorAlvo: Number(meta.valorAlvo),
    valorAtual: Number(meta.valorAtual),
    contribuicaoMensal:
      meta.contribuicaoMensal === null ? null : Number(meta.contribuicaoMensal),
    cor: meta.cor,
  }));
}

export async function listarMembros(
  workspaceId: string,
  userId: string,
): Promise<MembroDTO[]> {
  const membros = await prisma.workspaceMembro.findMany({
    where: { workspaceId },
    orderBy: { joinedAt: "asc" },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  return membros.map((membro) => ({
    id: membro.id,
    nome: membro.user.name,
    email: membro.user.email,
    role: membro.role,
    ehVoce: membro.user.id === userId,
  }));
}

export async function obterConfiguracao(workspaceId: string) {
  const configuracao = await prisma.configuracao.findUnique({
    where: { workspaceId },
    select: { divisaoPorSalario: true, poeApiKey: true },
  });

  return {
    divisaoPorSalario: configuracao?.divisaoPorSalario ?? false,
    temTokenIa: Boolean(configuracao?.poeApiKey),
  };
}

/** Conta fixa vale para o mês se já começou e ainda não terminou. */
export function contasFixasDoMes(contas: ContaFixaDTO[], mes: string) {
  return contas.filter(
    (conta) =>
      conta.dataInicio <= mes && (!conta.dataFim || mes <= conta.dataFim),
  );
}

/** Conta variável vale para o mês se a parcela cai dentro da janela. */
export function contasVariaveisDoMes(
  contas: ContaVariavelDTO[],
  mes: string,
) {
  return contas.filter(
    (conta) => mes >= conta.mesInicio && mes <= conta.mesFim,
  );
}
