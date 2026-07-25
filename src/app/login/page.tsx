import Link from "next/link";

import { FormLogin } from "@/components/auth/FormLogin";
import { CartaoAuth } from "@/components/auth/CartaoAuth";

export const metadata = {
  title: "Entrar — Fyntra",
};

export default function LoginPage() {
  return (
    <CartaoAuth
      titulo="Bem-vindo de volta"
      descricao="Entre para acompanhar as finanças da família."
      rodape={
        <>
          Ainda não tem conta?{" "}
          <Link href="/registro" className="auth-link">
            Criar conta
          </Link>
        </>
      }
    >
      <FormLogin />
    </CartaoAuth>
  );
}
