"use client";

import { useState, useTransition } from "react";

import { registrarAporte, removerAporte } from "@/actions/aportes";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { formatarData, formatarMesAno, formatarMoeda } from "@/lib/format";
import type { AporteMetaDTO, PessoaDTO } from "@/lib/tipos";

function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

/** Dia de hoje quando o mês em foco é o corrente; senão, dia 1 daquele mês. */
function dataPadrao(mes: string) {
  const hoje = hojeISO();

  return hoje.startsWith(mes) ? hoje : `${mes}-01`;
}

/**
 * Registra dinheiro guardado para uma meta direto do dashboard. O valor entra
 * na meta e sai da sobra do mês em foco — por isso a tela avisa o efeito antes
 * de salvar.
 */
export function GuardarNaMeta({
  metaId,
  nomeMeta,
  emojiMeta,
  mes,
  sobra,
  aportes,
  pessoas,
}: {
  metaId: string;
  nomeMeta: string;
  emojiMeta: string;
  mes: string;
  /** Sobra do mês, para avisar quando o valor guardado passa dela. */
  sobra: number;
  /** Aportes já feitos nesta meta dentro do mês em foco. */
  aportes: AporteMetaDTO[];
  pessoas: PessoaDTO[];
}) {
  const mostrarToast = useToast();
  const [pendente, iniciar] = useTransition();

  const [aberto, setAberto] = useState(false);
  const [valor, setValor] = useState("");
  const [data, setData] = useState(dataPadrao(mes));
  const [pessoaId, setPessoaId] = useState("");

  const numero = Number(valor) || 0;
  const passaDaSobra = numero > 0 && numero > sobra;

  function abrir() {
    setValor("");
    setData(dataPadrao(mes));
    setPessoaId("");
    setAberto(true);
  }

  function salvar() {
    iniciar(async () => {
      const resultado = await registrarAporte({
        metaId,
        valor,
        data,
        pessoaId: pessoaId || null,
      });

      mostrarToast(resultado.mensagem, resultado.ok ? "success" : "error");

      if (resultado.ok) {
        setAberto(false);
      }
    });
  }

  function desfazer(id: string) {
    iniciar(async () => {
      const resultado = await removerAporte(id);

      mostrarToast(resultado.mensagem, resultado.ok ? "success" : "error");
    });
  }

  return (
    <>
      <button
        className="btn btn-secondary meta-dash-guardar"
        type="button"
        onClick={abrir}
      >
        💰 Guardar
      </button>

      <Modal
        aberto={aberto}
        titulo={`Guardar em ${emojiMeta} ${nomeMeta}`}
        onFechar={() => setAberto(false)}
        footer={
          <>
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => setAberto(false)}
              disabled={pendente}
            >
              Cancelar
            </button>

            <button
              className="btn btn-primary"
              type="button"
              onClick={salvar}
              disabled={pendente || numero <= 0}
            >
              {pendente ? "Guardando..." : "Guardar"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="form-label">Quanto você guardou (R$)</label>

            <input
              className="input"
              type="number"
              min="0"
              step="0.01"
              placeholder="Ex: 500"
              value={valor}
              onChange={(evento) => setValor(evento.target.value)}
              autoFocus
            />
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

          {pessoas.length > 0 ? (
            <div>
              <label className="form-label">Quem guardou</label>

              <select
                className="input"
                value={pessoaId}
                onChange={(evento) => setPessoaId(evento.target.value)}
              >
                <option value="">A família (dividido entre todos)</option>

                {pessoas.map((pessoa) => (
                  <option key={pessoa.id} value={pessoa.id}>
                    {pessoa.nome}
                  </option>
                ))}
              </select>

              <div className="text-muted text-xs" style={{ marginTop: 6 }}>
                {pessoaId
                  ? "O valor entra só nos gastos dessa pessoa."
                  : "O valor é dividido igualmente entre as pessoas da família."}
              </div>
            </div>
          ) : null}

          <div className="aporte-aviso">
            <strong>Este valor sai do saldo de {formatarMesAno(mes)}.</strong>{" "}
            Guardar dinheiro conta como uma saída do mês, do mesmo jeito que uma
            conta paga — e entra no total da meta.
          </div>

          {passaDaSobra ? (
            <div className="aporte-aviso alerta">
              ⚠️ Sobra disponível no mês: {formatarMoeda(sobra)}. Guardando{" "}
              {formatarMoeda(numero)} o mês fecha no negativo.
            </div>
          ) : null}

          {aportes.length > 0 ? (
            <div>
              <div className="form-label">Já guardado neste mês</div>

              <div className="aporte-lista">
                {aportes.map((aporte) => (
                  <div className="aporte-item" key={aporte.id}>
                    <span>
                      {formatarData(aporte.data)}
                      {aporte.pessoaId ? (
                        <span className="texto-suave">
                          {" · "}
                          {pessoas.find((p) => p.id === aporte.pessoaId)?.nome ??
                            "—"}
                        </span>
                      ) : null}
                    </span>

                    <strong>{formatarMoeda(aporte.valor)}</strong>

                    <button
                      type="button"
                      className="btn-icon aporte-desfazer"
                      title="Desfazer este aporte"
                      disabled={pendente}
                      onClick={() => desfazer(aporte.id)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </Modal>
    </>
  );
}
