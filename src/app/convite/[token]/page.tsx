import Link from "next/link";

import { CartaoAuth } from "@/components/auth/CartaoAuth";
import { FormConvite } from "@/components/auth/FormConvite";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Convite — Fyntra",
};

const MENSAGENS_INVALIDO: Record<string, string> = {
  CANCELADO: "Este convite foi cancelado por quem enviou.",
  ACEITO: "Este convite já foi utilizado. Entre com seu e-mail e senha.",
  EXPIRADO: "Este convite expirou. Peça um novo para quem te convidou.",
};

export default async function ConvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const convite = await prisma.convite.findUnique({
    where: { token },
    select: {
      email: true,
      status: true,
      expiraEm: true,
      workspace: { select: { nome: true } },
      convidadoPor: { select: { name: true } },
      pessoa: { select: { nome: true } },
    },
  });

  if (!convite) {
    return (
      <CartaoAuth
        titulo="Convite não encontrado"
        descricao="O link que você abriu não corresponde a nenhum convite."
        rodape={
          <Link href="/login" className="auth-link">
            Ir para o login
          </Link>
        }
      >
        <div className="auth-alerta erro">
          Confira se o link foi copiado por completo.
        </div>
      </CartaoAuth>
    );
  }

  const expirado =
    convite.status === "PENDENTE" && convite.expiraEm < new Date();

  const statusInvalido = expirado ? "EXPIRADO" : convite.status;

  if (statusInvalido !== "PENDENTE") {
    return (
      <CartaoAuth
        titulo="Convite indisponível"
        descricao={`Convite para ${convite.workspace.nome}.`}
        rodape={
          <Link href="/login" className="auth-link">
            Ir para o login
          </Link>
        }
      >
        <div className="auth-alerta erro">
          {MENSAGENS_INVALIDO[statusInvalido]}
        </div>
      </CartaoAuth>
    );
  }

  const usuario = await prisma.user.findUnique({
    where: { email: convite.email },
    select: { name: true },
  });

  const convidador = convite.convidadoPor?.name ?? "Alguém";

  return (
    <CartaoAuth
      titulo={`${convidador} te convidou`}
      descricao={`Você foi convidado para participar de "${convite.workspace.nome}" no Fyntra.`}
      rodape={
        <>
          Não é você?{" "}
          <Link href="/login" className="auth-link">
            Entrar com outra conta
          </Link>
        </>
      }
    >
      <FormConvite
        token={token}
        email={convite.email}
        nomeSugerido={usuario?.name ?? convite.pessoa?.nome ?? ""}
        contaExistente={Boolean(usuario)}
      />
    </CartaoAuth>
  );
}
