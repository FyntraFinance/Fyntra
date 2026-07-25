import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "bcryptjs", "nodemailer"],

  typescript: {
    // Bug do Next 15.5.20: o validador gerado em .next/types/validator.ts
    // aponta para "../../app/(app)/..." e ignora o diretório src/, então o
    // build falha mesmo com o projeto tipado corretamente.
    // A validação real de tipos roda em `npm run typecheck` (tsc --noEmit).
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
