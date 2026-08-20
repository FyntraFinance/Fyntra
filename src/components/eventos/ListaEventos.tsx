"use client";

import { useState, useTransition } from "react";

import {
  adicionarParticipante,
  encerrarEvento,
  registrarPagamentoParticipante,
  removerEvento,
  removerGastoEvento,
  removerParticipante,
  salvarEvento,
  salvarGastoEvento,
} from "@/actions/eventos";
import { Modal, ModalConfirmar } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { formatarData, formatarMoeda } from "@/lib/format";
import {
  CATEGORIAS_EVENTO,
  type EventoDTO,
  type GastoEventoDTO,
  type ParticipanteEventoDTO,
  type PessoaDTO,
} from "@/lib/tipos";

function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

const EMOJIS_EVENTO = ["🧳", "🏖️", "🎉", "🍻", "⛰️", "🎂", "🚗", "🎄"];

export function ListaEventos({
  eventos,
  pessoas,
}: {
  eventos: EventoDTO[];
  pessoas: PessoaDTO[];
}) {
  const mostrarToast = useToast();
  const [pendente, iniciar] = useTransition();

  const [abertos, setAbertos] = useState<string[]>(
    eventos.filter((evento) => !evento.encerrado).map((evento) => evento.id),
  );

  const [formEvento, setFormEvento] = useState(false);
  const [editandoEvento, setEditandoEvento] = useState<EventoDTO | null>(null);
  const [removendoEvento, setRemovendoEvento] = useState<EventoDTO | null>(
    null,
  );

  const [nome, setNome] = useState("");
  const [emoji, setEmoji] = useState(EMOJIS_EVENTO[0]);
  const [descricao, setDescricao] = useState("");
  const [dataInicio, setDataInicio] = useState(hojeISO());
  const [dataFim, setDataFim] = useState("");

  const [formParticipante, setFormParticipante] = useState<EventoDTO | null>(
    null,
  );
  const [participanteNome, setParticipanteNome] = useState("");
  const [participantePessoaId, setParticipantePessoaId] = useState("");

  const [formGasto, setFormGasto] = useState<{
    evento: EventoDTO;
    gasto: GastoEventoDTO | null;
  } | null>(null);
  const [gastoNome, setGastoNome] = useState("");
  const [gastoValor, setGastoValor] = useState("");
  const [gastoCategoria, setGastoCategoria] = useState(CATEGORIAS_EVENTO[0]);
  const [gastoData, setGastoData] = useState(hojeISO());
  const [gastoObservacao, setGastoObservacao] = useState("");

  const [removendoGasto, setRemovendoGasto] = useState<GastoEventoDTO | null>(
    null,
  );

  const [pagando, setPagando] = useState<ParticipanteEventoDTO | null>(null);
  const [valorPago, setValorPago] = useState("");

  function alternarAberto(id: string) {
    setAbertos((atuais) =>
      atuais.includes(id)
        ? atuais.filter((item) => item !== id)
        : [...atuais, id],
    );
  }

  function abrirFormEvento(evento: EventoDTO | null) {
    setEditandoEvento(evento);
    setNome(evento?.nome ?? "");
    setEmoji(evento?.emoji ?? EMOJIS_EVENTO[0]);
    setDescricao(evento?.descricao ?? "");
    setDataInicio(evento?.dataInicio ?? hojeISO());
    setDataFim(evento?.dataFim ?? "");
    setFormEvento(true);
  }

  function salvarEventoAtual() {
    iniciar(async () => {
      const resultado = await salvarEvento({
        id: editandoEvento?.id,
        nome,
        emoji,
        descricao,
        dataInicio,
        dataFim,
      });

      mostrarToast(resultado.mensagem, resultado.ok ? "success" : "error");

      if (resultado.ok) {
        setFormEvento(false);
      }
    });
  }

  function abrirFormParticipante(evento: EventoDTO) {
    setFormParticipante(evento);
    setParticipanteNome("");
    setParticipantePessoaId("");
  }

  function salvarParticipante() {
    if (!formParticipante) return;

    const pessoa = pessoas.find((item) => item.id === participantePessoaId);

    iniciar(async () => {
      const resultado = await adicionarParticipante({
        eventoId: formParticipante.id,
        // Ao escolher alguém da família, o nome cadastrado é o que vale.
        nome: pessoa?.nome ?? participanteNome,
        pessoaId: participantePessoaId || null,
      });

      mostrarToast(resultado.mensagem, resultado.ok ? "success" : "error");

      if (resultado.ok) {
        setFormParticipante(null);
      }
    });
  }

  function abrirFormGasto(evento: EventoDTO, gasto: GastoEventoDTO | null) {
    setFormGasto({ evento, gasto });
    setGastoNome(gasto?.nome ?? "");
    setGastoValor(gasto ? String(gasto.valor) : "");
    setGastoCategoria(gasto?.categoria ?? CATEGORIAS_EVENTO[0]);
    setGastoData(gasto?.data ?? evento.dataInicio ?? hojeISO());
    setGastoObservacao(gasto?.observacao ?? "");
  }

  function salvarGasto() {
    if (!formGasto) return;

    iniciar(async () => {
      const resultado = await salvarGastoEvento({
        id: formGasto.gasto?.id,
        eventoId: formGasto.evento.id,
        nome: gastoNome,
        valor: gastoValor || 0,
        categoria: gastoCategoria,
        data: gastoData,
        observacao: gastoObservacao,
      });

      mostrarToast(resultado.mensagem, resultado.ok ? "success" : "error");

      if (resultado.ok) {
        setFormGasto(null);
      }
    });
  }

  function abrirPagamento(participante: ParticipanteEventoDTO) {
    setPagando(participante);
    setValorPago(String(participante.valorPago || ""));
  }

  function salvarPagamento() {
    if (!pagando) return;

    iniciar(async () => {
      const resultado = await registrarPagamentoParticipante({
        participanteId: pagando.id,
        valorPago: valorPago || 0,
      });

      mostrarToast(resultado.mensagem, resultado.ok ? "success" : "error");

      if (resultado.ok) {
        setPagando(null);
      }
    });
  }

  function executar(acao: () => Promise<{ ok: boolean; mensagem: string }>) {
    iniciar(async () => {
      const resultado = await acao();

      mostrarToast(resultado.mensagem, resultado.ok ? "success" : "error");
    });
  }

  const pessoasDisponiveis = (evento: EventoDTO) =>
    pessoas.filter(
      (pessoa) =>
        !evento.participantes.some(
          (participante) => participante.pessoaId === pessoa.id,
        ),
    );

  return (
    <>
      <div className="page-actions">
        <div className="text-muted">
          Viagens e eventos com divisão igualitária das despesas
        </div>

        <button
          className="btn btn-primary"
          type="button"
          onClick={() => abrirFormEvento(null)}
        >
          ➕ Novo Evento
        </button>
      </div>

      <div className="space-y-4">
        {eventos.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-icon">🧳</div>
              <div className="empty-title">Nenhum evento cadastrado</div>

              <div className="text-muted" style={{ marginTop: 8 }}>
                Crie um evento para a viagem ou a festa, coloque quem vai
                (inclusive quem não é da família) e cada gasto será dividido em
                partes iguais.
              </div>
            </div>
          </div>
        ) : (
          eventos.map((evento) => {
            const aberto = abertos.includes(evento.id);

            const naFamilia = evento.participantes.filter(
              (participante) => participante.pessoaId,
            ).length;

            return (
              <div className="card evento-card" key={evento.id}>
                <div className="evento-topo">
                  <button
                    className="evento-identidade"
                    type="button"
                    onClick={() => alternarAberto(evento.id)}
                  >
                    <span className="evento-emoji">{evento.emoji}</span>

                    <span>
                      <span className="list-title">
                        {evento.nome}

                        {evento.encerrado ? (
                          <span className="convite-badge pendente evento-badge">
                            encerrado
                          </span>
                        ) : null}
                      </span>

                      <span className="list-sub evento-datas">
                        {formatarData(evento.dataInicio)}
                        {evento.dataFim
                          ? ` até ${formatarData(evento.dataFim)}`
                          : ""}
                        {" · "}
                        {evento.participantes.length} participante(s)
                        {" · "}
                        {naFamilia} da família
                      </span>
                    </span>
                  </button>

                  <div className="text-right">
                    <div className="list-amount">
                      {formatarMoeda(evento.total)}
                    </div>

                    <div className="text-xs texto-suave">
                      {formatarMoeda(evento.cotaPorParticipante)} por pessoa
                    </div>
                  </div>
                </div>

                {/* Andamento geral: quanto do evento já foi acertado. */}
                {evento.total > 0 ? (
                  <div className="evento-progresso">
                    <div className="evento-progresso-topo">
                      <span>
                        {formatarMoeda(evento.totalPago)} pago de{" "}
                        {formatarMoeda(evento.total)}
                      </span>

                      <strong
                        className={
                          evento.percentualPago >= 100 ? "valor-positivo" : ""
                        }
                      >
                        {evento.percentualPago}%
                      </strong>
                    </div>

                    <div className="evento-barra">
                      <div
                        className={`evento-barra-preenchida${
                          evento.percentualPago >= 100 ? " completa" : ""
                        }`}
                        style={{ width: `${evento.percentualPago}%` }}
                      />
                    </div>

                    {evento.total > evento.totalPago ? (
                      <div className="text-xs texto-suave">
                        Falta acertar{" "}
                        {formatarMoeda(evento.total - evento.totalPago)}
                      </div>
                    ) : (
                      <div className="text-xs valor-positivo">
                        ✅ Todo mundo já acertou a parte
                      </div>
                    )}
                  </div>
                ) : null}

                {aberto ? (
                  <div className="evento-corpo">
                    <div className="evento-secao">
                      <div className="evento-secao-titulo">
                        👥 Quem está no rateio
                      </div>

                      {evento.participantes.length === 0 ? (
                        <span className="text-muted">
                          Nenhum participante ainda — sem gente no rateio, nada
                          é dividido.
                        </span>
                      ) : (
                        <div className="participante-lista">
                          {evento.participantes.map((participante) => (
                            <div
                              className="participante-item"
                              key={participante.id}
                            >
                              <div className="participante-topo">
                                <span className="participante-nome">
                                  {participante.nome}

                                  <span className="evento-chip-tag">
                                    {participante.temAcesso
                                      ? "com acesso"
                                      : participante.pessoaId
                                        ? "da família"
                                        : "convidado"}
                                  </span>
                                </span>

                                <span className="participante-valores">
                                  <strong>
                                    {formatarMoeda(participante.valorPago)}
                                  </strong>{" "}
                                  <span className="texto-suave">
                                    de {formatarMoeda(participante.cota)}
                                  </span>
                                </span>
                              </div>

                              <div className="evento-barra fina">
                                <div
                                  className={`evento-barra-preenchida${
                                    participante.percentualPago >= 100
                                      ? " completa"
                                      : ""
                                  }`}
                                  style={{
                                    width: `${participante.percentualPago}%`,
                                  }}
                                />
                              </div>

                              <div className="participante-acoes">
                                <span className="text-xs texto-suave">
                                  {participante.valorPago >= participante.cota
                                    ? "✅ acertado"
                                    : `falta ${formatarMoeda(
                                        participante.cota -
                                          participante.valorPago,
                                      )}`}
                                </span>

                                <button
                                  type="button"
                                  className="btn btn-secondary participante-btn"
                                  onClick={() => abrirPagamento(participante)}
                                >
                                  💵 Registrar pagamento
                                </button>

                                <button
                                  type="button"
                                  className="btn-icon participante-remover"
                                  title="Tirar do rateio"
                                  disabled={pendente}
                                  onClick={() =>
                                    executar(() =>
                                      removerParticipante(participante.id),
                                    )
                                  }
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <button
                        className="btn btn-secondary evento-btn-add"
                        type="button"
                        onClick={() => abrirFormParticipante(evento)}
                      >
                        + Participante
                      </button>
                    </div>

                    <div className="evento-secao">
                      <div className="evento-secao-titulo">
                        💸 Gastos do evento
                      </div>

                      {evento.gastos.length === 0 ? (
                        <div className="text-muted">
                          Nenhum gasto lançado ainda.
                        </div>
                      ) : (
                        <div className="membros-lista">
                          {evento.gastos.map((gasto) => (
                            <div className="membro-item" key={gasto.id}>
                              <div>
                                <div className="list-title">{gasto.nome}</div>

                                <div className="list-sub">
                                  <span>{gasto.categoria}</span>
                                  <span>{formatarData(gasto.data)}</span>
                                  <span>
                                    {formatarMoeda(gasto.cotaPorParticipante)}{" "}
                                    por pessoa
                                  </span>
                                </div>
                              </div>

                              <div className="evento-gasto-direita">
                                <span className="list-amount">
                                  {formatarMoeda(gasto.valor)}
                                </span>

                                <button
                                  className="btn-icon"
                                  type="button"
                                  title="Editar"
                                  onClick={() => abrirFormGasto(evento, gasto)}
                                >
                                  ✏️
                                </button>

                                <button
                                  className="btn-icon"
                                  type="button"
                                  title="Remover"
                                  onClick={() => setRemovendoGasto(gasto)}
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <button
                        className="btn btn-secondary evento-btn-add"
                        type="button"
                        onClick={() => abrirFormGasto(evento, null)}
                      >
                        + Gasto
                      </button>
                    </div>

                    {naFamilia > 0 && evento.total > 0 ? (
                      <p className="text-muted evento-aviso">
                        ✅ A cota de cada participante da família já entra
                        automaticamente nas contas variáveis e no resumo dela.
                      </p>
                    ) : null}

                    <div className="evento-acoes">
                      <button
                        className="btn btn-secondary"
                        type="button"
                        onClick={() => abrirFormEvento(evento)}
                      >
                        ✏️ Editar
                      </button>

                      <button
                        className="btn btn-secondary"
                        type="button"
                        disabled={pendente}
                        onClick={() =>
                          executar(() =>
                            encerrarEvento(evento.id, !evento.encerrado),
                          )
                        }
                      >
                        {evento.encerrado ? "↩️ Reabrir" : "🏁 Encerrar"}
                      </button>

                      <button
                        className="btn btn-secondary evento-btn-remover"
                        type="button"
                        onClick={() => setRemovendoEvento(evento)}
                      >
                        🗑️ Remover
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>

      <Modal
        aberto={formEvento}
        titulo={editandoEvento ? "Editar Evento" : "Novo Evento"}
        onFechar={() => setFormEvento(false)}
        footer={
          <>
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => setFormEvento(false)}
              disabled={pendente}
            >
              Cancelar
            </button>

            <button
              className="btn btn-primary"
              type="button"
              onClick={salvarEventoAtual}
              disabled={pendente}
            >
              {pendente ? "Salvando..." : "Salvar"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="form-label">Ícone</label>

            <div className="meta-cor-chips">
              {EMOJIS_EVENTO.map((opcao) => (
                <button
                  key={opcao}
                  type="button"
                  className={`evento-emoji-chip${
                    opcao === emoji ? " selecionada" : ""
                  }`}
                  onClick={() => setEmoji(opcao)}
                >
                  {opcao}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="form-label">Nome</label>

            <input
              className="input"
              type="text"
              placeholder="Ex: Viagem para a praia"
              value={nome}
              onChange={(evento) => setNome(evento.target.value)}
            />
          </div>

          <div className="perfil-form-row">
            <div className="perfil-form-group">
              <label className="form-label">Início</label>

              <input
                className="input"
                type="date"
                value={dataInicio}
                onChange={(evento) => setDataInicio(evento.target.value)}
              />
            </div>

            <div className="perfil-form-group">
              <label className="form-label">
                Fim{" "}
                <span className="text-muted text-xs">— opcional</span>
              </label>

              <input
                className="input"
                type="date"
                value={dataFim}
                onChange={(evento) => setDataFim(evento.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="form-label">Descrição</label>

            <textarea
              className="input"
              rows={2}
              value={descricao}
              onChange={(evento) => setDescricao(evento.target.value)}
            />
          </div>
        </div>
      </Modal>

      <Modal
        aberto={Boolean(formParticipante)}
        titulo="Adicionar Participante"
        onFechar={() => setFormParticipante(null)}
        footer={
          <>
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => setFormParticipante(null)}
              disabled={pendente}
            >
              Cancelar
            </button>

            <button
              className="btn btn-primary"
              type="button"
              onClick={salvarParticipante}
              disabled={pendente}
            >
              {pendente ? "Salvando..." : "Adicionar"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="form-label">
              Pessoa cadastrada no app{" "}
              <span className="text-muted text-xs">
                — a cota dela entra nos gastos dela
              </span>
            </label>

            <select
              className="input"
              value={participantePessoaId}
              onChange={(evento) =>
                setParticipantePessoaId(evento.target.value)
              }
            >
              <option value="">Convidado de fora (só divide a conta)</option>

              {formParticipante
                ? pessoasDisponiveis(formParticipante).map((pessoa) => (
                    <option key={pessoa.id} value={pessoa.id}>
                      {pessoa.nome}
                      {pessoa.userId ? " (com acesso)" : ""}
                    </option>
                  ))
                : null}
            </select>
          </div>

          {participantePessoaId ? null : (
            <div>
              <label className="form-label">Nome do convidado</label>

              <input
                className="input"
                type="text"
                placeholder="Ex: Primo João"
                value={participanteNome}
                onChange={(evento) =>
                  setParticipanteNome(evento.target.value)
                }
              />
            </div>
          )}
        </div>
      </Modal>

      <Modal
        aberto={Boolean(formGasto)}
        titulo={formGasto?.gasto ? "Editar Gasto" : "Novo Gasto do Evento"}
        onFechar={() => setFormGasto(null)}
        footer={
          <>
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => setFormGasto(null)}
              disabled={pendente}
            >
              Cancelar
            </button>

            <button
              className="btn btn-primary"
              type="button"
              onClick={salvarGasto}
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
              placeholder="Ex: Hotel"
              value={gastoNome}
              onChange={(evento) => setGastoNome(evento.target.value)}
            />
          </div>

          <div>
            <label className="form-label">Valor total</label>

            <input
              className="input"
              type="number"
              min="0"
              step="0.01"
              value={gastoValor}
              onChange={(evento) => setGastoValor(evento.target.value)}
            />

            {formGasto && formGasto.evento.participantes.length > 0 ? (
              <div className="text-muted text-xs" style={{ marginTop: 6 }}>
                Dividido entre {formGasto.evento.participantes.length}{" "}
                participante(s):{" "}
                {formatarMoeda(
                  Number(gastoValor || 0) /
                    formGasto.evento.participantes.length,
                )}{" "}
                para cada um.
              </div>
            ) : null}
          </div>

          <div>
            <label className="form-label">Categoria</label>

            <select
              className="input"
              value={gastoCategoria}
              onChange={(evento) => setGastoCategoria(evento.target.value)}
            >
              {CATEGORIAS_EVENTO.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Data</label>

            <input
              className="input"
              type="date"
              value={gastoData}
              onChange={(evento) => setGastoData(evento.target.value)}
            />
          </div>

          <div>
            <label className="form-label">Observação</label>

            <textarea
              className="input"
              rows={2}
              value={gastoObservacao}
              onChange={(evento) => setGastoObservacao(evento.target.value)}
            />
          </div>
        </div>
      </Modal>

      <Modal
        aberto={Boolean(pagando)}
        titulo={`Pagamento de ${pagando?.nome ?? ""}`}
        onFechar={() => setPagando(null)}
        footer={
          <>
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => setPagando(null)}
              disabled={pendente}
            >
              Cancelar
            </button>

            <button
              className="btn btn-primary"
              type="button"
              onClick={salvarPagamento}
              disabled={pendente}
            >
              {pendente ? "Salvando..." : "Salvar"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-muted">
            Parte de {pagando?.nome} no evento:{" "}
            <strong>{formatarMoeda(pagando?.cota ?? 0)}</strong>
          </p>

          <div>
            <label className="form-label">
              Total já pago por essa pessoa (R$){" "}
              <span className="text-muted text-xs">
                — o valor acumulado, não a parcela de agora
              </span>
            </label>

            <input
              className="input"
              type="number"
              min="0"
              step="0.01"
              value={valorPago}
              onChange={(evento) => setValorPago(evento.target.value)}
              autoFocus
            />
          </div>

          {pagando && Number(valorPago) < pagando.cota ? (
            <div className="aporte-aviso">
              Falta{" "}
              <strong>
                {formatarMoeda(pagando.cota - (Number(valorPago) || 0))}
              </strong>{" "}
              para essa pessoa acertar a parte dela.
            </div>
          ) : null}

          {pagando && Number(valorPago) >= pagando.cota && pagando.cota > 0 ? (
            <div className="aporte-aviso">
              ✅ Com esse valor a parte de {pagando.nome} fica quitada.
            </div>
          ) : null}
        </div>
      </Modal>

      <ModalConfirmar
        aberto={Boolean(removendoGasto)}
        titulo="Remover Gasto"
        mensagem="Remover este gasto do evento? As cotas lançadas para a família somem junto."
        confirmarTexto="Remover"
        pendente={pendente}
        onConfirmar={() => {
          if (!removendoGasto) return;

          iniciar(async () => {
            const resultado = await removerGastoEvento(removendoGasto.id);

            mostrarToast(
              resultado.mensagem,
              resultado.ok ? "success" : "error",
            );

            if (resultado.ok) {
              setRemovendoGasto(null);
            }
          });
        }}
        onFechar={() => setRemovendoGasto(null)}
      />

      <ModalConfirmar
        aberto={Boolean(removendoEvento)}
        titulo="Remover Evento"
        mensagem={
          <>
            Remover <strong>{removendoEvento?.nome}</strong>? Todos os gastos e
            as cotas lançadas para a família serão apagados.
          </>
        }
        confirmarTexto="🗑️ Remover"
        pendente={pendente}
        onConfirmar={() => {
          if (!removendoEvento) return;

          iniciar(async () => {
            const resultado = await removerEvento(removendoEvento.id);

            mostrarToast(
              resultado.mensagem,
              resultado.ok ? "success" : "error",
            );

            if (resultado.ok) {
              setRemovendoEvento(null);
            }
          });
        }}
        onFechar={() => setRemovendoEvento(null)}
      />
    </>
  );
}
