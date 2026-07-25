"use client";

import { useState, useTransition } from "react";

import { trocarSenha } from "@/actions/auth";
import { useToast } from "@/components/ui/Toast";

export function TrocarSenha() {
  const mostrarToast = useToast();
  const [pendente, iniciar] = useTransition();

  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [erro, setErro] = useState("");

  function salvar() {
    setErro("");

    if (novaSenha !== confirmar) {
      setErro("As senhas não conferem.");
      return;
    }

    iniciar(async () => {
      const resultado = await trocarSenha({ senhaAtual, novaSenha });

      mostrarToast(resultado.mensagem, resultado.ok ? "success" : "error");

      if (resultado.ok) {
        setSenhaAtual("");
        setNovaSenha("");
        setConfirmar("");
      } else {
        setErro(resultado.mensagem);
      }
    });
  }

  return (
    <div className="card perfil-card">
      <div
        className="perfil-card-icon"
        style={{ background: "rgba(59,130,246,.15)", color: "var(--blue)" }}
      >
        🔒
      </div>

      <div className="perfil-card-body">
        <h3 className="perfil-card-title">Trocar Senha</h3>

        <p className="text-muted perfil-card-desc">
          Altere a senha da sua conta. Você vai precisar informar a senha
          atual.
        </p>

        {erro ? <div className="auth-alerta erro mb-4">{erro}</div> : null}

        <div className="space-y-2">
          <input
            className="input"
            type="password"
            autoComplete="current-password"
            placeholder="Senha atual"
            value={senhaAtual}
            onChange={(evento) => setSenhaAtual(evento.target.value)}
          />

          <input
            className="input"
            type="password"
            autoComplete="new-password"
            placeholder="Nova senha"
            minLength={6}
            value={novaSenha}
            onChange={(evento) => setNovaSenha(evento.target.value)}
          />

          <input
            className="input"
            type="password"
            autoComplete="new-password"
            placeholder="Confirmar nova senha"
            minLength={6}
            value={confirmar}
            onChange={(evento) => setConfirmar(evento.target.value)}
          />
        </div>

        <button
          className="btn btn-primary perfil-btn mt-16"
          type="button"
          onClick={salvar}
          disabled={
            pendente || !senhaAtual || !novaSenha || !confirmar
          }
          style={{ background: "var(--blue)", borderColor: "var(--blue)" }}
        >
          {pendente ? "Salvando..." : "🔒 Alterar Senha"}
        </button>
      </div>
    </div>
  );
}
