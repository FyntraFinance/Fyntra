"use client";

import { useEffect, useState, useTransition } from "react";

import {
  enviarTeste,
  removerInscricao,
  salvarInscricao,
} from "@/actions/notificacoes";
import { useToast } from "@/components/ui/Toast";

/** A chave VAPID viaja em base64url e o navegador quer bytes. */
function chaveParaBytes(base64: string) {
  const preenchimento = "=".repeat((4 - (base64.length % 4)) % 4);

  const normalizada = (base64 + preenchimento)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const bruto = window.atob(normalizada);
  const bytes = new Uint8Array(bruto.length);

  for (let i = 0; i < bruto.length; i++) {
    bytes[i] = bruto.charCodeAt(i);
  }

  return bytes;
}

type Estado = "carregando" | "indisponivel" | "desligado" | "ligado" | "negado";

/**
 * Avisos de vencimento e recado do dia. A permissão é por aparelho, então o
 * estado vem do próprio navegador — não do banco.
 */
export function Notificacoes({ chavePublica }: { chavePublica: string }) {
  const mostrarToast = useToast();
  const [pendente, iniciar] = useTransition();

  const [estado, setEstado] = useState<Estado>("carregando");
  const [diasAntes, setDiasAntes] = useState(3);
  const [resumoDiario, setResumoDiario] = useState(true);

  useEffect(() => {
    async function verificar() {
      if (
        !chavePublica ||
        typeof window === "undefined" ||
        !("serviceWorker" in navigator) ||
        !("PushManager" in window)
      ) {
        setEstado("indisponivel");

        return;
      }

      if (Notification.permission === "denied") {
        setEstado("negado");

        return;
      }

      const registro = await navigator.serviceWorker.ready;
      const inscricao = await registro.pushManager.getSubscription();

      setEstado(inscricao ? "ligado" : "desligado");
    }

    verificar().catch(() => setEstado("indisponivel"));
  }, [chavePublica]);

  function ligar() {
    iniciar(async () => {
      try {
        const permissao = await Notification.requestPermission();

        if (permissao !== "granted") {
          setEstado(permissao === "denied" ? "negado" : "desligado");
          mostrarToast("Permissão de notificação recusada.", "error");

          return;
        }

        const registro = await navigator.serviceWorker.ready;

        const inscricao =
          (await registro.pushManager.getSubscription()) ??
          (await registro.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: chaveParaBytes(chavePublica),
          }));

        const dados = inscricao.toJSON();

        const resultado = await salvarInscricao({
          endpoint: inscricao.endpoint,
          p256dh: dados.keys?.p256dh ?? "",
          auth: dados.keys?.auth ?? "",
          diasAntes,
          resumoDiario,
        });

        mostrarToast(resultado.mensagem, resultado.ok ? "success" : "error");

        if (resultado.ok) setEstado("ligado");
      } catch (erro) {
        mostrarToast(
          erro instanceof Error ? erro.message : "Não foi possível ligar.",
          "error",
        );
      }
    });
  }

  function desligar() {
    iniciar(async () => {
      const registro = await navigator.serviceWorker.ready;
      const inscricao = await registro.pushManager.getSubscription();

      if (inscricao) {
        await removerInscricao(inscricao.endpoint);
        await inscricao.unsubscribe();
      }

      setEstado("desligado");
      mostrarToast("Avisos desligados neste aparelho.", "success");
    });
  }

  /** Regrava a inscrição com as preferências novas. */
  function salvarPreferencias(dias: number, resumo: boolean) {
    setDiasAntes(dias);
    setResumoDiario(resumo);

    if (estado !== "ligado") return;

    iniciar(async () => {
      const registro = await navigator.serviceWorker.ready;
      const inscricao = await registro.pushManager.getSubscription();

      if (!inscricao) return;

      const dados = inscricao.toJSON();

      await salvarInscricao({
        endpoint: inscricao.endpoint,
        p256dh: dados.keys?.p256dh ?? "",
        auth: dados.keys?.auth ?? "",
        diasAntes: dias,
        resumoDiario: resumo,
      });
    });
  }

  function testar() {
    iniciar(async () => {
      const resultado = await enviarTeste();

      mostrarToast(resultado.mensagem, resultado.ok ? "success" : "error");
    });
  }

  return (
    <div className="card perfil-card">
      <div
        className="perfil-card-icon"
        style={{ background: "rgba(59,130,246,.15)", color: "var(--texto-info)" }}
      >
        🔔
      </div>

      <div className="perfil-card-body">
        <h3 className="perfil-card-title">Avisos no Celular</h3>

        <p className="text-muted perfil-card-desc">
          Receba um aviso quando uma conta estiver perto de vencer e um recado
          diário sobre como anda o mês — se dá para gastar hoje ou se é melhor
          segurar.
        </p>

        {estado === "carregando" ? (
          <div className="perfil-token-status">
            <span className="perfil-status warn">Verificando...</span>
          </div>
        ) : null}

        {estado === "indisponivel" ? (
          <div className="aporte-aviso">
            Este navegador não aceita avisos, ou o app ainda não está
            configurado para enviá-los. No iPhone, é preciso instalar o Fyntra
            na tela de início antes.
          </div>
        ) : null}

        {estado === "negado" ? (
          <div className="aporte-aviso alerta">
            As notificações foram bloqueadas para o Fyntra neste aparelho.
            Libere nas configurações do navegador para voltar a receber.
          </div>
        ) : null}

        {estado === "ligado" || estado === "desligado" ? (
          <>
            <div className="perfil-token-status">
              {estado === "ligado" ? (
                <span className="perfil-status ok">
                  ✅ Avisos ligados neste aparelho
                </span>
              ) : (
                <span className="perfil-status warn">
                  🔕 Avisos desligados
                </span>
              )}
            </div>

            <div>
              <label className="form-label" htmlFor="dias-antes">
                Avisar quantos dias antes do vencimento
              </label>

              <select
                id="dias-antes"
                className="input"
                value={diasAntes}
                onChange={(evento) =>
                  salvarPreferencias(Number(evento.target.value), resumoDiario)
                }
              >
                <option value={0}>Só no dia do vencimento</option>
                <option value={1}>1 dia antes</option>
                <option value={3}>3 dias antes</option>
                <option value={5}>5 dias antes</option>
                <option value={7}>7 dias antes</option>
              </select>
            </div>

            <label className="ganho-recorrente">
              <input
                type="checkbox"
                checked={resumoDiario}
                onChange={(evento) =>
                  salvarPreferencias(diasAntes, evento.target.checked)
                }
              />

              <span>
                Recado do dia
                <span className="text-muted text-xs">
                  {" "}
                  — como anda o mês, mesmo sem conta vencendo
                </span>
              </span>
            </label>

            <div className="perfil-btn-row">
              {estado === "ligado" ? (
                <>
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={testar}
                    disabled={pendente}
                  >
                    Enviar teste
                  </button>

                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={desligar}
                    disabled={pendente}
                  >
                    Desligar
                  </button>
                </>
              ) : (
                <button
                  className="btn btn-primary perfil-btn"
                  type="button"
                  onClick={ligar}
                  disabled={pendente}
                >
                  {pendente ? "Ligando..." : "🔔 Ligar avisos"}
                </button>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
