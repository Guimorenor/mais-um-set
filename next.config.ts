import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Os arquivos de migração (db/*.sql) precisam ir junto para o servidor da página de prova do banco
  outputFileTracingIncludes: {
    "/admin/prova-banco": ["./db/**/*.sql"],
  },
};

export default nextConfig;
