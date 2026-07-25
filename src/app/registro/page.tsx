import Link from "next/link";

import { FormRegistro } from "@/components/auth/FormRegistro";
import { CartaoAuth } from "@/components/auth/CartaoAuth";

export const metadata = {
  title: "Criar conta — Fyntra",
};

export default function RegistroPage() {
  return (
    <CartaoAuth
      titulo="Criar sua conta"
      descricao="Você começa como dono de um workspace e depois convida a família por e-mail."
      rodape={
        <>
          Já tem conta?{" "}
          <Link href="/login" className="auth-link">
            Entrar
          </Link>
        </>
      }
    >
      <FormRegistro />
    </CartaoAuth>
  );
}
