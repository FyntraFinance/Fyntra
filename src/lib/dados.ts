import { prisma } from "@/lib/prisma";
import type {
  ContaFixaDTO,
  ContaVariavelDTO,
  EventoDTO,
  GanhoExtraDTO,
  MembroDTO,
  MetaDTO,
  PessoaDTO,
  StatusGastos,
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

export async function listarGanhosExtras(
  workspaceId: string,
): Promise<GanhoExtraDTO[]> {
  const ganhos = await prisma.ganhoExtra.findMany({
    where: { workspaceId },
    orderBy: { data: "desc" },
  });

  return ganhos.map((ganho) => ({
    id: ganho.id,
    nome: ganho.nome,
    valor: Number(ganho.valor),
    categoria: ganho.categoria,
    pessoaId: ganho.pessoaId,
    data: ganho.data,
    mes: ganho.mes,
    recorrente: ganho.recorrente,
    observacao: ganho.observacao,
  }));
}

export async function listarEventos(
  workspaceId: string,
): Promise<EventoDTO[]> {
  const eventos = await prisma.evento.findMany({
    where: { workspaceId },
    orderBy: { dataInicio: "desc" },
    include: {
      participantes: {
        orderBy: { createdAt: "asc" },
        include: { pessoa: { select: { userId: true } } },
      },
      gastos: { orderBy: { data: "desc" } },
    },
  });

  return eventos.map((evento) => {
    const divisor = Math.max(1, evento.participantes.length);

    const total = evento.gastos.reduce(
      (soma, gasto) => soma + Number(gasto.valor),
      0,
    );

    return {
      id: evento.id,
      nome: evento.nome,
      emoji: evento.emoji,
      descricao: evento.descricao,
      dataInicio: evento.dataInicio,
      dataFim: evento.dataFim,
      encerrado: evento.encerrado,
      participantes: evento.participantes.map((participante) => ({
        id: participante.id,
        nome: participante.nome,
        pessoaId: participante.pessoaId,
        temAcesso: Boolean(participante.pessoa?.userId),
      })),
      gastos: evento.gastos.map((gasto) => ({
        id: gasto.id,
        nome: gasto.nome,
        valor: Number(gasto.valor),
        categoria: gasto.categoria,
        data: gasto.data,
        observacao: gasto.observacao,
        cotaPorParticipante: Number(gasto.valor) / divisor,
      })),
      total,
      cotaPorParticipante: total / divisor,
    };
  });
}

/** Contas marcadas como pagas no mês em foco. */
export async function listarStatusGastos(
  workspaceId: string,
  mes: string,
): Promise<StatusGastos> {
  const pagamentos = await prisma.pagamentoConta.findMany({
    where: { workspaceId, mes, status: "PAGO" },
    select: { contaFixaId: true, contaVariavelId: true },
  });

  return {
    fixasPagas: pagamentos
      .map((pagamento) => pagamento.contaFixaId)
      .filter((id): id is string => Boolean(id)),
    variaveisPagas: pagamentos
      .map((pagamento) => pagamento.contaVariavelId)
      .filter((id): id is string => Boolean(id)),
  };
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
    select: {
      divisaoPorSalario: true,
      compartilharComContadora: true,
      poeApiKey: true,
    },
  });

  return {
    divisaoPorSalario: configuracao?.divisaoPorSalario ?? false,
    // Workspace sem registro de configuração cai no padrão do schema.
    compartilharComContadora: configuracao?.compartilharComContadora ?? true,
    temTokenIa: Boolean(configuracao?.poeApiKey),
  };
}

/** Ganho extra vale para o mês em que caiu; o recorrente vale de lá em diante. */
export function ganhosExtrasDoMes(ganhos: GanhoExtraDTO[], mes: string) {
  return ganhos.filter((ganho) =>
    ganho.recorrente ? ganho.mes <= mes : ganho.mes === mes,
  );
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
