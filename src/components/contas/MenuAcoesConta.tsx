"use client";

import { useEffect, useRef, useState } from "react";

/** Menu "⋮" com Editar/Remover, usado na última coluna da tabela de contas. */
export function MenuAcoesConta({
  onEditar,
  onRemover,
}: {
  onEditar: () => void;
  onRemover: () => void;
}) {
  const [aberto, setAberto] = useState(false);
  const referencia = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;

    function aoClicarFora(evento: MouseEvent) {
      if (!referencia.current?.contains(evento.target as Node)) {
        setAberto(false);
      }
    }

    document.addEventListener("mousedown", aoClicarFora);

    return () => document.removeEventListener("mousedown", aoClicarFora);
  }, [aberto]);

  return (
    <div className="menu-acoes" ref={referencia}>
      <button
        className="btn-icon"
        type="button"
        title="Mais ações"
        aria-expanded={aberto}
        onClick={() => setAberto((atual) => !atual)}
      >
        ⋮
      </button>

      {aberto ? (
        <div className="menu-acoes-lista">
          <button
            type="button"
            onClick={() => {
              setAberto(false);
              onEditar();
            }}
          >
            ✏️ Editar
          </button>

          <button
            type="button"
            className="menu-acoes-perigo"
            onClick={() => {
              setAberto(false);
              onRemover();
            }}
          >
            🗑️ Remover
          </button>
        </div>
      ) : null}
    </div>
  );
}
