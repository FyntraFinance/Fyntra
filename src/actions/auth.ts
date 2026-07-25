"use server";

import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";

import { signIn, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  aceitarConviteSchema,
  loginSchema,
  primeiroErro,
  registroSchema,
} from "@/lib/validators";
import type { ResultadoAcao } from "@/lib/tipos";

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
