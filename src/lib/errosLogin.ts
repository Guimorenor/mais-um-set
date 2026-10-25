// Guarda os últimos erros do login no banco, para a tela "Entrar" mostrar o motivo.
// Nunca guarda chaves: só o tipo do erro e a mensagem (com endereços e códigos apagados).
import { comBanco, variavelDoBanco } from "@/lib/db/conexao";

const limpar = (t: string) =>
  t
    .replace(/postgres(ql)?:\/\/\S+/gi, "[endereço oculto]")
    .replace(/(code|client_secret|secret|token)=[^&\s"]+/gi, "$1=[oculto]")
    .slice(0, 400);

export async function gravarErroLogin(erro: Error) {
  if (!variavelDoBanco()) return;
  const causa = erro.cause instanceof Error ? ` · causa: ${erro.cause.name}: ${erro.cause.message}` : "";
  const texto = limpar(`${erro.name}: ${erro.message}${causa}`);
  try {
    await comBanco(async (pool) => {
      await pool.query(`CREATE TABLE IF NOT EXISTS erros_login (quando timestamptz NOT NULL DEFAULT now(), texto text NOT NULL)`);
      await pool.query("INSERT INTO erros_login (texto) VALUES ($1)", [texto]);
      await pool.query("DELETE FROM erros_login WHERE quando < now() - interval '1 day'");
    });
  } catch {
    // diagnóstico é extra: se falhar, não atrapalha nada
  }
}

export async function ultimosErrosLogin(): Promise<{ quando: Date; texto: string }[]> {
  if (!variavelDoBanco()) return [];
  try {
    return await comBanco(async (pool) => {
      const existe = await pool.query("SELECT to_regclass('erros_login') AS t");
      if (!existe.rows[0].t) return [];
      const { rows } = await pool.query<{ quando: Date; texto: string }>(
        "SELECT quando, texto FROM erros_login ORDER BY quando DESC LIMIT 3",
      );
      return rows;
    });
  } catch {
    return [];
  }
}
