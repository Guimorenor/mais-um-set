// Interruptores das automações (tabela "automacoes"). Só no servidor.
import "server-only";
import { comBanco } from "@/lib/db/conexao";

export type NomeAutomacao =
  | "recorte"
  | "destaque_automatico"
  | "recorte_aprovacao_automatica"
  | "garimpo"
  | "conferencia"
  | "publicacao_automatica"
  | "link_por_etiqueta";
export type Automacao = { nome: NomeAutomacao; ativa: boolean; ultimaExecucao: Date | null; ultimoResultado: string | null };

export async function lerAutomacoes(): Promise<Automacao[]> {
  return comBanco(async (pool) => {
    const existe = await pool.query("SELECT to_regclass('automacoes') AS t");
    if (!existe.rows[0].t) return [];
    const { rows } = await pool.query("SELECT nome, ativa, ultima_execucao, ultimo_resultado FROM automacoes ORDER BY nome");
    return rows.map((r) => ({ nome: r.nome, ativa: r.ativa, ultimaExecucao: r.ultima_execucao, ultimoResultado: r.ultimo_resultado }));
  });
}

export async function ligarAutomacao(nome: NomeAutomacao, ativa: boolean) {
  await comBanco((pool) => pool.query("UPDATE automacoes SET ativa = $1, atualizado_em = now() WHERE nome = $2", [ativa, nome]));
}
