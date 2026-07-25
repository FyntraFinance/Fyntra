"use client";

import { useState, useTransition } from "react";

import { removerMembro } from "@/actions/pessoas";
import { ModalConfirmar } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import type { MembroDTO } from "@/lib/tipos";

const ROTULO_ROLE: Record<MembroDTO["role"], string> = {
  OWNER: "Dono",
  ADMIN: "Administrador",
  MEMBER: "Membro",
};

export function ListaMembros({
  membros,
  podeAdministrar,
}: {
  membros: MembroDTO[];
  podeAdministrar: boolean;
}) {
  const mostrarToast = useToast();
  const [pendente, iniciar] = useTransition();
  const [removendo, setRemovendo] = useState<MembroDTO | null>(null);

  function confirmar() {
    if (!removendo) return;

    iniciar(async () => {
      const resultado = await removerMembro(removendo.id);

      mostrarToast(resultado.mensagem, resultado.ok ? "success" : "error");

      if (resultado.ok) {
        setRemovendo(null);
      }
    });
  }

  return (
    <>
      <div className="card perfil-metas-card mt-20">
        <div className="perfil-metas-header">
          <div className="perfil-metas-title-group">
            <div
              className="perfil-card-icon"
              style={{
                background: "rgba(59,130,246,.15)",
                color: "var(--blue)",
                margin: 0,
              }}
            >
              🔑
            </div>

            <div>
              <h3 className="perfil-card-title">Quem tem acesso</h3>

              <p className="text-muted" style={{ fontSize: 13 }}>
                Convide a família pela tela de Pessoas — o convite vai por
                e-mail.
              </p>
            </div>
          </div>
        </div>

        <div className="membros-lista">
          {membros.map((membro) => (
            <div className="membro-item" key={membro.id}>
              <div>
                <div className="list-title">
                  {membro.nome ?? membro.email}
                  {membro.ehVoce ? (
                    <span className="text-muted text-sm"> (você)</span>
                  ) : null}
                </div>

                <div className="list-sub">{membro.email}</div>
              </div>

              <div className="flex items-center gap-8">
                <span className="membro-role">{ROTULO_ROLE[membro.role]}</span>

                {podeAdministrar &&
                !membro.ehVoce &&
                membro.role !== "OWNER" ? (
                  <button
                    className="btn-icon"
                    type="button"
                    title="Remover acesso"
                    onClick={() => setRemovendo(membro)}
                  >
                    🗑️
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>

      <ModalConfirmar
        aberto={Boolean(removendo)}
        titulo="Remover acesso"
        mensagem={`Remover o acesso de ${
          removendo?.nome ?? removendo?.email ?? "este membro"
        }? Os dados da família continuam intactos.`}
        confirmarTexto="Remover acesso"
        pendente={pendente}
        onConfirmar={confirmar}
        onFechar={() => setRemovendo(null)}
      />
    </>
  );
}
