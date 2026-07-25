"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { redefinirSenha } from "@/actions/auth";

export function FormRedefinirSenha({ token }: { token: string }) {
  const router = useRouter();

  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [pendente, iniciar] = useTransition();

  function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    setErro("");

    if (senha !== confirmar) {
      setErro("As senhas não conferem.");
      return;
    }

    iniciar(async () => {
      const resultado = await redefinirSenha({ token, senha });

      if (!resultado.ok) {
        setErro(resultado.mensagem);
        return;
      }

      setSucesso(resultado.mensagem);

      setTimeout(() => router.push("/login"), 2000);
    });
  }

  if (sucesso) {
    return (
      <div className="auth-form">
        <div className="auth-alerta ok">{sucesso}</div>
      </div>
    );
  }

  return (
    <form className="auth-form" onSubmit={enviar}>
      {erro ? <div className="auth-alerta erro">{erro}</div> : null}

      <div className="auth-field">
        <label className="form-label" htmlFor="senha">
          Nova senha
        </label>

        <input
          id="senha"
          className="input"
          type="password"
          autoComplete="new-password"
          minLength={6}
          required
          value={senha}
          onChange={(evento) => setSenha(evento.target.value)}
        />
      </div>

      <div className="auth-field">
        <label className="form-label" htmlFor="confirmar">
          Confirmar nova senha
        </label>

        <input
          id="confirmar"
          className="input"
          type="password"
          autoComplete="new-password"
          minLength={6}
          required
          value={confirmar}
          onChange={(evento) => setConfirmar(evento.target.value)}
        />
      </div>

      <button className="btn btn-primary" type="submit" disabled={pendente}>
        {pendente ? "Salvando..." : "Redefinir senha"}
      </button>
    </form>
  );
}
