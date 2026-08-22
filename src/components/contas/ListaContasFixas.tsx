"use client";

import { useMemo, useState, useTransition } from "react";

import { removerContaFixa, salvarContaFixa } from "@/actions/contas";
import { BotaoStatus } from "@/components/contas/BotaoStatus";
import { IconeCategoria } from "@/components/contas/IconeCategoria";
import { MenuAcoesConta } from "@/components/contas/MenuAcoesConta";
import { PaginacaoContas } from "@/components/contas/PaginacaoContas";
import { SeloVencimento } from "@/components/contas/SeloVencimento";
import { Modal, ModalConfirmar } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { estiloCategoriaFixa } from "@/lib/categorias";
import { diasAte, formatarMoeda, vencimentoNoMes } from "@/lib/format";
import {
  CATEGORIAS_FIXAS,
  type ContaFixaDTO,
  type PessoaDTO,
  type TipoContaFixa,
} from "@/lib/tipos";

const ROTULO_TIPO: Record<TipoContaFixa, string> = {
  COMPARTILHADA: "Compartilhada",
  INDIVIDUAL: "Individual",
};

type FiltroStatus = "" | "PAGO" | "PENDENTE";

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

  const [busca, setBusca] = useState("");
  const [filtroPessoa, setFiltroPessoa] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>("");
  const [filtroTipo, setFiltroTipo] = useState<TipoContaFixa | "">("");
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(10);

  const nomePorPessoa = useMemo(
    () => new Map(pessoas.map((pessoa) => [pessoa.id, pessoa.nome])),
    [pessoas],
  );

  const totalMes = contas.reduce((soma, conta) => soma + conta.valor, 0);

  const totalPago = contas
    .filter((conta) => pagas.includes(conta.id))
    .reduce((soma, conta) => soma + conta.valor, 0);

  const totalPendente = totalMes - totalPago;

  const termoBusca = busca.trim().toLowerCase();

  const filtradas = contas.filter((conta) => {
    if (termoBusca && !conta.nome.toLowerCase().includes(termoBusca)) {
      return false;
    }

    if (filtroPessoa && conta.pessoaId !== filtroPessoa) return false;
    if (filtroCategoria && conta.categoria !== filtroCategoria) return false;
    if (filtroTipo && conta.tipo !== filtroTipo) return false;

    const paga = pagas.includes(conta.id);

    if (filtroStatus === "PAGO" && !paga) return false;
    if (filtroStatus === "PENDENTE" && paga) return false;

    return true;
  });

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / porPagina));
  const paginaAtual = Math.min(pagina, totalPaginas);

  const visiveis = filtradas.slice(
    (paginaAtual - 1) * porPagina,
    paginaAtual * porPagina,
  );

  const filtrosAtivos = [
    busca,
    filtroPessoa,
    filtroCategoria,
    filtroStatus,
    filtroTipo,
  ].filter(Boolean).length;

  function limparFiltros() {
    setBusca("");
    setFiltroPessoa("");
    setFiltroCategoria("");
    setFiltroStatus("");
    setFiltroTipo("");
    setPagina(1);
  }

  function mudarPagina(nova: number) {
    setPagina(Math.max(1, Math.min(totalPaginas, nova)));
  }

  function mudarAba(status: FiltroStatus) {
    setFiltroStatus(status);
    setPagina(1);
  }

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
      <div className="page-header">
        <h1 className="page-title">Contas Fixas</h1>
        <p className="text-muted" style={{ marginTop: 4 }}>
          Resumo do mês
        </p>
      </div>

      <div className="metrics-grid contas-stats">
        <div className="card metric-card c-blue">
          <div className="metric-icon blue">👛</div>
          <div className="metric-label">Total do mês</div>
          <div className="metric-value">{formatarMoeda(totalMes)}</div>
        </div>

        <div className="card metric-card c-green">
          <div className="metric-icon green">✅</div>
          <div className="metric-label">Total pago</div>
          <div className="metric-value">{formatarMoeda(totalPago)}</div>
        </div>

        <div className="card metric-card c-amber">
          <div className="metric-icon amber">⏰</div>
          <div className="metric-label">Total pendente</div>
          <div className="metric-value">{formatarMoeda(totalPendente)}</div>
        </div>

        <div className="card metric-card c-purple">
          <div className="metric-icon purple">📄</div>
          <div className="metric-label">Contas</div>
          <div className="metric-value">{contas.length} contas</div>
        </div>
      </div>

      <div className="card contas-toolbar mt-16">
        <div className="contas-busca">
          <input
            className="input"
            type="search"
            placeholder="Buscar conta..."
            value={busca}
            onChange={(evento) => {
              setBusca(evento.target.value);
              setPagina(1);
            }}
          />
        </div>

        <select
          className="input"
          value={filtroPessoa}
          onChange={(evento) => {
            setFiltroPessoa(evento.target.value);
            setPagina(1);
          }}
        >
          <option value="">Pessoa</option>

          {pessoas.map((pessoa) => (
            <option key={pessoa.id} value={pessoa.id}>
              {pessoa.nome}
            </option>
          ))}
        </select>

        <select
          className="input"
          value={filtroCategoria}
          onChange={(evento) => {
            setFiltroCategoria(evento.target.value);
            setPagina(1);
          }}
        >
          <option value="">Categoria</option>

          {CATEGORIAS_FIXAS.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select
          className="input"
          value={filtroStatus}
          onChange={(evento) => mudarAba(evento.target.value as FiltroStatus)}
        >
          <option value="">Status</option>
          <option value="PAGO">Pago</option>
          <option value="PENDENTE">Pendente</option>
        </select>

        <select
          className="input"
          value={filtroTipo}
          onChange={(evento) => {
            setFiltroTipo(evento.target.value as TipoContaFixa | "");
            setPagina(1);
          }}
        >
          <option value="">Tipo</option>
          <option value="COMPARTILHADA">Compartilhada</option>
          <option value="INDIVIDUAL">Individual</option>
        </select>

        <button
          className="btn-icon contas-limpar"
          type="button"
          title="Limpar filtros"
          disabled={filtrosAtivos === 0}
          onClick={limparFiltros}
        >
          🧹
          {filtrosAtivos > 0 ? (
            <span className="contas-limpar-contador">{filtrosAtivos}</span>
          ) : null}
        </button>

        <button
          className="btn btn-primary contas-toolbar-novo"
          type="button"
          onClick={() => abrirForm(null)}
        >
          ➕ Nova Conta Fixa
        </button>
      </div>

      <div className="contas-tabs mt-16">
        <button
          type="button"
          className={filtroStatus === "" ? "ativo" : ""}
          onClick={() => mudarAba("")}
        >
          Todas <span className="contas-tab-badge">{contas.length}</span>
        </button>

        <button
          type="button"
          className={filtroStatus === "PAGO" ? "ativo" : ""}
          onClick={() => mudarAba("PAGO")}
        >
          Pagas{" "}
          <span className="contas-tab-badge">
            {contas.filter((conta) => pagas.includes(conta.id)).length}
          </span>
        </button>

        <button
          type="button"
          className={filtroStatus === "PENDENTE" ? "ativo" : ""}
          onClick={() => mudarAba("PENDENTE")}
        >
          Pendentes{" "}
          <span className="contas-tab-badge">
            {contas.filter((conta) => !pagas.includes(conta.id)).length}
          </span>
        </button>
      </div>

      {contas.length === 0 ? (
        <div className="card mt-16">
          <div className="empty-state">
            <div className="empty-icon">🏠</div>
            <div className="empty-title">Nenhuma conta fixa</div>
          </div>
        </div>
      ) : (
        <>
          <div className="card contas-tabela-wrap mt-16">
            <div className="contas-tabela-scroll">
              <table className="contas-tabela">
                <thead>
                  <tr>
                    <th>Conta</th>
                    <th>Categoria</th>
                    <th>Tipo</th>
                    <th>Pessoa</th>
                    <th>Vencimento</th>
                    <th className="contas-tabela-valor">Valor</th>
                    <th>Status</th>
                    <th aria-hidden="true" />
                  </tr>
                </thead>

                <tbody>
                  {visiveis.map((conta) => {
                    const estilo = estiloCategoriaFixa(conta.categoria);
                    const pessoa = conta.pessoaId
                      ? nomePorPessoa.get(conta.pessoaId)
                      : null;
                    const paga = pagas.includes(conta.id);

                    return (
                      <tr key={conta.id}>
                        <td>
                          <div className="contas-tabela-conta">
                            <IconeCategoria estilo={estilo} />
                            <div className="list-title">{conta.nome}</div>
                          </div>
                        </td>

                        <td>{conta.categoria}</td>

                        <td>{ROTULO_TIPO[conta.tipo]}</td>

                        <td>{pessoa ?? (conta.tipo === "INDIVIDUAL" ? "—" : "Todos")}</td>

                        <td>
                          {conta.diaVencimento ? (
                            <SeloVencimento
                              dias={diasAte(
                                vencimentoNoMes(mes, conta.diaVencimento),
                              )}
                              dia={conta.diaVencimento}
                              pago={paga}
                            />
                          ) : (
                            <span className="texto-suave">—</span>
                          )}
                        </td>

                        <td className="contas-tabela-valor">
                          <div className="list-amount">
                            {formatarMoeda(conta.valor)}
                          </div>
                        </td>

                        <td>
                          <BotaoStatus
                            tipo="FIXA"
                            contaId={conta.id}
                            mes={mes}
                            pago={paga}
                          />
                        </td>

                        <td>
                          <MenuAcoesConta
                            onEditar={() => abrirForm(conta)}
                            onRemover={() => setRemovendo(conta)}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {visiveis.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🔎</div>
                <div className="empty-title">
                  Nenhuma conta encontrada com esses filtros
                </div>
              </div>
            ) : null}
          </div>

          <div className="contas-cards space-y-4 mt-16">
            {visiveis.length === 0 ? (
              <div className="card">
                <div className="empty-state">
                  <div className="empty-icon">🔎</div>
                  <div className="empty-title">
                    Nenhuma conta encontrada com esses filtros
                  </div>
                </div>
              </div>
            ) : (
              visiveis.map((conta) => {
                const pessoa = conta.pessoaId
                  ? nomePorPessoa.get(conta.pessoaId)
                  : null;
                const paga = pagas.includes(conta.id);

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
                              <span>{pessoa}</span>
                            </>
                          ) : null}
                        </div>

                        <div className="conta-selos mt-8">
                          <BotaoStatus
                            tipo="FIXA"
                            contaId={conta.id}
                            mes={mes}
                            pago={paga}
                          />

                          {conta.diaVencimento ? (
                            <SeloVencimento
                              dias={diasAte(
                                vencimentoNoMes(mes, conta.diaVencimento),
                              )}
                              dia={conta.diaVencimento}
                              pago={paga}
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

          <PaginacaoContas
            total={filtradas.length}
            pagina={paginaAtual}
            porPagina={porPagina}
            onPagina={mudarPagina}
            onPorPagina={(nova) => {
              setPorPagina(nova);
              setPagina(1);
            }}
          />
        </>
      )}

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
