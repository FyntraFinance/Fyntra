"use client";

import { useState, useTransition } from "react";

import { removerMeta, salvarMeta } from "@/actions/metas";
import { Modal, ModalConfirmar } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { CORES_META, formatarMoeda } from "@/lib/format";
import type { MetaDTO } from "@/lib/tipos";

export function ListaMetas({ metas }: { metas: MetaDTO[] }) {
  const mostrarToast = useToast();
  const [pendente, iniciar] = useTransition();

  const [formAberto, setFormAberto] = useState(false);
  const [editando, setEditando] = useState<MetaDTO | null>(null);
  const [removendo, setRemovendo] = useState<MetaDTO | null>(null);

  const [nome, setNome] = useState("");
  const [emoji, setEmoji] = useState("");
  const [valorAlvo, setValorAlvo] = useState("");
  const [valorAtual, setValorAtual] = useState("");
  const [contribuicao, setContribuicao] = useState("");
  const [cor, setCor] = useState(CORES_META[0]);

  function abrirForm(meta: MetaDTO | null) {
    setEditando(meta);
    setNome(meta?.nome ?? "");
    setEmoji(meta?.emoji ?? "");
    setValorAlvo(meta ? String(meta.valorAlvo) : "");
    setValorAtual(meta ? String(meta.valorAtual) : "0");
    setContribuicao(
      meta?.contribuicaoMensal ? String(meta.contribuicaoMensal) : "",
    );
    setCor(meta?.cor ?? CORES_META[0]);
    setFormAberto(true);
  }

  function salvar() {
    iniciar(async () => {
      const resultado = await salvarMeta({
        id: editando?.id,
        nome,
        emoji: emoji || "🎯",
        valorAlvo: valorAlvo || 0,
        valorAtual: valorAtual || 0,
        contribuicaoMensal: contribuicao.trim() === "" ? null : contribuicao,
        cor,
      });

      mostrarToast(resultado.mensagem, resultado.ok ? "success" : "error");

      if (resultado.ok) {
        setFormAberto(false);
      }
    });
  }

  function confirmarRemocao() {
    if (!removendo) return;

    iniciar(async () => {
      const resultado = await removerMeta(removendo.id);

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
                background: "rgba(245,158,11,.15)",
                color: "#f59e0b",
                margin: 0,
              }}
            >
              🎯
            </div>

            <div>
              <h3 className="perfil-card-title">Metas Financeiras</h3>

              <p className="text-muted" style={{ fontSize: 13 }}>
                Defina objetivos e acompanhe o progresso automaticamente no
                dashboard.
              </p>
            </div>
          </div>

          <button
            className="btn btn-primary"
            type="button"
            style={{
              background: "#f59e0b",
              borderColor: "#f59e0b",
              whiteSpace: "nowrap",
            }}
            onClick={() => abrirForm(null)}
          >
            + Nova Meta
          </button>
        </div>

        <div className="perfil-metas-lista">
          {metas.length === 0 ? (
            <div className="perfil-metas-vazio">
              🎯 Nenhuma meta cadastrada ainda. Clique em{" "}
              <strong>+ Nova Meta</strong> para começar.
            </div>
          ) : (
            metas.map((meta) => {
              const percentual =
                meta.valorAlvo > 0
                  ? Math.min(
                      100,
                      Math.round((meta.valorAtual / meta.valorAlvo) * 100),
                    )
                  : 0;

              return (
                <div className="perfil-meta-item" key={meta.id}>
                  <div className="perfil-meta-item-left">
                    <div
                      className="perfil-meta-emoji"
                      style={{ background: `${meta.cor}22`, color: meta.cor }}
                    >
                      {meta.emoji}
                    </div>

                    <div className="perfil-meta-info">
                      <div className="perfil-meta-nome">{meta.nome}</div>

                      <div className="perfil-meta-prog-track">
                        <div
                          className="perfil-meta-prog-bar"
                          style={{
                            width: `${percentual}%`,
                            background: meta.cor,
                          }}
                        />
                      </div>

                      <div className="perfil-meta-valores">
                        <span style={{ color: meta.cor, fontWeight: 600 }}>
                          {formatarMoeda(meta.valorAtual)}
                        </span>

                        <span className="text-muted">
                          de {formatarMoeda(meta.valorAlvo)}
                        </span>

                        <span className="perfil-meta-pct">{percentual}%</span>

                        <span className="text-muted">
                          {meta.contribuicaoMensal
                            ? `· ${formatarMoeda(meta.contribuicaoMensal)}/mês`
                            : "· contribuição automática"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="perfil-meta-acoes">
                    <button
                      className="btn btn-secondary"
                      type="button"
                      style={{ padding: "6px 12px", fontSize: 13 }}
                      onClick={() => abrirForm(meta)}
                    >
                      ✏️
                    </button>

                    <button
                      className="btn btn-secondary"
                      type="button"
                      style={{
                        padding: "6px 12px",
                        fontSize: 13,
                        borderColor: "var(--danger)",
                        color: "var(--danger)",
                      }}
                      onClick={() => setRemovendo(meta)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <Modal
        aberto={formAberto}
        titulo={editando ? "Editar Meta" : "Nova Meta"}
        onFechar={() => setFormAberto(false)}
        footer={
          <>
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => setFormAberto(false)}
              disabled={pendente}
            >
              Cancelar
            </button>

            <button
              className="btn btn-primary"
              type="button"
              style={{ background: "#f59e0b", borderColor: "#f59e0b" }}
              onClick={salvar}
              disabled={pendente}
            >
              {pendente ? "Salvando..." : editando ? "Salvar" : "Criar Meta"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="perfil-form-row">
            <div className="perfil-form-group" style={{ maxWidth: 80 }}>
              <label className="form-label">Emoji</label>

              <input
                className="input"
                type="text"
                maxLength={2}
                placeholder="🎯"
                value={emoji}
                onChange={(evento) => setEmoji(evento.target.value)}
              />
            </div>

            <div className="perfil-form-group" style={{ flex: 1 }}>
              <label className="form-label">Nome da meta</label>

              <input
                className="input"
                type="text"
                placeholder="Ex: Viagem Europa"
                value={nome}
                onChange={(evento) => setNome(evento.target.value)}
              />
            </div>
          </div>

          <div className="perfil-form-row">
            <div className="perfil-form-group">
              <label className="form-label">Valor alvo (R$)</label>

              <input
                className="input"
                type="number"
                min="0"
                step="0.01"
                placeholder="15000"
                value={valorAlvo}
                onChange={(evento) => setValorAlvo(evento.target.value)}
              />
            </div>

            <div className="perfil-form-group">
              <label className="form-label">Já guardado (R$)</label>

              <input
                className="input"
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                value={valorAtual}
                onChange={(evento) => setValorAtual(evento.target.value)}
              />
            </div>
          </div>

          <div className="perfil-form-group">
            <label className="form-label">
              Contribuição mensal (R$){" "}
              <span
                className="text-muted"
                style={{ fontSize: 11, fontWeight: 400 }}
              >
                — deixe em branco para calcular automaticamente
              </span>
            </label>

            <input
              className="input"
              type="number"
              min="0"
              step="0.01"
              placeholder="Automático (baseado na sobra)"
              value={contribuicao}
              onChange={(evento) => setContribuicao(evento.target.value)}
            />
          </div>

          <div className="perfil-form-group">
            <label className="form-label">Cor</label>

            <div className="meta-cor-chips">
              {CORES_META.map((opcao) => (
                <button
                  key={opcao}
                  type="button"
                  className={`meta-cor-chip${
                    opcao === cor ? " selecionada" : ""
                  }`}
                  style={{ background: opcao }}
                  onClick={() => setCor(opcao)}
                />
              ))}
            </div>
          </div>
        </div>
      </Modal>

      <ModalConfirmar
        aberto={Boolean(removendo)}
        titulo="Excluir Meta"
        mensagem={
          <>
            Deseja excluir a meta <strong>{removendo?.nome}</strong>? Esta ação
            não pode ser desfeita.
          </>
        }
        confirmarTexto="🗑️ Excluir"
        pendente={pendente}
        onConfirmar={confirmarRemocao}
        onFechar={() => setRemovendo(null)}
      />
    </>
  );
}
