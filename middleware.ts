import NextAuth from "next-auth";

import { authConfig } from "@/lib/auth.config";

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: [
    // Tudo, exceto rotas do NextAuth, assets do Next e arquivos estáticos.
    // O .js na lista é o que deixa /sw.js passar — sem ele o service worker
    // seria redirecionado para o login e o app não ficaria instalável.
    "/((?!api/auth|_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|txt|xml|json|js|webmanifest)$).*)",
  ],
};
