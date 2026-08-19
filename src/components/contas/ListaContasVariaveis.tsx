"use client";

import { useState, useTransition } from "react";

import { removerContaVariavel, salvarContaVariavel } from "@/actions/contas";
import { BotaoStatus } from "@/components/contas/BotaoStatus";
import { Modal, ModalConfirmar } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { formatarData, formatarMoeda } from "@/lib/format";
import {
  CATEGORIAS_VARIAVEIS,
  type ContaVariavelDTO,
  type PessoaDTO,
} from "@/lib/tipos";

function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

export function ListaContasVariaveis({
  contas,
  pessoas,
  mes,
  pagas,
}: {
  contas: ContaVariavelDTO[];
  pessoas: PessoaDTO[];
  mes: string;
  /** Ids das parcelas já quitadas no mês em foco. */
  pagas: string[];
}) {
  const mostrarToast = useToast();
  const [pendente, iniciar] = useTransition();

  const [formAberto, setFormAberto] = useState(false);
  const [editando, setEditando] = useState<ContaVariavelDTO | null>(null);
  const [removendo, setRemovendo] = useState<ContaVariavelDTO | null>(null);

  const [nome, setNome] = useState("");
  const [valorTotal, setValorTotal] = useState("");
  const [categoria, setCategoria] = useState(CATEGORIAS_VARIAVEIS[0]);
  const [pessoaId, setPessoaId] = useState("");
  const [data, setData] = useState(hojeISO());
  const [parcelas, setParcelas] = useState("1");
  const [observacao, setObservacao] = useState("");

  function abrirForm(conta: ContaVariavelDTO | null) {
    setEditando(conta);
    setNome(conta?.nome ?? "");
    setValorTotal(conta ? String(conta.valorTotal) : "");
    setCategoria(conta?.categoria ?? CATEGORIAS_VARIAVEIS[0]);
    setPessoaId(conta?.pessoaId ?? "");
    setData(conta?.data ?? hojeISO());
    setParcelas(String(conta?.parcelas ?? 1));
    setObservacao(conta?.observacao ?? "");
    setFormAberto(true);
  }

  function salvar() {
    iniciar(async () => {
      const resultado = await salvarContaVariavel({
        id: editando?.id,
        nome,
        valorTotal: valorTotal || 0,
        categoria,
        pessoaId,
        data,
        parcelas: parcelas || 1,
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
      const resultado = await removerContaVariavel(removendo.id);

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
          Gastos do mês e parcelamentos · {pagas.length} de {contas.length}
          {" "}paga(s) neste mês
        </div>

        <button
          className="btn btn-primary"
          type="button"
          onClick={() => abrirForm(null)}
        >
          ➕ Nova Conta Variável
        </button>
      </div>

      <div className="space-y-4">
        {contas.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-icon">💳</div>
              <div className="empty-title">Nenhuma conta variável</div>
            </div>
          </div>
        ) : (
          contas.map((conta) => {
            const pessoa = pessoas.find((item) => item.id === conta.pessoaId);

            return (
              <div className="card" key={conta.id}>
                <div className="flex-between">
                  <div>
                    <div className="list-title">{conta.nome}</div>

                    <div className="list-sub">
                      <span>{conta.categoria}</span>
                      <span>•</span>
                      <span>{pessoa?.nome ?? "—"}</span>
                      <span>•</span>
                      <span>{formatarData(conta.data)}</span>

                      {conta.parcelas > 1 ? (
                        <>
                          <span>•</span>
                          <span>{conta.parcelas}x</span>
                        </>
                      ) : null}
                    </div>

                    <div className="mt-8">
                      <BotaoStatus
                        tipo="VARIAVEL"
                        contaId={conta.id}
                        mes={mes}
                        pago={pagas.includes(conta.id)}
                      />
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="list-amount">
                      {formatarMoeda(conta.valorParcela)}
                    </div>

                    <div className="text-xs texto-suave">
                      Total: {formatarMoeda(conta.valorTotal)}
                    </div>

                    <div className="list-actions mt-16">
                      <button
                        className="btn-icon"
                        type="button"
                        title="Editar"
                        onClick={() => abrirForm(conta)}
                      >
                        ✏️
                      </button>

                      <button
                        className="btn-icon"
                        type="button"
                        title="Remover"
                        onClick={() => setRemovendo(conta)}
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
        titulo={editando ? "Editar Conta Variável" : "Nova Conta Variável"}
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
            <label className="form-label">Nome</label>

            <input
              className="input"
              type="text"
              value={nome}
              onChange={(evento) => setNome(evento.target.value)}
            />
          </div>

          <div>
            <label className="form-label">Valor total</label>

            <input
              className="input"
              type="number"
              min="0"
              step="0.01"
              value={valorTotal}
              onChange={(evento) => setValorTotal(evento.target.value)}
            />
          </div>

          <div>
            <label className="form-label">Categoria</label>

            <select
              className="input"
              value={categoria}
              onChange={(evento) => setCategoria(evento.target.value)}
            >
              {CATEGORIAS_VARIAVEIS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Pessoa</label>

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

          <div>
            <label className="form-label">Data</label>

            <input
              className="input"
              type="date"
              value={data}
              onChange={(evento) => setData(evento.target.value)}
            />
          </div>

          <div>
            <label className="form-label">Parcelas</label>

            <input
              className="input"
              type="number"
              min="1"
              value={parcelas}
              onChange={(evento) => setParcelas(evento.target.value)}
            />
          </div>

          <div>
            <label className="form-label">Observação</label>

            <textarea
              className="input"
              rows={3}
              value={observacao}
              onChange={(evento) => setObservacao(evento.target.value)}
            />
          </div>
        </div>
      </Modal>

      <ModalConfirmar
        aberto={Boolean(removendo)}
        titulo="Remover Conta"
        mensagem="Deseja remover essa conta variável?"
        confirmarTexto="Remover"
        pendente={pendente}
        onConfirmar={confirmarRemocao}
        onFechar={() => setRemovendo(null)}
      />
    </>
  );
}
