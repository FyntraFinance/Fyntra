"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Convida a instalar o atalho na tela de início — só no celular.
 *
 * No Android dispara o prompt nativo do Chrome. No iPhone o Safari não expõe
 * API de instalação, então mostra o passo a passo do menu Compartilhar.
 * Para de aparecer quando o app já está instalado (aberto em standalone, ou
 * depois de uma instalação confirmada) e some por uma semana em "Agora não".
 */

type EventoInstalacao = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type Plataforma = "android" | "ios" | "outro";

const CHAVE = "fyntra_atalho";
const DIAS_ADIAMENTO = 7;

function detectarPlataforma(): Plataforma {
  const ua = navigator.userAgent;

  if (/Android/i.test(ua)) {
    return "android";
  }

  // Do iOS 13 em diante o iPad se apresenta como Mac; o toque desmascara.
  const ehIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  return ehIOS ? "ios" : "outro";
}

function jaInstalado() {
  const comoApp = window.matchMedia("(display-mode: standalone)").matches;

  const standaloneIOS = (
    window.navigator as Navigator & { standalone?: boolean }
  ).standalone;

  return comoApp || standaloneIOS === true;
}

function deveEsconder() {
  const salvo = window.localStorage.getItem(CHAVE);

  if (!salvo) return false;
  if (salvo === "instalado") return true;

  const quando = Number(salvo.replace("adiado:", ""));

  if (!Number.isFinite(quando)) return false;

  return Date.now() - quando < DIAS_ADIAMENTO * 24 * 60 * 60 * 1000;
}

export function ConviteInstalar() {
  const [plataforma, setPlataforma] = useState<Plataforma>("outro");
  const [visivel, setVisivel] = useState(false);
  const [evento, setEvento] = useState<EventoInstalacao | null>(null);
  const [passosIOS, setPassosIOS] = useState(false);

  const esconder = useCallback((motivo: "instalado" | "adiado") => {
    window.localStorage.setItem(
      CHAVE,
      motivo === "instalado" ? "instalado" : `adiado:${Date.now()}`,
    );

    setVisivel(false);
  }, []);

  useEffect(() => {
    // O service worker é registrado pelo script inline do layout raiz, antes
    // de o React montar, para não perder o beforeinstallprompt.
    if (jaInstalado()) {
      window.localStorage.setItem(CHAVE, "instalado");
      return;
    }

    const detectada = detectarPlataforma();

    setPlataforma(detectada);

    if (detectada === "outro" || deveEsconder()) {
      return;
    }

    // O Chrome pode ter disparado o beforeinstallprompt antes desta montagem;
    // o script do layout guarda o evento em window para não perdê-lo.
    const guardado = (
      window as Window & { __fyntraInstalacao?: EventoInstalacao | null }
    ).__fyntraInstalacao;

    if (guardado) {
      setEvento(guardado);
    }

    function aoFicarInstalavel() {
      const atual = (
        window as Window & { __fyntraInstalacao?: EventoInstalacao | null }
      ).__fyntraInstalacao;

      if (atual) setEvento(atual);
    }

    function aoInstalar() {
      window.localStorage.setItem(CHAVE, "instalado");
      setVisivel(false);
    }

    window.addEventListener("fyntra:instalavel", aoFicarInstalavel);
    window.addEventListener("appinstalled", aoInstalar);

    // Um instante de respiro: o convite não é a primeira coisa que aparece.
    const timer = window.setTimeout(() => setVisivel(true), 2500);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("fyntra:instalavel", aoFicarInstalavel);
      window.removeEventListener("appinstalled", aoInstalar);
    };
  }, []);

  if (!visivel || plataforma === "outro") {
    return null;
  }

  async function instalar() {
    if (!evento) return;

    await evento.prompt();

    const { outcome } = await evento.userChoice;

    if (outcome === "accepted") {
      esconder("instalado");
      return;
    }

    esconder("adiado");
  }

  return (
    <div className="instalar-banner" role="dialog" aria-label="Instalar o Fyntra">
      <div className="instalar-topo">
        <div className="instalar-icone">
          <div className="instalar-icone-img" />
        </div>

        <div className="instalar-texto">
          <strong>Deixe o Fyntra na tela de início</strong>

          <span>
            {plataforma === "ios"
              ? "Abre em tela cheia, como um app — sem passar pelo navegador."
              : "Acesso rápido, em tela cheia, direto do seu celular."}
          </span>
        </div>

        <button
          className="instalar-fechar"
          type="button"
          aria-label="Fechar"
          onClick={() => esconder("adiado")}
        >
          ✕
        </button>
      </div>

      {plataforma === "android" && evento ? (
        <div className="instalar-acoes">
          <button
            className="btn btn-secondary instalar-btn"
            type="button"
            onClick={() => esconder("adiado")}
          >
            Agora não
          </button>

          <button
            className="btn btn-primary instalar-btn"
            type="button"
            onClick={instalar}
          >
            📲 Instalar
          </button>
        </div>
      ) : null}

      {plataforma === "android" && !evento ? (
        <>
          <ol className="instalar-passos">
            <li>
              Toque no menu <strong>⋮</strong> do navegador
            </li>
            <li>
              Escolha <strong>Instalar aplicativo</strong> ou{" "}
              <strong>Adicionar à tela inicial</strong>
            </li>
          </ol>

          <div className="instalar-acoes">
            <button
              className="btn btn-secondary instalar-btn"
              type="button"
              onClick={() => esconder("adiado")}
            >
              Agora não
            </button>

            <button
              className="btn btn-primary instalar-btn"
              type="button"
              onClick={() => esconder("instalado")}
            >
              Já adicionei
            </button>
          </div>
        </>
      ) : null}

      {plataforma === "ios" ? (
        <>
          {passosIOS ? (
            <ol className="instalar-passos">
              <li>
                Toque em <strong>Compartilhar</strong>{" "}
                <span className="instalar-glifo" aria-hidden="true">
                  ⎋
                </span>{" "}
                na barra do Safari
              </li>
              <li>
                Deslize e escolha{" "}
                <strong>Adicionar à Tela de Início</strong>{" "}
                <span className="instalar-glifo" aria-hidden="true">
                  ⊞
                </span>
              </li>
              <li>
                Confirme em <strong>Adicionar</strong>
              </li>
            </ol>
          ) : null}

          <div className="instalar-acoes">
            <button
              className="btn btn-secondary instalar-btn"
              type="button"
              onClick={() =>
                passosIOS ? esconder("instalado") : esconder("adiado")
              }
            >
              {passosIOS ? "Já adicionei" : "Agora não"}
            </button>

            <button
              className="btn btn-primary instalar-btn"
              type="button"
              onClick={() => setPassosIOS(true)}
              disabled={passosIOS}
            >
              {passosIOS ? "Siga os passos acima" : "📲 Como adicionar"}
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
