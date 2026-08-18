"use client";

import { useState, useTransition } from "react";

import { removerGanhoExtra, salvarGanhoExtra } from "@/actions/ganhos";
import { Modal, ModalConfirmar } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import {
  corAvatar,
  formatarData,
  formatarMesAno,
  formatarMoeda,
  inicialNome,
} from "@/lib/format";
import {
  CATEGORIAS_GANHO,
  type GanhoExtraDTO,
  type PessoaDTO,
} from "@/lib/tipos";

function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

/** Dia de hoje quando o mês em foco é o corrente; senão, dia 1 daquele mês. */
function dataPadrao(mes: string) {
  const hoje = hojeISO();

  return hoje.startsWith(mes) ? hoje : `${mes}-01`;
}

/**
 * Entradas avulsas de dinheiro (freela, bônus, venda), sempre no nome de uma
 * pessoa: elas somam na renda dela no mês e, por consequência, na sobra da
 * família.
 */
export function ListaGanhos({
  ganhos,
  pessoas,
  mes,
}: {
  /** Ganhos que valem para o mês em foco. */
  ganhos: GanhoExtraDTO[];
  pessoas: PessoaDTO[];
  mes: string;
}) {
  const mostrarToast = useToast();
  const [pendente, iniciar] = useTransition();

  const [formAberto, setFormAberto] = useState(false);
  const [editando, setEditando] = useState<GanhoExtraDTO | null>(null);
  const [removendo, setRemovendo] = useState<GanhoExtraDTO | null>(null);

  const [nome, setNome] = useState("");
  const [valor, setValor] = useState("");
  const [categoria, setCategoria] = useState(CATEGORIAS_GANHO[0]);
  const [pessoaId, setPessoaId] = useState("");
  const [data, setData] = useState(dataPadrao(mes));
  const [recorrente, setRecorrente] = useState(false);
  const [observacao, setObservacao] = useState("");

  const total = ganhos.reduce((soma, ganho) => soma + ganho.valor, 0);

  function abrirForm(ganho: GanhoExtraDTO | null) {
    setEditando(ganho);
    setNome(ganho?.nome ?? "");
    setValor(ganho ? String(ganho.valor) : "");
    setCategoria(ganho?.categoria ?? CATEGORIAS_GANHO[0]);
    setPessoaId(ganho?.pessoaId ?? pessoas[0]?.id ?? "");
    setData(ganho?.data ?? dataPadrao(mes));
    setRecorrente(ganho?.recorrente ?? false);
    setObservacao(ganho?.observacao ?? "");
    setFormAberto(true);
  }

  function salvar() {
    iniciar(async () => {
      const resultado = await salvarGanhoExtra({
        id: editando?.id,
        nome,
        valor: valor || 0,
        categoria,
        pessoaId,
        data,
        recorrente,
        observacao,
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
      const resultado = await removerGanhoExtra(removendo.id);

      mostrarToast(resultado.mensagem, resultado.ok ? "success" : "error");

      if (resultado.ok) {
        setRemovendo(null);
      }
    });
  }

  return (
    <>
      <div className="page-actions">
        <div className="text-muted">
          Entradas fora do salário em {formatarMesAno(mes)} ·{" "}
          <strong className="text-emerald-400">{formatarMoeda(total)}</strong>
        </div>

        <button
          className="btn btn-primary"
          type="button"
          onClick={() => abrirForm(null)}
          disabled={pessoas.length === 0}
        >
          ➕ Novo Ganho Extra
        </button>
      </div>

      <div className="space-y-4">
        {pessoas.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-icon">👥</div>

              <div className="empty-title">
                Cadastre uma pessoa primeiro
              </div>

              <div className="text-muted" style={{ marginTop: 8 }}>
                Todo ganho extra pertence a alguém — crie a pessoa na aba
                Pessoas para começar.
              </div>
            </div>
          </div>
        ) : ganhos.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-icon">💵</div>
              <div className="empty-title">Nenhum ganho extra neste mês</div>
            </div>
          </div>
        ) : (
          ganhos.map((ganho) => {
            const indice = pessoas.findIndex(
              (pessoa) => pessoa.id === ganho.pessoaId,
            );

            const pessoa = pessoas[indice];

            return (
              <div className="card" key={ganho.id}>
                <div className="flex-between">
                  <div className="flex items-center gap-12">
                    <div
                      className="person-avatar"
                      style={{ background: corAvatar(Math.max(0, indice)) }}
                    >
                      {inicialNome(pessoa?.nome)}
                    </div>

                    <div>
                      <div className="list-title">{ganho.nome}</div>

                      <div className="list-sub">
                        <span>{pessoa?.nome ?? "—"}</span>
                        <span>•</span>
                        <span>{ganho.categoria}</span>
                        <span>•</span>
                        <span>{formatarData(ganho.data)}</span>

                        {ganho.recorrente ? (
                          <>
                            <span>•</span>
                            <span className="convite-badge ativo">
                              ↻ todo mês
                            </span>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="list-amount text-emerald-400">
                      + {formatarMoeda(ganho.valor)}
                    </div>

                    <div className="list-actions mt-16">
                      <button
                        className="btn-icon"
                        type="button"
                        title="Editar"
                        onClick={() => abrirForm(ganho)}
                      >
                        ✏️
                      </button>

                      <button
                        className="btn-icon"
                        type="button"
                        title="Remover"
                        onClick={() => setRemovendo(ganho)}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <Modal
        aberto={formAberto}
        titulo={editando ? "Editar Ganho Extra" : "Novo Ganho Extra"}
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
              onClick={salvar}
              disabled={pendente}
            >
              {pendente ? "Salvando..." : "Salvar"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="form-label">Descrição</label>

            <input
              className="input"
              type="text"
              placeholder="Ex: Freela do site"
              value={nome}
              onChange={(evento) => setNome(evento.target.value)}
            />
          </div>

          <div>
            <label className="form-label">Quem recebeu</label>

            <select
              className="input"
              value={pessoaId}
              onChange={(evento) => setPessoaId(evento.target.value)}
            >
              <option value="">Selecione</option>

              {pessoas.map((pessoa) => (
                <option key={pessoa.id} value={pessoa.id}>
                  {pessoa.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="perfil-form-row">
            <div className="perfil-form-group">
              <label className="form-label">Valor</label>

              <input
                className="input"
                type="number"
                min="0"
                step="0.01"
                value={valor}
                onChange={(evento) => setValor(evento.target.value)}
              />
            </div>

            <div className="perfil-form-group">
              <label className="form-label">Data</label>

              <input
                className="input"
                type="date"
                value={data}
                onChange={(evento) => setData(evento.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="form-label">Categoria</label>

            <select
              className="input"
              value={categoria}
              onChange={(evento) => setCategoria(evento.target.value)}
            >
              {CATEGORIAS_GANHO.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <label className="ganho-recorrente">
            <input
              type="checkbox"
              checked={recorrente}
              onChange={(evento) => setRecorrente(evento.target.checked)}
            />

            <span>
              Se repete todo mês
              <span className="text-muted text-xs">
                {" "}
                — vale deste mês em diante
              </span>
            </span>
          </label>

          <div>
            <label className="form-label">Observação</label>

            <textarea
              className="input"
              rows={2}
              value={observacao}
              onChange={(evento) => setObservacao(evento.target.value)}
            />
          </div>
        </div>
      </Modal>

      <ModalConfirmar
        aberto={Boolean(removendo)}
        titulo="Remover Ganho"
        mensagem={`Deseja remover ${removendo?.nome ?? "este ganho"}?`}
        confirmarTexto="Remover"
        pendente={pendente}
        onConfirmar={confirmarRemocao}
        onFechar={() => setRemovendo(null)}
      />
    </>
  );
}
