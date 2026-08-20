"use client";

import { useState, useTransition } from "react";

import { removerContaFixa, salvarContaFixa } from "@/actions/contas";
import { BotaoStatus } from "@/components/contas/BotaoStatus";
import { Modal, ModalConfirmar } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { diasAte, formatarMoeda, vencimentoNoMes } from "@/lib/format";
import { SeloVencimento } from "@/components/contas/SeloVencimento";
import {
  CATEGORIAS_FIXAS,
  type ContaFixaDTO,
  type PessoaDTO,
  type TipoContaFixa,
} from "@/lib/tipos";

const ROTULO_TIPO: Record<TipoContaFixa, string> = {
  COMPARTILHADA: "compartilhada",
  INDIVIDUAL: "individual",
};

export function ListaContasFixas({
  contas,
  pessoas,
  mes,
  pagas,
}: {
  contas: ContaFixaDTO[];
  pessoas: PessoaDTO[];
  mes: string;
  /** Ids das contas já quitadas no mês em foco. */
  pagas: string[];
}) {
  const mostrarToast = useToast();
  const [pendente, iniciar] = useTransition();

  const [formAberto, setFormAberto] = useState(false);
  const [editando, setEditando] = useState<ContaFixaDTO | null>(null);
  const [removendo, setRemovendo] = useState<ContaFixaDTO | null>(null);

  const [nome, setNome] = useState("");
  const [valor, setValor] = useState("");
  const [categoria, setCategoria] = useState(CATEGORIAS_FIXAS[0]);
  const [tipo, setTipo] = useState<TipoContaFixa>("COMPARTILHADA");
  const [pessoaId, setPessoaId] = useState("");
  const [dataInicio, setDataInicio] = useState(mes);
  const [diaVencimento, setDiaVencimento] = useState("");
  const [observacao, setObservacao] = useState("");

  function abrirForm(conta: ContaFixaDTO | null) {
    setEditando(conta);
    setNome(conta?.nome ?? "");
    setValor(conta ? String(conta.valor) : "");
    setCategoria(conta?.categoria ?? CATEGORIAS_FIXAS[0]);
    setTipo(conta?.tipo ?? "COMPARTILHADA");
    setPessoaId(conta?.pessoaId ?? "");
    setDataInicio(conta?.dataInicio ?? mes);
    setDiaVencimento(conta?.diaVencimento ? String(conta.diaVencimento) : "");
    setObservacao(conta?.observacao ?? "");
    setFormAberto(true);
  }

  function salvar() {
    iniciar(async () => {
      const resultado = await salvarContaFixa({
        id: editando?.id,
        nome,
        valor: valor || 0,
        categoria,
        tipo,
        pessoaId: tipo === "INDIVIDUAL" ? pessoaId : null,
        dataInicio,
        diaVencimento: diaVencimento || null,
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
      const resultado = await removerContaFixa(removendo.id);

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
          Contas recorrentes mensais · {pagas.length} de {contas.length} paga(s)
          neste mês
        </div>

        <button
          className="btn btn-primary"
          type="button"
          onClick={() => abrirForm(null)}
        >
          ➕ Nova Conta Fixa
        </button>
      </div>

      <div className="space-y-4">
        {contas.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-icon">🏠</div>
              <div className="empty-title">Nenhuma conta fixa</div>
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
                      <span>{ROTULO_TIPO[conta.tipo]}</span>

                      {pessoa ? (
                        <>
                          <span>•</span>
                          <span>{pessoa.nome}</span>
                        </>
                      ) : null}
                    </div>

                    <div className="conta-selos mt-8">
                      <BotaoStatus
                        tipo="FIXA"
                        contaId={conta.id}
                        mes={mes}
                        pago={pagas.includes(conta.id)}
                      />

                      {conta.diaVencimento ? (
                        <SeloVencimento
                          dias={diasAte(
                            vencimentoNoMes(mes, conta.diaVencimento),
                          )}
                          dia={conta.diaVencimento}
                          pago={pagas.includes(conta.id)}
                        />
                      ) : null}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="list-amount">
                      {formatarMoeda(conta.valor)}
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
        titulo={editando ? "Editar Conta Fixa" : "Nova Conta Fixa"}
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

          <div>
            <label className="form-label">Categoria</label>

            <select
              className="input"
              value={categoria}
              onChange={(evento) => setCategoria(evento.target.value)}
            >
              {CATEGORIAS_FIXAS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Tipo</label>

            <select
              className="input"
              value={tipo}
              onChange={(evento) =>
                setTipo(evento.target.value as TipoContaFixa)
              }
            >
              <option value="COMPARTILHADA">Compartilhada</option>
              <option value="INDIVIDUAL">Individual</option>
            </select>
          </div>

          {tipo === "INDIVIDUAL" ? (
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
          ) : null}

          <div>
            <label className="form-label">
              Dia do vencimento{" "}
              <span className="text-muted text-xs">
                — opcional, de 1 a 31
              </span>
            </label>

            <input
              className="input"
              type="number"
              min="1"
              max="31"
              placeholder="Ex: 10"
              value={diaVencimento}
              onChange={(evento) => setDiaVencimento(evento.target.value)}
            />
          </div>

          <div>
            <label className="form-label">Mês inicial</label>

            <input
              className="input"
              type="month"
              value={dataInicio}
              onChange={(evento) => setDataInicio(evento.target.value)}
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
        mensagem="Deseja remover essa conta fixa?"
        confirmarTexto="Remover"
        pendente={pendente}
        onConfirmar={confirmarRemocao}
        onFechar={() => setRemovendo(null)}
      />
    </>
  );
}
