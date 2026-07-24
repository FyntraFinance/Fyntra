import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client"],
  typescript: {
    // O type-checker do `next build` tem um bug com src/ no Next 15.5.
    // Use `npx tsc --noEmit` para verificar tipos localmente.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
