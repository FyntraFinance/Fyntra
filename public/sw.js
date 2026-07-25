/**
 * Service worker mínimo do Fyntra.
 *
 * Existe por dois motivos: o Chrome só oferece o prompt de instalação a sites
 * que registram um service worker com handler de fetch, e é ele que dá ao
 * atalho a aparência de app (sem barra de endereço).
 *
 * Não faz cache: os dados são sempre do servidor e cachear HTML de rotas
 * autenticadas correria o risco de mostrar dados de outra sessão.
 */

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // Repassa tudo para a rede — o handler existe para tornar o app instalável.
});
