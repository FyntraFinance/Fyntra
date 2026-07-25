"use server";

import { randomBytes } from "node:crypto";
import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";

import { signIn, signOut } from "@/lib/auth";
import { emailConfigurado, enviarEmailRedefinicaoSenha } from "@/lib/mail";
import { prisma } from "@/lib/prisma";
import { obterBaseUrl } from "@/lib/url";
import {
  aceitarConviteSchema,
  esqueciSenhaSchema,
  loginSchema,
  primeiroErro,
  redefinirSenhaSchema,
  registroSchema,
  trocarSenhaSchema,
} from "@/lib/validators";
import type { ResultadoAcao } from "@/lib/tipos";
import { obterContexto } from "@/lib/workspace";

const HORAS_VALIDADE_REDEFINICAO = 1;

export async function entrar(dados: {
  email: string;
  senha: string;
}): Promise<ResultadoAcao> {
  const parsed = loginSchema.safeParse(dados);

  if (!parsed.success) {
    return { ok: false, mensagem: primeiroErro(parsed.error) };
  }

  try {
    await signIn("credentials", {
      ...parsed.data,
      redirectTo: "/dashboard",
    });

    return { ok: true, mensagem: "" };
  } catch (erro) {
    if (erro instanceof AuthError) {
      return { ok: false, mensagem: "E-mail ou senha incorretos." };
    }

    throw erro;
  }
}

export async function registrar(dados: {
  nome: string;
  email: string;
  senha: string;
}): Promise<ResultadoAcao> {
  const parsed = registroSchema.safeParse(dados);

  if (!parsed.success) {
    return { ok: false, mensagem: primeiroErro(parsed.error) };
  }

  const { nome, email, senha } = parsed.data;

  const existente = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existente) {
    return {
      ok: false,
      mensagem: "Já existe uma conta com este e-mail.",
    };
  }

  const hash = await bcrypt.hash(senha, 10);

  await prisma.user.create({
    data: {
      name: nome,
      email,
      password: hash,
      membros: {
        create: {
          role: "OWNER",
          workspace: {
            create: {
              nome: `Família ${nome.split(" ")[0]}`,
              configuracao: { create: {} },
            },
          },
        },
      },
    },
  });

  try {
    await signIn("credentials", { email, senha, redirectTo: "/dashboard" });

    return { ok: true, mensagem: "" };
  } catch (erro) {
    if (erro instanceof AuthError) {
      return {
        ok: false,
        mensagem: "Conta criada, mas o login falhou. Tente entrar manualmente.",
      };
    }

    throw erro;
  }
}

export async function sair() {
  await signOut({ redirectTo: "/login" });
}

/**
 * Sempre responde com a mesma mensagem genérica, exista ou não a conta —
 * evita que alguém descubra por tentativa quais e-mails estão cadastrados.
 */
export async function solicitarRecuperacaoSenha(dados: {
  email: string;
}): Promise<ResultadoAcao> {
  const parsed = esqueciSenhaSchema.safeParse(dados);

  if (!parsed.success) {
    return { ok: false, mensagem: primeiroErro(parsed.error) };
  }

  const { email } = parsed.data;

  const mensagemPadrao =
    "Se existir uma conta com esse e-mail, enviamos um link de redefinição.";

  const usuario = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true },
  });

  if (!usuario) {
    return { ok: true, mensagem: mensagemPadrao };
  }

  const token = randomBytes(32).toString("hex");

  const expiraEm = new Date();
  expiraEm.setHours(expiraEm.getHours() + HORAS_VALIDADE_REDEFINICAO);

  await prisma.redefinicaoSenha.create({
    data: { token, userId: usuario.id, expiraEm },
  });

  const link = `${obterBaseUrl()}/redefinir-senha/${token}`;

  if (!emailConfigurado()) {
    return {
      ok: false,
      mensagem:
        "Envio de e-mail não configurado (GMAIL_USER/GMAIL_APP_PASSWORD). Copie o link e use manualmente.",
      link,
    };
  }

  try {
    await enviarEmailRedefinicaoSenha({
      para: email,
      nome: usuario.name ?? "",
      url: link,
    });

    return { ok: true, mensagem: mensagemPadrao };
  } catch {
    return {
      ok: false,
      mensagem: "Não conseguimos enviar o e-mail agora. Tente novamente em instantes.",
    };
  }
}

