"use server";

import { revalidatePath } from "next/cache";

import { adicionarMeses } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import type { ResultadoAcao } from "@/lib/tipos";
import {
  contaFixaSchema,
  contaVariavelSchema,
  primeiroErro,
  statusContaSchema,
} from "@/lib/validators";
import { obterContexto } from "@/lib/workspace";

function revalidarFixas() {
  revalidatePath("/contas-fixas");
  revalidatePath("/dashboard");
}

function revalidarVariaveis() {
  revalidatePath("/contas-variaveis");
  revalidatePath("/dashboard");
}

async function pessoaValida(pessoaId: string, workspaceId: string) {
  const pessoa = await prisma.pessoa.findFirst({
    where: { id: pessoaId, workspaceId },
    select: { id: true },
  });

  return Boolean(pessoa);
}

export async function salvarContaFixa(dados: {
  id?: string;
  nome: string;
  valor: number | string;
  categoria: string;
  tipo: "COMPARTILHADA" | "INDIVIDUAL";
  pessoaId?: string | null;
  dataInicio: string;
  observacao?: string;
}): Promise<ResultadoAcao> {
  const parsed = contaFixaSchema.safeParse(dados);

  if (!parsed.success) {
    return { ok: false, mensagem: primeiroErro(parsed.error) };
  }

  const { workspaceId } = await obterContexto();
  const { id, nome, valor, categoria, tipo, dataInicio, observacao } =
    parsed.data;

  const pessoaId = tipo === "INDIVIDUAL" ? parsed.data.pessoaId || null : null;

  if (tipo === "INDIVIDUAL" && !pessoaId) {
    return { ok: false, mensagem: "Selecione a pessoa da conta individual." };
  }

  if (pessoaId && !(await pessoaValida(pessoaId, workspaceId))) {
    return { ok: false, mensagem: "Pessoa inválida." };
  }

  const campos = {
    nome,
    valor,
    categoria,
    tipo,
    pessoaId,
    dataInicio,
    observacao: observacao || null,
  };

  if (id) {
    const atual = await prisma.contaFixa.findFirst({
      where: { id, workspaceId },
      select: { id: true },
    });

    if (!atual) {
      return { ok: false, mensagem: "Conta não encontrada." };
    }

    await prisma.contaFixa.update({ where: { id }, data: campos });
  } else {
    await prisma.contaFixa.create({ data: { ...campos, workspaceId } });
  }

  revalidarFixas();

  return { ok: true, mensagem: "Conta fixa salva." };
}

export async function removerContaFixa(id: string): Promise<ResultadoAcao> {
  const { workspaceId } = await obterContexto();

  const resultado = await prisma.contaFixa.deleteMany({
    where: { id, workspaceId },
  });

  if (resultado.count === 0) {
    return { ok: false, mensagem: "Conta não encontrada." };
  }

  revalidarFixas();

  return { ok: true, mensagem: "Conta removida." };
}

export async function salvarContaVariavel(dados: {
  id?: string;
  nome: string;
  valorTotal: number | string;
  categoria: string;
  pessoaId: string;
  data: string;
  parcelas: number | string;
  formaPagamento?: "CARTAO" | "PIX" | "DINHEIRO" | "BOLETO";
  observacao?: string;
}): Promise<ResultadoAcao> {
  const parsed = contaVariavelSchema.safeParse(dados);

  if (!parsed.success) {
    return { ok: false, mensagem: primeiroErro(parsed.error) };
  }

  const { workspaceId } = await obterContexto();
  const {
    id,
    nome,
    valorTotal,
    categoria,
    pessoaId,
    data,
    formaPagamento,
    observacao,
  } = parsed.data;

  if (!(await pessoaValida(pessoaId, workspaceId))) {
    return { ok: false, mensagem: "Selecione uma pessoa válida." };
  }

  // Pix, dinheiro e boleto saem de uma vez; só o cartão se estende por meses.
  const parcelas = formaPagamento === "CARTAO" ? parsed.data.parcelas : 1;

  const mesInicio = data.slice(0, 7);

  const campos = {
    nome,
    valorTotal,
    valorParcela: valorTotal / parcelas,
    categoria,
    pessoaId,
    data,
    mesInicio,
    mesFim: adicionarMeses(mesInicio, parcelas - 1),
    parcelas,
    formaPagamento,
    observacao: observacao || null,
  };

  if (id) {
    const atual = await prisma.contaVariavel.findFirst({
      where: { id, workspaceId },
      select: { id: true },
    });

    if (!atual) {
      return { ok: false, mensagem: "Conta não encontrada." };
    }

    await prisma.contaVariavel.update({ where: { id }, data: campos });
  } else {
    await prisma.contaVariavel.create({ data: { ...campos, workspaceId } });
  }

  revalidarVariaveis();

  return { ok: true, mensagem: "Conta variável salva." };
}

export async function removerContaVariavel(
  id: string,
): Promise<ResultadoAcao> {
  const { workspaceId } = await obterContexto();

  const conta = await prisma.contaVariavel.findFirst({
    where: { id, workspaceId },
    select: { id: true, gastoEventoId: true },
  });

  if (!conta) {
    return { ok: false, mensagem: "Conta não encontrada." };
  }

  if (conta.gastoEventoId) {
    return {
      ok: false,
      mensagem:
        "Esta conta é a cota de um evento. Remova o gasto na aba Eventos.",
    };
  }

  await prisma.contaVariavel.delete({ where: { id: conta.id } });

  revalidarVariaveis();

  return { ok: true, mensagem: "Conta removida." };
}

/**
 * Marca (ou desmarca) a conta como paga no mês em foco. Só o pagamento vira
 * registro: sem linha na tabela, a conta do mês está em andamento — assim uma
 * conta fixa que se repete todo mês não precisa de nada pré-criado.
 */
export async function alternarStatusConta(dados: {
  tipo: "FIXA" | "VARIAVEL";
  contaId: string;
  mes: string;
  pago: boolean;
}): Promise<ResultadoAcao> {
  const parsed = statusContaSchema.safeParse(dados);

  if (!parsed.success) {
    return { ok: false, mensagem: primeiroErro(parsed.error) };
  }

  const { workspaceId } = await obterContexto();
  const { tipo, contaId, mes, pago } = parsed.data;

  const existe =
    tipo === "FIXA"
      ? await prisma.contaFixa.findFirst({
          where: { id: contaId, workspaceId },
          select: { id: true },
        })
      : await prisma.contaVariavel.findFirst({
          where: { id: contaId, workspaceId },
          select: { id: true },
        });

  if (!existe) {
    return { ok: false, mensagem: "Conta não encontrada." };
  }

  const chave =
    tipo === "FIXA"
      ? { contaFixaId_mes: { contaFixaId: contaId, mes } }
      : { contaVariavelId_mes: { contaVariavelId: contaId, mes } };

  if (!pago) {
    await prisma.pagamentoConta.deleteMany({
      where:
        tipo === "FIXA"
          ? { contaFixaId: contaId, mes, workspaceId }
          : { contaVariavelId: contaId, mes, workspaceId },
    });
  } else {
    await prisma.pagamentoConta.upsert({
      where: chave,
      update: { status: "PAGO", pagoEm: new Date() },
      create: {
        mes,
        status: "PAGO",
        workspaceId,
        ...(tipo === "FIXA"
          ? { contaFixaId: contaId }
          : { contaVariavelId: contaId }),
      },
    });
  }

  revalidarFixas();
  revalidarVariaveis();

  return {
    ok: true,
    mensagem: pago ? "Marcada como paga." : "Marcada como em andamento.",
  };
}
