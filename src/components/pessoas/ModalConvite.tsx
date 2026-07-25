"use client";

import { useEffect, useState, useTransition } from "react";

import { cancelarConvite, convidarPessoa } from "@/actions/pessoas";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import type { PessoaDTO } from "@/lib/tipos";

export function ModalConvite({
  pessoa,
  onFechar,
}: {
  pessoa: PessoaDTO | null;
  onFechar: () => void;
}) {
  const mostrarToast = useToast();
  const [pendente, iniciar] = useTransition();

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"ADMIN" | "MEMBER">("MEMBER");
  const [link, setLink] = useState("");

  useEffect(() => {
    setEmail(pessoa?.email ?? "");
    setRole("MEMBER");
    setLink("");
  }, [pessoa]);

  function enviar() {
    if (!pessoa) return;

    iniciar(async () => {
      const resultado = await convidarPessoa({
        pessoaId: pessoa.id,
        email,
        role,
      });

      mostrarToast(resultado.mensagem, resultado.ok ? "success" : "error");

      if (resultado.link) {
        setLink(resultado.link);
      }

      if (resultado.ok && !resultado.link) {
        onFechar();
      }
    });
  }

  function cancelar() {
    if (!pessoa?.convite) return;

    const conviteId = pessoa.convite.id;

    iniciar(async () => {
      const resultado = await cancelarConvite(conviteId);

      mostrarToast(resultado.mensagem, resultado.ok ? "success" : "error");

      if (resultado.ok) {
        onFechar();
      }
    });
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(link);
      mostrarToast("Link copiado.", "success");
    } catch {
      mostrarToast("Não foi possível copiar o link.", "error");
    }
  }

  return (
    <Modal
      aberto={Boolean(pessoa)}
      titulo={`Convidar ${pessoa?.nome ?? ""}`}
      onFechar={onFechar}
      footer={
        <>
          <button
            className="btn btn-secondary"
            type="button"
            onClick={onFechar}
            disabled={pendente}
          >
            Fechar
          </button>

          <button
            className="btn btn-primary"
            type="button"
            onClick={enviar}
            disabled={pendente}
          >
            {pendente ? "Enviando..." : "✉️ Enviar convite"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-muted text-sm">
          A pessoa recebe um e-mail com um link para criar a senha e acessar as
          finanças da família. O convite vale por 7 dias.
        </p>

        <div>
          <label className="form-label">E-mail</label>

          <input
            className="input"
            type="email"
            placeholder="pessoa@email.com"
            value={email}
            onChange={(evento) => setEmail(evento.target.value)}
          />
        </div>

        <div>
          <label className="form-label">Nível de acesso</label>

          <select
            className="input"
            value={role}
            onChange={(evento) =>
              setRole(evento.target.value as "ADMIN" | "MEMBER")
            }
          >
            <option value="MEMBER">Membro — vê e lança contas</option>
            <option value="ADMIN">
              Administrador — também pode convidar outras pessoas
            </option>
          </select>
        </div>

        {pessoa?.convite ? (
          <div className="auth-alerta erro">
            Já existe um convite pendente para esta pessoa. Enviar um novo
            invalida o anterior.
            <br />
            <button
              className="btn btn-secondary mt-8"
              type="button"
              onClick={cancelar}
              disabled={pendente}
            >
              Cancelar convite pendente
            </button>
          </div>
        ) : null}

        {link ? (
          <div className="convite-link-box">
            <code>{link}</code>

            <button
              className="btn btn-secondary"
              type="button"
              onClick={copiar}
            >
              Copiar
            </button>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
