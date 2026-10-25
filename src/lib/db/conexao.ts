// Conexão com o banco (Postgres na Neon). Só roda no servidor.
// A chave de acesso vem da variável de ambiente criada pela Vercel ao ligar a Neon
// (prefixo DATABASE). Ela nunca vai para o navegador nem para o GitHub.
import "server-only";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

/** Nome da variável que tem o endereço do banco (a primeira que existir). */
export function variavelDoBanco(): string | null {
  for (const nome of ["DATABASE_URL", "DATABASE_POSTGRES_URL", "POSTGRES_URL"]) {
    if (process.env[nome]) return nome;
  }
  return null;
}

/** Abre uma conexão curta, roda o que precisa e fecha. */
export async function comBanco<T>(tarefa: (pool: Pool) => Promise<T>): Promise<T> {
  const nome = variavelDoBanco();
  if (!nome) throw new Error("Endereço do banco não configurado (DATABASE_URL).");
  const pool = new Pool({ connectionString: process.env[nome], connectionTimeoutMillis: 10_000 });
  try {
    return await tarefa(pool);
  } finally {
    await pool.end();
  }
}
