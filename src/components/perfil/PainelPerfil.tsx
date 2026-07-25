"use client";

import { useRef, useState, useTransition } from "react";

import {
  importarBackup,
  limparTokenIa,
  obterBackup,
  salvarTokenIa,
  zerarDados,
} from "@/actions/configuracao";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { obterMesAtual } from "@/lib/format";

type Backup = {
  exportadoEm?: string;
  pessoas?: unknown[];
  contasFixas?: unknown[];
  contasVariaveis?: unknown[];
  metas?: unknown[];
};

export function PainelPerfil({ temTokenIa }: { temTokenIa: boolean }) {
  const mostrarToast = useToast();
  const [pendente, iniciar] = useTransition();

  const inputArquivo = useRef<HTMLInputElement>(null);

  const [token, setToken] = useState("");
  const [tokenVisivel, setTokenVisivel] = useState(false);
  const [confirmandoLimparToken, setConfirmandoLimparToken] = useState(false);
  const [confirmandoZerar, setConfirmandoZerar] = useState(false);
  const [arrastando, setArrastando] = useState(false);
  const [backup, setBackup] = useState<Backup | null>(null);

  function exportar() {
    iniciar(async () => {
      const dados = await obterBackup();

      const blob = new Blob([JSON.stringify(dados, null, 2)], {
        type: "application/json",
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `fyntra_${obterMesAtual()}.json`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);

      mostrarToast("Backup exportado com sucesso!", "success");
    });
  }

  function lerArquivo(arquivo: File) {
    if (!arquivo.name.endsWith(".json")) {
      mostrarToast("Selecione um arquivo .json válido.", "error");
      return;
    }

    const leitor = new FileReader();

    leitor.onload = () => {
      try {
        setBackup(JSON.parse(String(leitor.result)));
      } catch {
        mostrarToast("Arquivo inválido ou corrompido.", "error");
      }
    };

    leitor.readAsText(arquivo);
  }

  function confirmarImportacao() {
    if (!backup) return;

    iniciar(async () => {
      const resultado = await importarBackup(backup);

      mostrarToast(resultado.mensagem, resultado.ok ? "success" : "error");

      if (resultado.ok) {
        setBackup(null);
      }
    });
  }

  function salvarToken() {
    iniciar(async () => {
      const resultado = await salvarTokenIa(token);

      mostrarToast(resultado.mensagem, resultado.ok ? "success" : "error");

      if (resultado.ok) {
        setToken("");
      }
    });
  }

  function confirmarLimparToken() {
    iniciar(async () => {
      const resultado = await limparTokenIa();

      mostrarToast(resultado.mensagem, resultado.ok ? "success" : "error");
      setConfirmandoLimparToken(false);
    });
  }

  function confirmarZerar() {
    iniciar(async () => {
      const resultado = await zerarDados();

      mostrarToast(resultado.mensagem, resultado.ok ? "success" : "error");
      setConfirmandoZerar(false);
    });
  }

  const resumoImportacao = [
    backup?.pessoas?.length ? `👥 ${backup.pessoas.length} pessoa(s)` : null,
    backup?.contasFixas?.length
      ? `🏠 ${backup.contasFixas.length} conta(s) fixa(s)`
      : null,
    backup?.contasVariaveis?.length
      ? `💳 ${backup.contasVariaveis.length} conta(s) variável(is)`
      : null,
    backup?.metas?.length ? `🎯 ${backup.metas.length} meta(s)` : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <>
      <div className="perfil-grid">
        <div className="card perfil-card">
          <div
            className="perfil-card-icon"
            style={{
              background: "rgba(16,185,129,.15)",
              color: "var(--accent)",
            }}
          >
            📤
          </div>

          <div className="perfil-card-body">
            <h3 className="perfil-card-title">Exportar Dados</h3>

            <p className="text-muted perfil-card-desc">
              Baixe um arquivo JSON com todas as suas pessoas, contas fixas,
              contas variáveis e metas.
            </p>

            <div className="perfil-info-box">
              <span className="perfil-info-label">Inclui:</span>

              <span className="perfil-info-tags">
                <span className="tag">👥 Pessoas</span>
                <span className="tag">🏠 Contas Fixas</span>
                <span className="tag">💳 Contas Variáveis</span>
                <span className="tag">🎯 Metas</span>
              </span>
            </div>

            <button
              className="btn btn-primary perfil-btn"
              type="button"
              onClick={exportar}
              disabled={pendente}
            >
              📥 Exportar Backup
            </button>
          </div>
        </div>

        <div className="card perfil-card">
          <div
            className="perfil-card-icon"
            style={{ background: "rgba(59,130,246,.15)", color: "var(--blue)" }}
          >
            📂
          </div>

          <div className="perfil-card-body">
            <h3 className="perfil-card-title">Importar Dados</h3>

            <p className="text-muted perfil-card-desc">
              Restaure um backup exportado anteriormente. Os dados atuais serão
              substituídos.
            </p>

            <div
              className={`perfil-drop-zone${arrastando ? " drag-over" : ""}`}
              onClick={() => inputArquivo.current?.click()}
              onDragOver={(evento) => {
                evento.preventDefault();
                setArrastando(true);
              }}
              onDragLeave={() => setArrastando(false)}
              onDrop={(evento) => {
                evento.preventDefault();
                setArrastando(false);

                const arquivo = evento.dataTransfer.files[0];

                if (arquivo) {
                  lerArquivo(arquivo);
                }
              }}
            >
              <span className="perfil-drop-icon">📁</span>

              <span className="perfil-drop-text">
                Clique ou arraste o arquivo JSON aqui
              </span>
            </div>

            <input
              ref={inputArquivo}
              type="file"
              accept=".json,application/json"
              style={{ display: "none" }}
              onChange={(evento) => {
                const arquivo = evento.target.files?.[0];

                if (arquivo) {
                  lerArquivo(arquivo);
                }

                evento.target.value = "";
              }}
            />

            <button
              className="btn btn-secondary perfil-btn"
              type="button"
              style={{ borderColor: "var(--blue)", color: "var(--blue)" }}
              onClick={() => inputArquivo.current?.click()}
            >
              📂 Selecionar Arquivo
            </button>
          </div>
        </div>

        <div className="card perfil-card perfil-card-danger">
          <div
            className="perfil-card-icon"
            style={{
              background: "rgba(239,68,68,.15)",
              color: "var(--danger)",
            }}
          >
            🗑️
          </div>

          <div className="perfil-card-body">
            <h3 className="perfil-card-title">Zerar Todos os Dados</h3>

            <p className="text-muted perfil-card-desc">
              Remove permanentemente todas as pessoas, contas fixas, contas
              variáveis e metas deste workspace. Esta ação não pode ser
              desfeita.
            </p>

            <div className="perfil-danger-aviso">
              ⚠️ Recomendamos exportar um backup antes de continuar.
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

        <div className="card perfil-card">
          <div
            className="perfil-card-icon"
            style={{
              background: "rgba(139,92,246,.15)",
              color: "var(--purple)",
            }}
          >
            🤖
          </div>

          <div className="perfil-card-body">
            <h3 className="perfil-card-title">Token da Poe IA</h3>

            <p className="text-muted perfil-card-desc">
              Configure seu token de acesso à API da Poe para usar o Assistente
              IA financeiro. O token fica guardado no servidor, não no
              navegador.
            </p>

            <div className="perfil-token-status">
              {temTokenIa ? (
                <span className="perfil-status ok">✅ Token configurado</span>
              ) : (
                <span className="perfil-status warn">
                  ⚠️ Token não configurado
                </span>
              )}
            </div>

            <div className="perfil-input-group">
              <input
                className="input"
                type={tokenVisivel ? "text" : "password"}
                autoComplete="off"
                placeholder={
                  temTokenIa
                    ? "Token já configurado — cole um novo para substituir"
                    : "Cole seu token da Poe aqui"
                }
                value={token}
                onChange={(evento) => setToken(evento.target.value)}
              />

              <button
                className="perfil-toggle-visibility"
                type="button"
                title="Mostrar/ocultar token"
                onClick={() => setTokenVisivel((visivel) => !visivel)}
              >
                👁
              </button>
            </div>

            <div className="perfil-btn-row">
              <button
                className="btn btn-primary perfil-btn-flex"
                type="button"
                style={{
                  background: "var(--purple)",
                  borderColor: "var(--purple)",
                }}
                onClick={salvarToken}
                disabled={pendente}
              >
                💾 Salvar Token
              </button>

              {temTokenIa ? (
                <button
                  className="btn btn-secondary perfil-btn-flex"
                  type="button"
                  style={{
                    borderColor: "var(--danger)",
                    color: "var(--danger)",
                  }}
                  onClick={() => setConfirmandoLimparToken(true)}
                >
                  🗑 Limpar
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <Modal
        aberto={Boolean(backup)}
        titulo="Confirmar Importação"
        onFechar={() => setBackup(null)}
        footer={
          <>
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => setBackup(null)}
              disabled={pendente}
            >
              Cancelar
            </button>

            <button
              className="btn btn-primary"
              type="button"
              onClick={confirmarImportacao}
              disabled={pendente}
            >
              {pendente ? "Importando..." : "✅ Importar"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-muted">
            Os dados atuais serão{" "}
            <strong style={{ color: "var(--danger)" }}>substituídos</strong>.
            Deseja continuar?
          </p>

          <div className="perfil-import-resumo">
            <span className="perfil-import-label">Será importado:</span>
            <span>{resumoImportacao || "Sem dados detectados"}</span>
          </div>

          {backup?.exportadoEm ? (
            <p className="text-muted" style={{ fontSize: 13 }}>
              Exportado em:{" "}
              {new Date(backup.exportadoEm).toLocaleString("pt-BR")}
            </p>
          ) : null}
        </div>
      </Modal>

      <Modal
        aberto={confirmandoLimparToken}
        titulo="Limpar Token"
        onFechar={() => setConfirmandoLimparToken(false)}
        footer={
          <>
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => setConfirmandoLimparToken(false)}
              disabled={pendente}
            >
              Cancelar
            </button>

            <button
              className="btn btn-danger"
              type="button"
              onClick={confirmarLimparToken}
              disabled={pendente}
            >
              Remover
            </button>
          </>
        }
      >
        <p className="text-muted">
          Tem certeza que deseja remover o token da Poe? O Assistente IA não
          funcionará sem ele.
        </p>
      </Modal>

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
          <p className="text-muted">
            Você está prestes a apagar{" "}
            <strong style={{ color: "var(--danger)" }}>todos os dados</strong>{" "}
            deste workspace:
          </p>

          <div className="perfil-import-resumo">
            <span>👥 Todas as pessoas</span>
            <span>🏠 Todas as contas fixas</span>
            <span>💳 Todas as contas variáveis</span>
            <span>🎯 Todas as metas</span>
            <span>🤖 Token da Poe</span>
          </div>

          <p className="text-muted" style={{ fontSize: 13 }}>
            Esta ação é <strong>irreversível</strong>. Os acessos das pessoas ao
            workspace são mantidos.
          </p>
        </div>
      </Modal>
    </>
  );
}
