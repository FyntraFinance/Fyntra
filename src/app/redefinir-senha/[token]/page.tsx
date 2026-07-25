import Link from "next/link";

import { CartaoAuth } from "@/components/auth/CartaoAuth";
import { FormRedefinirSenha } from "@/components/auth/FormRedefinirSenha";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Redefinir senha — Fyntra",
};

export default async function RedefinirSenhaPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const redefinicao = await prisma.redefinicaoSenha.findUnique({
    where: { token },
    select: { expiraEm: true, usadoEm: true },
  });

  const invalido =
    !redefinicao || Boolean(redefinicao.usadoEm) || redefinicao.expiraEm < new Date();

  if (invalido) {
    return (
      <CartaoAuth
        titulo="Link indisponível"
        descricao="Este link de redefinição de senha não é mais válido."
        rodape={
          <Link href="/recuperar-senha" className="auth-link">
            Pedir um novo link
          </Link>
        }
      >
        <div className="auth-alerta erro">
          {!redefinicao
            ? "Link inválido — confira se foi copiado por completo."
            : redefinicao.usadoEm
              ? "Este link já foi utilizado."
              : "Este link expirou."}
        </div>
      </CartaoAuth>
    );
  }

  return (
    <CartaoAuth
      titulo="Criar nova senha"
      descricao="Escolha uma nova senha para entrar na sua conta Fyntra."
      rodape={
        <Link href="/login" className="auth-link">
          Voltar para o login
        </Link>
      }
    >
      <FormRedefinirSenha token={token} />
    </CartaoAuth>
  );
}
