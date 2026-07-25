"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import { emailConfigurado, enviarEmailConvite } from "@/lib/mail";
import { prisma } from "@/lib/prisma";
import type { ResultadoAcao } from "@/lib/tipos";
import { obterBaseUrl } from "@/lib/url";
import { conviteSchema, pessoaSchema, primeiroErro } from "@/lib/validators";
import { obterContexto, podeAdministrar } from "@/lib/workspace";

const DIAS_VALIDADE_CONVITE = 7;

function revalidar() {
  revalidatePath("/pessoas");
  revalidatePath("/dashboard");
}

export async function salvarPessoa(dados: {
  id?: string;
  nome: string;
  email?: string;
  salario: number | string;
}): Promise<ResultadoAcao> {
  const parsed = pessoaSchema.safeParse(dados);

  if (!parsed.success) {
    return { ok: false, mensagem: primeiroErro(parsed.error) };
  }

  const { workspaceId } = await obterContexto();
  const { id, nome, email, salario } = parsed.data;

  if (id) {
    const atual = await prisma.pessoa.findFirst({
      where: { id, workspaceId },
      select: { id: true },
    });

    if (!atual) {
      return { ok: false, mensagem: "Pessoa não encontrada." };
    }

    await prisma.pessoa.update({
      where: { id },
      data: { nome, email: email ?? null, salario },
    });
  } else {
    await prisma.pessoa.create({
      data: { nome, email: email ?? null, salario, workspaceId },
    });
  }

  revalidar();

  return { ok: true, mensagem: "Pessoa salva." };
}

export async function removerPessoa(id: string): Promise<ResultadoAcao> {
  const { workspaceId } = await obterContexto();

  const pessoa = await prisma.pessoa.findFirst({
    where: { id, workspaceId },
    select: { id: true, _count: { select: { contasVariaveis: true } } },
  });

  if (!pessoa) {
    return { ok: false, mensagem: "Pessoa não encontrada." };
  }

  if (pessoa._count.contasVariaveis > 0) {
    return {
      ok: false,
      mensagem:
        "Esta pessoa tem contas variáveis lançadas. Remova as contas antes de excluí-la.",
    };
  }

  await prisma.pessoa.delete({ where: { id } });

  revalidar();

  return { ok: true, mensagem: "Pessoa removida." };
}

export async function convidarPessoa(dados: {
  pessoaId: string;
  email: string;
  role?: "ADMIN" | "MEMBER";
}): Promise<ResultadoAcao> {
  const parsed = conviteSchema.safeParse(dados);

  if (!parsed.success) {
    return { ok: false, mensagem: primeiroErro(parsed.error) };
  }

  const contexto = await obterContexto();

  if (!podeAdministrar(contexto.role)) {
    return {
      ok: false,
      mensagem: "Só o dono ou administradores do workspace podem convidar.",
    };
  }

  const { pessoaId, email, role } = parsed.data;

  const pessoa = await prisma.pessoa.findFirst({
    where: { id: pessoaId, workspaceId: contexto.workspaceId },
    select: { id: true, nome: true },
  });

  if (!pessoa) {
    return { ok: false, mensagem: "Pessoa não encontrada." };
  }

  const jaMembro = await prisma.workspaceMembro.findFirst({
    where: {
      workspaceId: contexto.workspaceId,
      user: { email },
    },
    select: { id: true },
  });

  if (jaMembro) {
    return {
      ok: false,
      mensagem: "Este e-mail já tem acesso a este workspace.",
    };
  }

  const token = randomBytes(32).toString("hex");

  const expiraEm = new Date();
  expiraEm.setDate(expiraEm.getDate() + DIAS_VALIDADE_CONVITE);

  const convite = await prisma.$transaction(async (tx) => {
    await tx.convite.updateMany({
      where: {
        workspaceId: contexto.workspaceId,
        pessoaId,
        status: "PENDENTE",
      },
      data: { status: "CANCELADO" },
    });

    await tx.pessoa.update({
      where: { id: pessoaId },
      data: { email },
    });

    return tx.convite.create({
      data: {
        email,
        token,
        role,
        pessoaId,
        workspaceId: contexto.workspaceId,
        convidadoPorId: contexto.userId,
        expiraEm,
      },
      select: { id: true },
    });
  });

  const link = `${obterBaseUrl()}/convite/${token}`;

  if (!emailConfigurado()) {
    revalidar();

    return {
      ok: false,
      mensagem:
        "Convite criado, mas o envio de e-mail não está configurado (GMAIL_USER/GMAIL_APP_PASSWORD). Copie o link e envie manualmente.",
      link,
    };
  }

  try {
    await enviarEmailConvite({
      para: email,
      nomePessoa: pessoa.nome,
      nomeConvidador: contexto.userNome,
      nomeWorkspace: contexto.workspaceNome,
      url: link,
      expiraEm,
    });

    await prisma.convite.update({
      where: { id: convite.id },
      data: { enviadoEm: new Date() },
    });

    revalidar();

    return { ok: true, mensagem: `Convite enviado para ${email}.`, link };
  } catch (erro) {
    revalidar();

    const detalhe =
      erro instanceof Error ? erro.message : "erro desconhecido no envio";

    return {
      ok: false,
      mensagem: `Convite criado, mas o e-mail não saiu (${detalhe}). Copie o link e envie manualmente.`,
      link,
    };
  }
}

export async function cancelarConvite(
  conviteId: string,
): Promise<ResultadoAcao> {
  const contexto = await obterContexto();

  if (!podeAdministrar(contexto.role)) {
    return { ok: false, mensagem: "Sem permissão para cancelar convites." };
  }

  const resultado = await prisma.convite.updateMany({
    where: {
      id: conviteId,
      workspaceId: contexto.workspaceId,
      status: "PENDENTE",
    },
    data: { status: "CANCELADO" },
  });

  if (resultado.count === 0) {
    return { ok: false, mensagem: "Convite não encontrado ou já resolvido." };
  }

  revalidar();

  return { ok: true, mensagem: "Convite cancelado." };
}

export async function removerMembro(
  membroId: string,
): Promise<ResultadoAcao> {
  const contexto = await obterContexto();

  if (!podeAdministrar(contexto.role)) {
    return { ok: false, mensagem: "Sem permissão para remover membros." };
  }

  const membro = await prisma.workspaceMembro.findFirst({
    where: { id: membroId, workspaceId: contexto.workspaceId },
    select: { id: true, userId: true, role: true },
  });

  if (!membro) {
    return { ok: false, mensagem: "Membro não encontrado." };
  }

  if (membro.role === "OWNER") {
    return { ok: false, mensagem: "O dono do workspace não pode ser removido." };
  }

  if (membro.userId === contexto.userId) {
    return { ok: false, mensagem: "Você não pode remover o seu próprio acesso." };
  }

  try {
    await prisma.workspaceMembro.delete({ where: { id: membro.id } });
  } catch (erro) {
    if (erro instanceof Prisma.PrismaClientKnownRequestError) {
      return { ok: false, mensagem: "Não foi possível remover este membro." };
    }

    throw erro;
  }

  revalidatePath("/perfil");

  return { ok: true, mensagem: "Acesso removido." };
}
