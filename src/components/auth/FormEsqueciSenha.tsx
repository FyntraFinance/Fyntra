"use client";

import { useState, useTransition } from "react";

import { solicitarRecuperacaoSenha } from "@/actions/auth";

export function FormEsqueciSenha() {
  const [email, setEmail] = useState("");
  const [erro, setErro] = useState("");
  const [enviado, setEnviado] = useState<string | null>(null);
  const [link, setLink] = useState<string | undefined>();
  const [pendente, iniciar] = useTransition();

  function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    setErro("");

    iniciar(async () => {
      const resultado = await solicitarRecuperacaoSenha({ email });

      if (!resultado.ok && !resultado.link) {
        setErro(resultado.mensagem);
        return;
      }

      setEnviado(resultado.mensagem);
      setLink(resultado.link);
    });
  }

  if (enviado) {
    return (
      <div className="auth-form">
        <div className="auth-alerta ok">{enviado}</div>

        {link ? (
          <div className="auth-field">
            <label className="form-label">Link de redefinição</label>

            <input className="input" readOnly value={link} onFocus={(e) => e.target.select()} />
          </div>
        ) : null}
      </div>
    );
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

      <button className="btn btn-primary" type="submit" disabled={pendente}>
        {pendente ? "Enviando..." : "Enviar link de redefinição"}
      </button>
    </form>
  );
}
