"use client";

import { useState, useTransition } from "react";

import { registrar } from "@/actions/auth";

export function FormRegistro() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [erro, setErro] = useState("");
  const [pendente, iniciar] = useTransition();

  function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    setErro("");

    if (senha !== confirmar) {
      setErro("As senhas não conferem.");
      return;
    }

    iniciar(async () => {
      const resultado = await registrar({ nome, email, senha });

      if (!resultado.ok) {
        setErro(resultado.mensagem);
      }
    });
  }

  return (
    <form className="auth-form" onSubmit={enviar}>
      {erro ? <div className="auth-alerta erro">{erro}</div> : null}

      <div className="auth-field">
        <label className="form-label" htmlFor="nome">
          Seu nome
        </label>

        <input
          id="nome"
          className="input"
          type="text"
          autoComplete="name"
          required
          value={nome}
          onChange={(evento) => setNome(evento.target.value)}
        />
      </div>

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
          autoComplete="new-password"
          minLength={6}
          required
          value={senha}
          onChange={(evento) => setSenha(evento.target.value)}
        />
      </div>

      <div className="auth-field">
        <label className="form-label" htmlFor="confirmar">
          Confirmar senha
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
        {pendente ? "Criando conta..." : "Criar conta"}
      </button>
    </form>
  );
}
