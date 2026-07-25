import type { Metadata, Viewport } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Fyntra — Controle financeiro da família",
  description:
    "Organize salários, contas fixas, contas variáveis e metas da família em um só lugar.",
  applicationName: "Fyntra",
  appleWebApp: {
    capable: true,
    title: "Fyntra",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#030712",
};

/**
 * Registra o service worker e guarda o evento de instalação.
 *
 * Roda inline por uma questão de ordem: o Chrome dispara
 * `beforeinstallprompt` assim que o service worker fica ativo, o que costuma
 * acontecer antes de o React montar. O <ConviteInstalar> depois recupera o
 * evento de `window`.
 */
const PREPARAR_INSTALACAO = `
window.__fyntraInstalacao = null;
window.addEventListener("beforeinstallprompt", function (evento) {
  evento.preventDefault();
  window.__fyntraInstalacao = evento;
  window.dispatchEvent(new Event("fyntra:instalavel"));
});
window.addEventListener("load", function () {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js").catch(function () {});
  }
});
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <script dangerouslySetInnerHTML={{ __html: PREPARAR_INSTALACAO }} />
      </head>

      <body>{children}</body>
    </html>
  );
}
