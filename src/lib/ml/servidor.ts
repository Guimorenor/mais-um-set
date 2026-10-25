// Mercado Livre no servidor: guarda a conexão (tokens cifrados no banco), renova quando
// expira e lê o catálogo. Só caminhos oficiais da API; nada de raspagem.
import "server-only";
import { cifrar, decifrar } from "@/lib/cofre";
import { comBanco, variavelDoBanco } from "@/lib/db/conexao";
import { API, consultar } from "./prova";
import { escolherOferta, type DadosCatalogo, type OfertaCatalogo } from "./catalogo";

export type RespostaToken = { access_token?: string; refresh_token?: string; expires_in?: number; user_id?: number | string };

/** Guarda (ou troca) a conexão. Tokens vão cifrados. */
export async function salvarConexaoML(t: RespostaToken) {
  const acesso = t.access_token;
  if (!acesso) throw new Error("Resposta sem access_token.");
  const expira = new Date(Date.now() + Math.max(60, (t.expires_in ?? 21600) - 300) * 1000); // 5 min de folga
  await comBanco((pool) =>
    pool.query(
      `INSERT INTO ml_conexao (id, access_token_cifrado, refresh_token_cifrado, expira_em, ml_user_id)
       VALUES (1, $1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET access_token_cifrado = $1, refresh_token_cifrado = $2,
         expira_em = $3, ml_user_id = COALESCE($4, ml_conexao.ml_user_id), atualizado_em = now()`,
      [cifrar(acesso), t.refresh_token ? cifrar(t.refresh_token) : null, expira, t.user_id ? String(t.user_id) : null],
    ),
  );
}

type Linha = { access_token_cifrado: string; refresh_token_cifrado: string | null; expira_em: Date; conectado_em: Date };

async function lerConexao(): Promise<Linha | null> {
  if (!variavelDoBanco()) return null;
  return comBanco(async (pool) => {
    const existe = await pool.query("SELECT to_regclass('ml_conexao') AS t");
    if (!existe.rows[0].t) return null;
    const { rows } = await pool.query<Linha>("SELECT * FROM ml_conexao WHERE id = 1");
    return rows[0] ?? null;
  });
}

export async function estadoConexaoML() {
  const c = await lerConexao().catch(() => null);
  if (!c) return { conectado: false as const };
  return {
    conectado: true as const,
    valida: c.expira_em.getTime() > Date.now(),
    renovavel: Boolean(c.refresh_token_cifrado),
    expiraEm: c.expira_em,
    conectadoEm: c.conectado_em,
  };
}

/** Token válido para usar agora (renova sozinho se precisar e se puder). null = sem conexão. */
export async function obterTokenML(): Promise<string | null> {
  const c = await lerConexao().catch(() => null);
  if (!c) return null;
  if (c.expira_em.getTime() > Date.now()) return decifrar(c.access_token_cifrado);
  if (!c.refresh_token_cifrado) return null;
  // O refresh token é de uso único: a resposta traz um novo, que já guardamos
  const r = await fetch(`${API}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: process.env.ML_CLIENT_ID ?? "",
      client_secret: process.env.ML_CLIENT_SECRET ?? "",
      refresh_token: decifrar(c.refresh_token_cifrado),
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  }).catch(() => null);
  if (!r?.ok) return null;
  const novo = (await r.json()) as RespostaToken;
  if (!novo.access_token) return null;
  await salvarConexaoML(novo);
  return novo.access_token;
}

export type ResultadoCatalogo = { ok: true; dados: DadosCatalogo } | { ok: false; erro: string; naoEncontrado?: boolean };

/** Lê o produto de catálogo e escolhe a oferta (a do anúncio da URL, ou a de menor preço). */
export async function lerCatalogo(idCatalogo: string, idAnuncio: string | null): Promise<ResultadoCatalogo> {
  const token = (await obterTokenML().catch(() => null)) ?? undefined;
  const produto = await consultar(`/products/${idCatalogo}`, token);
  if (produto.status === 404) return { ok: false, erro: "Produto de catálogo não encontrado.", naoEncontrado: true };
  if (!produto.ok) {
    return { ok: false, erro: produto.status === 401 || produto.status === 403 ? "O Mercado Livre pediu login: conecte a conta no painel." : `Falha ao ler o catálogo (HTTP ${produto.status || "sem resposta"}).` };
  }
  const p = produto.corpo as { name?: string; status?: string; pictures?: { url?: string; secure_url?: string }[] };

  // Ofertas, página por página (no máximo 10 páginas, para não ficar em laço)
  const ofertas: OfertaCatalogo[] = [];
  let offset = 0;
  for (let pagina = 0; pagina < 10; pagina++) {
    const r = await consultar(`/products/${idCatalogo}/items?offset=${offset}`, token);
    if (!r.ok) {
      if (pagina === 0) {
        if (r.status === 404) break; // catálogo sem ofertas ativas
        return { ok: false, erro: `Falha ao ler as ofertas do catálogo (HTTP ${r.status || "sem resposta"}).` };
      }
      break;
    }
    const corpo = r.corpo as { results?: OfertaCatalogo[]; paging?: { total?: number; limit?: number } };
    const lote = corpo.results ?? [];
    ofertas.push(...lote);
    offset += lote.length;
    if (!lote.length || offset >= (corpo.paging?.total ?? 0)) break;
    if (idAnuncio && lote.some((o) => o.item_id?.toUpperCase() === idAnuncio.toUpperCase())) break;
  }

  const { oferta, criterio } = escolherOferta(ofertas, idAnuncio);
  const foto = p.pictures?.[0];
  return {
    ok: true,
    dados: {
      idCatalogo,
      nome: p.name ?? null,
      imagem: foto?.secure_url ?? foto?.url ?? null,
      statusProduto: p.status ?? null,
      totalOfertas: ofertas.length,
      oferta,
      criterio,
    },
  };
}
