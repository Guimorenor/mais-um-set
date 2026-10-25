import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pacotes do banco rodam como estão, sem o Next reempacotar (evita quebrar o WebSocket)
  serverExternalPackages: ["ws", "@neondatabase/serverless"],
  // Os arquivos de migração (db/*.sql) precisam ir junto para o servidor da página de prova do banco
  outputFileTracingIncludes: {
    "/admin/prova-banco": ["./db/**/*.sql"],
    "/admin/(protegido)/prova-banco": ["./db/**/*.sql"],
  },
};

export default nextConfig;
