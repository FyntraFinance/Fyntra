"use client";

import { useState, useTransition } from "react";

import { aceitarConvite } from "@/actions/auth";

export function FormConvite({
  token,
  email,
  nomeSugerido,
  contaExistente,
}: {
  token: string;
  email: string;
  nomeSugerido: string;
  contaExistente: boolean;
}) {
  const [nome, setNome] = useState(nomeSugerido);
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [pendente, iniciar] = useTransition();

  function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    setErro("");

    iniciar(async () => {
      const resultado = await aceitarConvite({
        token,
        nome: contaExistente ? nomeSugerido || "Convidado" : nome,
        senha,
      });

      if (!resultado.ok) {
        setErro(resultado.mensagem);
      }
    });
  }

  return (
    <form className="auth-form" onSubmit={enviar}>
      {erro ? <div className="auth-alerta erro">{erro}</div> : null}

      <div className="auth-alerta ok">
        Convite para <strong>{email}</strong>
      </div>

      {contaExistente ? (
        <p className="text-muted text-sm">
          Você já tem uma conta Fyntra com este e-mail. Confirme sua senha atual
          para entrar no workspace.
        </p>
      ) : (
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
      )}

      <div className="auth-field">
        <label className="form-label" htmlFor="senha">
          {contaExistente ? "Sua senha" : "Criar uma senha"}
        </label>

        <input
          id="senha"
          className="input"
          type="password"
          autoComplete={contaExistente ? "current-password" : "new-password"}
          minLength={6}
          required
          value={senha}
          onChange={(evento) => setSenha(evento.target.value)}
        />
      </div>

      <button className="btn btn-primary" type="submit" disabled={pendente}>
        {pendente ? "Entrando..." : "Aceitar convite"}
      </button>
    </form>
  );
}
