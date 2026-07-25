import nodemailer, { type Transporter } from "nodemailer";

let transporterCache: Transporter | null = null;

function obterTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    throw new Error(
      "E-mail não configurado: defina GMAIL_USER e GMAIL_APP_PASSWORD nas variáveis de ambiente.",
    );
  }

  if (!transporterCache) {
    transporterCache = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user, pass },
    });
  }

  return transporterCache;
}

export function emailConfigurado() {
  return Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

type ConviteEmail = {
  para: string;
  nomePessoa: string;
  nomeConvidador: string;
  nomeWorkspace: string;
  url: string;
  expiraEm: Date;
};

export async function enviarEmailConvite({
  para,
  nomePessoa,
  nomeConvidador,
  nomeWorkspace,
  url,
  expiraEm,
}: ConviteEmail) {
  const transporter = obterTransporter();

  const validade = expiraEm.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  await transporter.sendMail({
    from: `"Fyntra" <${process.env.GMAIL_USER}>`,
    to: para,
    subject: `${nomeConvidador} te convidou para o Fyntra`,
    text: [
      `Olá, ${nomePessoa}!`,
      "",
      `${nomeConvidador} te convidou para participar de "${nomeWorkspace}" no Fyntra,`,
      "o app de controle financeiro da família.",
      "",
      "Acesse o link para criar sua senha e entrar:",
      url,
      "",
      `Este convite expira em ${validade}.`,
    ].join("\n"),
    html: montarHtmlConvite({
      nomePessoa,
      nomeConvidador,
      nomeWorkspace,
      url,
      validade,
    }),
  });
}

function montarHtmlConvite({
  nomePessoa,
  nomeConvidador,
  nomeWorkspace,
  url,
  validade,
}: {
  nomePessoa: string;
  nomeConvidador: string;
  nomeWorkspace: string;
  url: string;
  validade: string;
}) {
  return `<!doctype html>
<html lang="pt-BR">
  <body style="margin:0;padding:32px 16px;background:#030712;font-family:Inter,Segoe UI,Arial,sans-serif;color:#f8fafc;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#0f172a;border:1px solid rgba(255,255,255,.08);border-radius:18px;overflow:hidden;">
      <tr>
        <td style="padding:32px 32px 8px;">
          <div style="display:inline-block;width:48px;height:48px;line-height:48px;text-align:center;border-radius:14px;background:linear-gradient(135deg,#10b981,#3b82f6);font-size:24px;">💰</div>
          <div style="margin-top:16px;font-size:24px;font-weight:800;">Fyn<span style="color:#10b981;">tra</span></div>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 32px 0;">
          <h1 style="margin:16px 0 8px;font-size:20px;font-weight:700;">Olá, ${escaparHtml(nomePessoa)}!</h1>
          <p style="margin:0;color:#94a3b8;font-size:15px;line-height:1.6;">
            <strong style="color:#f8fafc;">${escaparHtml(nomeConvidador)}</strong> te convidou para participar de
            <strong style="color:#f8fafc;">${escaparHtml(nomeWorkspace)}</strong> no Fyntra — o controle financeiro
            da família em um só lugar.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:24px 32px;">
          <a href="${url}" style="display:block;padding:14px 24px;background:#10b981;color:#04170f;text-decoration:none;text-align:center;font-weight:700;font-size:15px;border-radius:12px;">
            Aceitar convite
          </a>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 32px;">
          <p style="margin:0 0 12px;color:#64748b;font-size:13px;line-height:1.6;">
            Ou copie e cole este endereço no navegador:<br />
            <span style="color:#3b82f6;word-break:break-all;">${url}</span>
          </p>
          <p style="margin:0;color:#64748b;font-size:12px;">
            O convite expira em ${validade}. Se você não esperava este e-mail, pode ignorá-lo.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function escaparHtml(texto: string) {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
