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

/* ---------------------------------------------------------------- push ---- */

/**
 * Aviso de vencimento e recado do dia. O servidor manda título e corpo
 * prontos; aqui só resta mostrar.
 */
self.addEventListener("push", (evento) => {
  let dados = { titulo: "Fyntra", corpo: "Você tem novidades no Fyntra." };

  try {
    if (evento.data) {
      dados = { ...dados, ...evento.data.json() };
    }
  } catch (erro) {
    // Payload ilegível não deve impedir o aviso de aparecer.
  }

  evento.waitUntil(
    self.registration.showNotification(dados.titulo, {
      body: dados.corpo,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: dados.tag || "fyntra",
      data: { url: dados.url || "/dashboard" },
    }),
  );
});

/** Clicar no aviso abre o app na aba já aberta, se houver uma. */
self.addEventListener("notificationclick", (evento) => {
  evento.notification.close();

  const destino = evento.notification.data?.url || "/dashboard";

  evento.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((janelas) => {
        for (const janela of janelas) {
          if (janela.url.includes(destino) && "focus" in janela) {
            return janela.focus();
          }
        }

        return self.clients.openWindow(destino);
      }),
  );
});
