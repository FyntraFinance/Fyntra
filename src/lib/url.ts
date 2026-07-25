/**
 * Base pública do app, usada nos links enviados por e-mail.
 * Em produção a Vercel expõe o domínio em VERCEL_PROJECT_PRODUCTION_URL.
 */
export function obterBaseUrl() {
  const configurada = process.env.NEXT_PUBLIC_APP_URL;

  if (configurada && !configurada.includes("localhost")) {
    return configurada.replace(/\/$/, "");
  }

  const producao = process.env.VERCEL_PROJECT_PRODUCTION_URL;

  if (producao) {
    return `https://${producao}`;
  }

  const preview = process.env.VERCEL_URL;

  if (preview) {
    return `https://${preview}`;
  }

  return configurada?.replace(/\/$/, "") ?? "http://localhost:3000";
}
