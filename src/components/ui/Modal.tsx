"use client";

import { useEffect } from "react";

export function Modal({
  aberto,
  titulo,
  onFechar,
  footer,
  children,
}: {
  aberto: boolean;
  titulo: string;
  onFechar: () => void;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!aberto) return;

    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === "Escape") {
        onFechar();
      }
    }

    document.addEventListener("keydown", aoTeclar);

    return () => document.removeEventListener("keydown", aoTeclar);
  }, [aberto, onFechar]);

  if (!aberto) return null;

  return (
    <div
      className="modal-overlay active"
      onClick={(evento) => {
        if (evento.target === evento.currentTarget) {
          onFechar();
        }
      }}
    >
      <div className="modal-box">
        <div className="modal-header">
          <h2>{titulo}</h2>

          <button className="modal-close" type="button" onClick={onFechar}>
            ✕
          </button>
        </div>

        <div className="modal-body">{children}</div>

        {footer ? <div className="modal-footer">{footer}</div> : null}
      </div>
    </div>
  );
}

export function ModalConfirmar({
  aberto,
  titulo,
  mensagem,
  confirmarTexto = "Confirmar",
  cancelarTexto = "Cancelar",
  pendente = false,
  onConfirmar,
  onFechar,
}: {
  aberto: boolean;
  titulo: string;
  mensagem: React.ReactNode;
  confirmarTexto?: string;
  cancelarTexto?: string;
  pendente?: boolean;
  onConfirmar: () => void;
  onFechar: () => void;
}) {
  return (
    <Modal
      aberto={aberto}
      titulo={titulo}
      onFechar={onFechar}
      footer={
        <>
          <button
            className="btn btn-secondary"
            type="button"
            onClick={onFechar}
            disabled={pendente}
          >
            {cancelarTexto}
          </button>

          <button
            className="btn btn-danger"
            type="button"
            onClick={onConfirmar}
            disabled={pendente}
          >
            {pendente ? "Aguarde..." : confirmarTexto}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-slate-300">{mensagem}</p>
      </div>
    </Modal>
  );
}
