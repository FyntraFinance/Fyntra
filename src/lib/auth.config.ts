import type { NextAuthConfig } from "next-auth";

/**
 * Configuração compartilhada entre o middleware (edge runtime) e o servidor.
 * Não pode importar Prisma nem bcrypt — só o `auth.ts` faz isso.
 */

const ROTAS_AUTH = ["/login", "/registro"];

function ehRotaPublica(pathname: string) {
  return (
    ROTAS_AUTH.includes(pathname) ||
    pathname.startsWith("/convite/") ||
    pathname.startsWith("/api/auth")
  );
}

export const authConfig = {
  trustHost: true,

  pages: {
    signIn: "/login",
  },

  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 30,
  },

  providers: [],

  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const logado = Boolean(auth?.user);
      const { pathname } = nextUrl;

      if (logado && ROTAS_AUTH.includes(pathname)) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }

      if (ehRotaPublica(pathname)) {
        return true;
      }

      return logado;
    },

    jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
      }

      return token;
    },

    session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
      }

      return session;
    },
  },
} satisfies NextAuthConfig;