export async function redefinirSenha(dados: {
  token: string;
  senha: string;
}): Promise<ResultadoAcao> {
  const parsed = redefinirSenhaSchema.safeParse(dados);

  if (!parsed.success) {
    return { ok: false, mensagem: primeiroErro(parsed.error) };
  }

  const { token, senha } = parsed.data;

  const redefinicao = await prisma.redefinicaoSenha.findUnique({
    where: { token },
  });

  if (!redefinicao || redefinicao.usadoEm) {
    return { ok: false, mensagem: "Link inválido ou já utilizado." };
  }

  if (redefinicao.expiraEm < new Date()) {
    return { ok: false, mensagem: "Este link expirou. Peça uma nova redefinição." };
  }

  const hash = await bcrypt.hash(senha, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: redefinicao.userId },
      data: { password: hash },
    }),
    prisma.redefinicaoSenha.update({
      where: { id: redefinicao.id },
      data: { usadoEm: new Date() },
    }),
  ]);

  return {
    ok: true,
    mensagem: "Senha redefinida! Você já pode entrar com a nova senha.",
  };
}

export async function trocarSenha(dados: {
  senhaAtual: string;
  novaSenha: string;
}): Promise<ResultadoAcao> {
  const parsed = trocarSenhaSchema.safeParse(dados);

  if (!parsed.success) {
    return { ok: false, mensagem: primeiroErro(parsed.error) };
  }

  const { userId } = await obterContexto();
  const { senhaAtual, novaSenha } = parsed.data;

  const usuario = await prisma.user.findUnique({
    where: { id: userId },
    select: { password: true },
  });

  if (!usuario) {
    return { ok: false, mensagem: "Usuário não encontrado." };
  }

  const senhaCorreta = await bcrypt.compare(senhaAtual, usuario.password);

  if (!senhaCorreta) {
    return { ok: false, mensagem: "Senha atual incorreta." };
  }

  const hash = await bcrypt.hash(novaSenha, 10);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hash },
  });

  return { ok: true, mensagem: "Senha alterada com sucesso." };
}

export async function aceitarConvite(dados: {
  token: string;
  nome: string;
  senha: string;
}): Promise<ResultadoAcao> {
  const parsed = aceitarConviteSchema.safeParse(dados);

  if (!parsed.success) {
    return { ok: false, mensagem: primeiroErro(parsed.error) };
  }

  const { token, nome, senha } = parsed.data;

  const convite = await prisma.convite.findUnique({
    where: { token },
    include: { workspace: { select: { id: true } } },
  });

  if (!convite || convite.status === "CANCELADO") {
    return { ok: false, mensagem: "Convite inválido ou cancelado." };
  }

  if (convite.status === "ACEITO") {
    return { ok: false, mensagem: "Este convite já foi utilizado." };
  }

  if (convite.expiraEm < new Date()) {
    await prisma.convite.update({
      where: { id: convite.id },
      data: { status: "EXPIRADO" },
    });

    return { ok: false, mensagem: "Este convite expirou. Peça um novo." };
  }

  const usuario = await prisma.user.findUnique({
    where: { email: convite.email },
    select: { id: true, password: true },
  });

  let userId: string;

  if (usuario) {
    const senhaCorreta = await bcrypt.compare(senha, usuario.password);

    if (!senhaCorreta) {
      return {
        ok: false,
        mensagem: "Senha incorreta — use a senha da sua conta Fyntra.",
      };
    }

    userId = usuario.id;
  } else {
    const hash = await bcrypt.hash(senha, 10);

    const criado = await prisma.user.create({
      data: { name: nome, email: convite.email, password: hash },
      select: { id: true },
    });

    userId = criado.id;
  }

  await prisma.$transaction(async (tx) => {
    await tx.workspaceMembro.upsert({
      where: {
        workspaceId_userId: {
          workspaceId: convite.workspaceId,
          userId,
        },
      },
      create: {
        workspaceId: convite.workspaceId,
        userId,
        role: convite.role,
      },
      update: {},
    });

    if (convite.pessoaId) {
      await tx.pessoa.update({
        where: { id: convite.pessoaId },
        data: { userId },
      });
    }

    await tx.convite.update({
      where: { id: convite.id },
      data: { status: "ACEITO", aceitoEm: new Date() },
    });
  });

  try {
    await signIn("credentials", {
      email: convite.email,
      senha,
      redirectTo: "/dashboard",
    });

    return { ok: true, mensagem: "" };
  } catch (erro) {
    if (erro instanceof AuthError) {
      return {
        ok: false,
        mensagem: "Convite aceito! Agora entre com seu e-mail e senha.",
      };
    }

    throw erro;
  }
}
