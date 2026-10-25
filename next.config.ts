import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pacotes do banco rodam como estão, sem o Next reempacotar (evita quebrar o WebSocket)
  serverExternalPackages: ["ws", "@neondatabase/serverless"],
  // Os arquivos de migração (db/*.sql) precisam ir junto para o servidor das páginas do painel
  outputFileTracingIncludes: {
    "/admin/**/*": ["./db/**/*.sql"],
  },
};

export default nextConfig;
