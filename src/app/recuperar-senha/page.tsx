import Link from "next/link";

import { CartaoAuth } from "@/components/auth/CartaoAuth";
import { FormEsqueciSenha } from "@/components/auth/FormEsqueciSenha";

export const metadata = {
  title: "Esqueci minha senha — Fyntra",
};

export default function RecuperarSenhaPage() {
  return (
    <CartaoAuth
      titulo="Esqueci minha senha"
      descricao="Informe seu e-mail e enviaremos um link para você criar uma nova senha."
      rodape={
        <Link href="/login" className="auth-link">
          Voltar para o login
        </Link>
      }
    >
      <FormEsqueciSenha />
    </CartaoAuth>
  );
}
