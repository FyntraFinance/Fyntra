"use client";

import { useState, useTransition } from "react";

import { entrar } from "@/actions/auth";

export function FormLogin() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [pendente, iniciar] = useTransition();

  function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    setErro("");

    iniciar(async () => {
      const resultado = await entrar({ email, senha });

      if (!resultado.ok) {
        setErro(resultado.mensagem);
      }
    });
  }

  return (
    <form className="auth-form" onSubmit={enviar}>
      {erro ? <div className="auth-alerta erro">{erro}</div> : null}

      <div className="auth-field">
        <label className="form-label" htmlFor="email">
          E-mail
        </label>

        <input
          id="email"
          className="input"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(evento) => setEmail(evento.target.value)}
        />
      </div>

      <div className="auth-field">
        <label className="form-label" htmlFor="senha">
          Senha
        </label>

        <input
          id="senha"
          className="input"
          type="password"
          autoComplete="current-password"
          required
          value={senha}
          onChange={(evento) => setSenha(evento.target.value)}
        />
      </div>

      <button className="btn btn-primary" type="submit" disabled={pendente}>
        {pendente ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
