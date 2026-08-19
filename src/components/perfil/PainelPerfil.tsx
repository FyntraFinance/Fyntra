"use client";

import { useState, useTransition } from "react";

import {
  definirCompartilhamentoContadora,
  zerarDados,
} from "@/actions/configuracao";
import { gerarRelatorioMensal } from "@/actions/relatorio";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { formatarMesAno } from "@/lib/format";

export function PainelPerfil({
  mes,
  compartilharComContadora,
  podeAlterarCompartilhamento,
}: {
  /** Mês em foco, usado como sugestão inicial do relatório. */
  mes: string;
  compartilharComContadora: boolean;
  /** Só o dono/administrador da família decide o compartilhamento por todos. */
  podeAlterarCompartilhamento: boolean;
}) {
  const mostrarToast = useToast();
  const [pendente, iniciar] = useTransition();

  const [compartilhando, setCompartilhando] = useState(compartilharComContadora);
  const [mesRelatorio, setMesRelatorio] = useState(mes);
  const [confirmandoZerar, setConfirmandoZerar] = useState(false);

  /**
   * A Server Action devolve o arquivo em base64: aqui ele vira um blob e um
   * clique programático no link, que é o que dispara o download no navegador.
   */
  function baixarRelatorio() {
    iniciar(async () => {
      const resultado = await gerarRelatorioMensal(mesRelatorio);

      if (!resultado.ok || !resultado.arquivo) {
        mostrarToast(resultado.mensagem, "error");

        return;
      }

      const binario = atob(resultado.arquivo);
      const bytes = new Uint8Array(binario.length);

      for (let i = 0; i < binario.length; i++) {
        bytes[i] = binario.charCodeAt(i);
      }

      const blob = new Blob([bytes], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = resultado.nomeArquivo ?? "relatorio.xlsx";
      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);

      mostrarToast(resultado.mensagem, "success");
    });
  }

  function alternarCompartilhamento(valor: boolean) {
    setCompartilhando(valor);

    iniciar(async () => {
      const resultado = await definirCompartilhamentoContadora(valor);

      if (!resultado.ok) {
        setCompartilhando(!valor);
      }

      mostrarToast(resultado.mensagem, resultado.ok ? "success" : "error");
    });
  }

  function confirmarZerar() {
    iniciar(async () => {
      const resultado = await zerarDados();

      mostrarToast(resultado.mensagem, resultado.ok ? "success" : "error");

      if (resultado.ok) {
        setConfirmandoZerar(false);
      }
    });
  }

  return (
    <>
      <div className="perfil-grid">
        <div className="card perfil-card perfil-card-destaque">
          <div
            className="perfil-card-icon"
            style={{
              background: "rgba(16,185,129,.15)",
              color: "var(--texto-marca)",
            }}
          >
            📊
          </div>

          <div className="perfil-card-body">
            <h3 className="perfil-card-title">Relatório do Mês</h3>

            <p className="text-muted perfil-card-desc">
              Baixe uma planilha do Excel com o resumo do mês e um gráfico dos
              gastos por categoria. Contas fixas, contas variáveis, ganhos
              extras e o que foi guardado em metas vêm cada um em sua aba.
            </p>

            <label className="form-label" htmlFor="mes-relatorio">
              Mês do relatório
            </label>

            <input
              id="mes-relatorio"
              className="input"
              type="month"
              value={mesRelatorio}
              onChange={(evento) => setMesRelatorio(evento.target.value)}
            />

            <button
              className="btn btn-primary perfil-btn"
              type="button"
              onClick={baixarRelatorio}
              disabled={pendente || !mesRelatorio}
            >
              {pendente
                ? "Gerando..."
                : `⬇️ Baixar ${formatarMesAno(mesRelatorio)}`}
            </button>
          </div>
        </div>

        <div className="card perfil-card">
          <div
            className="perfil-card-icon"
            style={{ background: "rgba(6,182,212,.15)", color: "var(--texto-ciano)" }}
          >
            🧮
          </div>

          <div className="perfil-card-body">
            <h3 className="perfil-card-title">
              Compartilhar com a Contabilidade
            </h3>

            <p className="text-muted perfil-card-desc">
              Quando ativado, a contabilidade que acompanha as famílias pode ver
              o relatório financeiro desta família — salários, contas, metas e
              quem tem acesso. Desativado, nada disso aparece para ela.
            </p>

            <label className="perfil-switch-row">
              <input
                className="perfil-switch-input"
                type="checkbox"
                checked={compartilhando}
                disabled={pendente || !podeAlterarCompartilhamento}
                onChange={(evento) =>
                  alternarCompartilhamento(evento.target.checked)
                }
              />

              <span className="perfil-switch" aria-hidden="true" />

              <span className="perfil-switch-label">
                Autorizo o compartilhamento dos meus dados financeiros
              </span>
            </label>

            <div className="perfil-token-status">
              {compartilhando ? (
                <span className="perfil-status ok">
                  ✅ Compartilhando com a contabilidade
                </span>
              ) : (
                <span className="perfil-status warn">
                  🔒 Dados privados — a contabilidade não vê nada
                </span>
              )}
            </div>

            {podeAlterarCompartilhamento ? null : (
              <p className="text-muted" style={{ fontSize: 12 }}>
                Apenas o dono ou um administrador da família pode alterar esta
                opção.
              </p>
            )}
          </div>
        </div>

        <div className="card perfil-card perfil-card-danger">
          <div
            className="perfil-card-icon"
            style={{
              background: "rgba(239,68,68,.15)",
              color: "var(--texto-negativo)",
            }}
          >
            🗑️
          </div>

          <div className="perfil-card-body">
            <h3 className="perfil-card-title">Zerar Todos os Dados</h3>

            <p className="text-muted perfil-card-desc">
              Remove permanentemente todas as pessoas, contas fixas, contas
              variáveis e metas desta família. Esta ação não pode ser desfeita.
            </p>

            <div className="perfil-danger-aviso">
              ⚠️ Baixe o relatório do mês antes, se quiser guardar um registro
              do que existe hoje.
            </div>

            <button
              className="btn perfil-btn perfil-btn-danger"
              type="button"
              onClick={() => setConfirmandoZerar(true)}
            >
              🗑️ Zerar Tudo
            </button>
          </div>
        </div>
      </div>

      <Modal
        aberto={confirmandoZerar}
        titulo="⚠️ Zerar Todos os Dados"
        onFechar={() => setConfirmandoZerar(false)}
        footer={
          <>
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => setConfirmandoZerar(false)}
              disabled={pendente}
            >
              Cancelar
            </button>

            <button
              className="btn btn-danger"
              type="button"
              onClick={confirmarZerar}
              disabled={pendente}
            >
              {pendente ? "Apagando..." : "🗑️ Zerar Tudo"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="texto-secundario">
            Você está prestes a apagar{" "}
            <strong className="valor-negativo">todos os dados</strong> desta
            família:
          </p>

          <div className="perfil-import-resumo">
            <span>👥 Todas as pessoas</span>
            <span>🏠 Todas as contas fixas</span>
            <span>💳 Todas as contas variáveis</span>
            <span>💵 Todos os ganhos extras</span>
            <span>🧳 Todos os eventos</span>
            <span>🎯 Todas as metas</span>
          </div>

          <p className="text-muted" style={{ fontSize: 13 }}>
            Esta ação é <strong>irreversível</strong>. Os acessos das pessoas à
            família são mantidos.
          </p>
        </div>
      </Modal>
    </>
  );
}
