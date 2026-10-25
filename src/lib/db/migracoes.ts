// Migrações: os arquivos db/NNN_nome.sql, aplicados em ordem, uma vez cada.
// A tabela "migracoes" anota quais já rodaram (como um carimbo de "feito").
import "server-only";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { Pool } from "@neondatabase/serverless";

const PASTA = path.join(process.cwd(), "db");

export type Migracao = { nome: string; aplicadaEm: Date | null };

async function arquivos() {
  return (await readdir(PASTA)).filter((a) => /^\d{3}_.+\.sql$/.test(a)).sort();
}

async function garantirTabela(pool: Pool) {
  await pool.query(`CREATE TABLE IF NOT EXISTS migracoes (
    nome text PRIMARY KEY,
    aplicada_em timestamptz NOT NULL DEFAULT now()
  )`);
}

export async function listarMigracoes(pool: Pool): Promise<Migracao[]> {
  await garantirTabela(pool);
  const { rows } = await pool.query<{ nome: string; aplicada_em: Date }>("SELECT nome, aplicada_em FROM migracoes");
  const feitas = new Map(rows.map((r) => [r.nome, r.aplicada_em]));
  return (await arquivos()).map((nome) => ({ nome, aplicadaEm: feitas.get(nome) ?? null }));
}

/** Aplica as pendentes, cada uma dentro de uma transação (ou vai tudo, ou nada daquela migração). */
export async function aplicarPendentes(pool: Pool): Promise<string[]> {
  const pendentes = (await listarMigracoes(pool)).filter((m) => !m.aplicadaEm);
  const aplicadas: string[] = [];
  for (const m of pendentes) {
    const sql = await readFile(path.join(PASTA, m.nome), "utf8");
    const cliente = await pool.connect();
    try {
      await cliente.query("BEGIN");
      await cliente.query(sql);
      await cliente.query("INSERT INTO migracoes (nome) VALUES ($1)", [m.nome]);
      await cliente.query("COMMIT");
      aplicadas.push(m.nome);
    } catch (e) {
      await cliente.query("ROLLBACK");
      throw new Error(`Falhou em ${m.nome}: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      cliente.release();
    }
  }
  return aplicadas;
}
