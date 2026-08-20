"use client";

import { useState, useTransition } from "react";

import { registrarAporte } from "@/actions/aportes";
import { removerMeta, salvarMeta } from "@/actions/metas";
import { Modal, ModalConfirmar } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { CORES_META, formatarMoeda } from "@/lib/format";
import type { MetaDTO, PessoaDTO } from "@/lib/tipos";

type ModoContribuicao = "AUTOMATICA" | "MANUAL";

export function ListaMetas({
  metas,
  pessoas,
}: {
  metas: MetaDTO[];
  pessoas: PessoaDTO[];
}) {
  const mostrarToast = useToast();
  const [pendente, iniciar] = useTransition();

  const [formAberto, setFormAberto] = useState(false);
  const [editando, setEditando] = useState<MetaDTO | null>(null);
  const [removendo, setRemovendo] = useState<MetaDTO | null>(null);
  const [aportando, setAportando] = useState<MetaDTO | null>(null);
  const [aporte, setAporte] = useState("");
  const [dataAporte, setDataAporte] = useState("");
  const [pessoaAporte, setPessoaAporte] = useState("");

  const [nome, setNome] = useState("");
  const [emoji, setEmoji] = useState("");
  const [valorAlvo, setValorAlvo] = useState("");
  const [valorAtual, setValorAtual] = useState("");
  const [contribuicao, setContribuicao] = useState("");
  const [modo, setModo] = useState<ModoContribuicao>("AUTOMATICA");
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
    setModo(meta?.contribuicaoMensal ? "MANUAL" : "AUTOMATICA");
    setCor(meta?.cor ?? CORES_META[0]);
    setFormAberto(true);
  }

  function salvar() {
    if (modo === "MANUAL" && Number(contribuicao) <= 0) {
      mostrarToast(
        "No modo manual, informe quanto vai guardar por mês.",
        "error",
      );

      return;
    }

    iniciar(async () => {
      const resultado = await salvarMeta({
        id: editando?.id,
        nome,
        emoji: emoji || "🎯",
        valorAlvo: valorAlvo || 0,
        valorAtual: valorAtual || 0,
        // Automático = sem valor gravado: o cálculo divide a sobra do mês.
        contribuicaoMensal: modo === "MANUAL" ? contribuicao : null,
        cor,
      });

      mostrarToast(resultado.mensagem, resultado.ok ? "success" : "error");

      if (resultado.ok) {
        setFormAberto(false);
      }
    });
  }

  function abrirAporte(meta: MetaDTO) {
    setAportando(meta);
    setAporte("");
    setDataAporte(new Date().toISOString().slice(0, 10));
    setPessoaAporte("");
  }

  /**
   * Registra o valor guardado. O aporte entra na meta e sai do saldo do mês
   * da data informada — é a mesma operação do botão Guardar no dashboard.
   */
  function confirmarAporte() {
    if (!aportando) return;

    const valor = Number(aporte);

    if (valor <= 0) {
      mostrarToast("Informe o valor guardado agora.", "error");

      return;
    }

    iniciar(async () => {
      const resultado = await registrarAporte({
        metaId: aportando.id,
        valor,
        data: dataAporte,
        pessoaId: pessoaAporte || null,
      });

      mostrarToast(resultado.mensagem, resultado.ok ? "success" : "error");

      if (resultado.ok) {
        setAportando(null);
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
                      style={{ background: `${meta.cor}22` }}
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
                        <span style={{ fontWeight: 600 }}>
                          {formatarMoeda(meta.valorAtual)}
                        </span>

                        <span className="text-muted">
                          de {formatarMoeda(meta.valorAlvo)}
                        </span>

                        <span className="perfil-meta-pct">{percentual}%</span>

                        <span className="text-muted">
                          {meta.contribuicaoMensal
                            ? `· ${formatarMoeda(meta.contribuicaoMensal)}/mês (manual)`
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
                      title="Registrar valor guardado"
                      onClick={() => abrirAporte(meta)}
                    >
                      💰
                    </button>

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
                        color: "var(--texto-negativo)",
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
            <label className="form-label">Como guardar por mês</label>

            <div className="meta-modo-opcoes">
              <button
                type="button"
                className={`meta-modo-opcao${
                  modo === "AUTOMATICA" ? " selecionada" : ""
                }`}
                onClick={() => setModo("AUTOMATICA")}
              >
                <strong>⚙️ Automático</strong>

                <span className="text-muted">
                  Divide a sobra do mês entre as metas automáticas
                </span>
              </button>

              <button
                type="button"
                className={`meta-modo-opcao${
                  modo === "MANUAL" ? " selecionada" : ""
                }`}
                onClick={() => setModo("MANUAL")}
              >
                <strong>✍️ Manual</strong>

                <span className="text-muted">
                  Você define quanto vai guardar todo mês
                </span>
              </button>
            </div>
          </div>

          {modo === "MANUAL" ? (
            <div className="perfil-form-group">
              <label className="form-label">Guardar por mês (R$)</label>

              <input
                className="input"
                type="number"
                min="0"
                step="0.01"
                placeholder="Ex: 500"
                value={contribuicao}
                onChange={(evento) => setContribuicao(evento.target.value)}
              />
            </div>
          ) : null}

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

      <Modal
        aberto={Boolean(aportando)}
        titulo={`Guardar em ${aportando?.nome ?? "meta"}`}
        onFechar={() => setAportando(null)}
        footer={
          <>
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => setAportando(null)}
              disabled={pendente}
            >
              Cancelar
            </button>

            <button
              className="btn btn-primary"
              type="button"
              style={{ background: "#f59e0b", borderColor: "#f59e0b" }}
              onClick={confirmarAporte}
              disabled={pendente}
            >
              {pendente ? "Guardando..." : "Guardar"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-muted">
            Já guardado: {formatarMoeda(aportando?.valorAtual ?? 0)} de{" "}
            {formatarMoeda(aportando?.valorAlvo ?? 0)}
          </p>

          <div>
            <label className="form-label">Valor guardado agora (R$)</label>

            <input
              className="input"
              type="number"
              min="0"
              step="0.01"
              placeholder="Ex: 200"
              value={aporte}
              onChange={(evento) => setAporte(evento.target.value)}
            />
          </div>

          <div>
            <label className="form-label">Data</label>

            <input
              className="input"
              type="date"
              value={dataAporte}
              onChange={(evento) => setDataAporte(evento.target.value)}
            />
          </div>

          {pessoas.length > 0 ? (
            <div>
              <label className="form-label">Quem guardou</label>

              <select
                className="input"
                value={pessoaAporte}
                onChange={(evento) => setPessoaAporte(evento.target.value)}
              >
                <option value="">A família (dividido entre todos)</option>

                {pessoas.map((pessoa) => (
                  <option key={pessoa.id} value={pessoa.id}>
                    {pessoa.nome}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="aporte-aviso">
            <strong>O valor sai do saldo do mês da data informada.</strong>{" "}
            Guardar dinheiro conta como uma saída, do mesmo jeito que uma conta
            paga — e entra no total da meta.
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
