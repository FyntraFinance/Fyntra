import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

import "./globals.css";

/**
 * A folha de estilo sempre pediu Inter, mas a fonte nunca era baixada: o app
 * caía na sans-serif padrão do navegador. Servida pelo next/font ela vem do
 * mesmo domínio, sem requisição externa e sem troca de fonte na tela.
 */
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--fonte",
});

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
/**
 * Aplica o tema escolhido antes da primeira pintura. Se rodasse depois da
 * hidratação, a tela piscaria no tema errado a cada carregamento.
 */
const APLICAR_TEMA = `
try {
  var tema = localStorage.getItem("fyntra_tema");
  if (tema === "claro" || tema === "escuro") {
    document.documentElement.setAttribute("data-tema", tema);
  }
} catch (e) {}
`;

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
    <html lang="pt-BR" className={inter.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: APLICAR_TEMA }} />
        <script dangerouslySetInnerHTML={{ __html: PREPARAR_INSTALACAO }} />
      </head>

      <body>{children}</body>
    </html>
  );
}
