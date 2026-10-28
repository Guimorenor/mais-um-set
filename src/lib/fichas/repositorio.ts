// Fichas no banco: ler, criar, editar e mudar de estado.
// Toda mudança de estado passa pelo regulamento (regras.ts) e vira uma linha no diário.
import "server-only";
import type { Pool } from "@neondatabase/serverless";
import { revalidateTag } from "next/cache";
import { comBanco } from "@/lib/db/conexao";
import type { CategoriaSlug } from "@/lib/categorias";
import { mudancas, podeMudarEstado, type Autor, type Destaque, type Estado, type Ficha, type Resultado } from "./regras";
import { podePublicarSozinho, type ConfigGarimpo } from "@/lib/garimpo/regras";

type Linha = Record<string, unknown>;
// Avisa o site que a vitrine mudou (os cards se atualizam na hora, sem esperar 60 s)
const atualizarVitrine = () => revalidateTag("vitrine");

const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));

function paraFicha(r: Linha): Ficha {
  return {
    id: r.id as string,
    loja: "mercado-livre",
    idProdutoLoja: r.id_produto_loja as string,
    urlOriginal: r.url_original as string,
    idCatalogo: (r.id_catalogo as string) ?? null,
    linkAfiliado: (r.link_afiliado as string) ?? null,
    tituloLoja: (r.titulo_loja as string) ?? null,
    tituloCurto: (r.titulo_curto as string) ?? null,
    imagem: (r.imagem as string) ?? null,
    vendedor: (r.vendedor as string) ?? null,
    categoria: (r.categoria as CategoriaSlug) ?? null,
    observacao: (r.observacao as string) ?? null,
    precoAtual: num(r.preco_atual),
    precoAnterior: num(r.preco_anterior),
    moeda: (r.moeda as string) ?? null,
    statusNaLoja: (r.status_na_loja as string) ?? null,
    quantidadeAproximada: num(r.quantidade_aproximada),
    verificadoEm: (r.verificado_em as Date) ?? null,
    fonte: (r.fonte as string) ?? null,
    estado: r.estado as Estado,
    motivo: (r.motivo as string) ?? null,
    destaque: r.destaque as Destaque,
    criadoEm: r.criado_em as Date,
    atualizadoEm: r.atualizado_em as Date,
    publicadoEm: (r.publicado_em as Date) ?? null,
    recorteStatus: (r.recorte_status as Ficha["recorteStatus"]) ?? null,
    recorteErro: (r.recorte_erro as string) ?? null,
    usarRecorte: Boolean(r.usar_recorte),
    origem: (r.origem as Ficha["origem"]) ?? "manual",
    alteradoPor: (r.alterado_por as Autor) ?? null,
    imagemTipo: (r.imagem_tipo as Ficha["imagemTipo"]) ?? null,
    imagemAjuste: (r.imagem_ajuste as Ficha["imagemAjuste"]) ?? undefined,
  };
}

export type Verificacao = {
  quando: Date;
  autor: Autor;
  resultado: "ok" | "mudou" | "erro" | "estado";
  mudancas: string[];
  erro: string | null;
  estadoDe: Estado | null;
  estadoPara: Estado | null;
};

export async function listarFichas(): Promise<Ficha[]> {
  return comBanco(async (pool) => (await pool.query("SELECT * FROM fichas ORDER BY atualizado_em DESC LIMIT 500")).rows.map(paraFicha));
}

export async function buscarFicha(id: string): Promise<{ ficha: Ficha; diario: Verificacao[] } | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  return comBanco(async (pool) => {
    const f = await pool.query("SELECT * FROM fichas WHERE id = $1", [id]);
    if (!f.rows[0]) return null;
    const d = await pool.query(
      "SELECT quando, autor, resultado, mudancas, erro, estado_de, estado_para FROM verificacoes WHERE ficha_id = $1 ORDER BY quando DESC LIMIT 50",
      [id],
    );
    return {
      ficha: paraFicha(f.rows[0]),
      diario: d.rows.map((r) => ({
        quando: r.quando, autor: r.autor, resultado: r.resultado, mudancas: r.mudancas ?? [],
        erro: r.erro, estadoDe: r.estado_de, estadoPara: r.estado_para,
      })),
    };
  });
}

export async function buscarPorProduto(idProdutoLoja: string): Promise<Ficha | null> {
  return comBanco(async (pool) => {
    const { rows } = await pool.query("SELECT * FROM fichas WHERE loja = 'mercado-livre' AND id_produto_loja = $1", [idProdutoLoja]);
    return rows[0] ? paraFicha(rows[0]) : null;
  });
}

export type NovaFicha = {
  idProdutoLoja: string;
  urlOriginal: string;
  idCatalogo: string | null;
  linkAfiliado: string | null;
  tituloLoja: string | null;
  tituloCurto: string | null;
  imagem: string | null;
  vendedor: string | null;
  categoria: CategoriaSlug | null;
  observacao: string | null;
  precoAtual: number | null;
  precoAnterior: number | null;
  moeda: string | null;
  statusNaLoja: string | null;
  verificadoEm: Date | null;
  fonte: string | null;
  origem?: "manual" | "garimpo";
};

/** Cria em "rascunho". Se o produto já existe, devolve o id do existente (nunca duplica). */
export async function criarFicha(n: NovaFicha): Promise<{ id: string; jaExistia: boolean }> {
  return comBanco(async (pool) => {
    const { rows } = await pool.query(
      `INSERT INTO fichas (id_produto_loja, url_original, id_catalogo, link_afiliado, titulo_loja, titulo_curto, imagem,
         vendedor, categoria, observacao, preco_atual, preco_anterior, moeda, status_na_loja, verificado_em, fonte, origem)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       ON CONFLICT (loja, id_produto_loja) DO NOTHING
       RETURNING id`,
      [n.idProdutoLoja, n.urlOriginal, n.idCatalogo, n.linkAfiliado, n.tituloLoja, n.tituloCurto, n.imagem, n.vendedor,
        n.categoria, n.observacao, n.precoAtual, n.precoAnterior, n.moeda, n.statusNaLoja, n.verificadoEm, n.fonte, n.origem ?? "manual"],
    );
    if (rows[0]) {
      await diario(pool, rows[0].id, n.origem === "garimpo" ? "automacao" : "moreno", "estado", n.origem === "garimpo" ? ["achada pelo garimpo"] : [], null, null, "rascunho");
      return { id: rows[0].id as string, jaExistia: false };
    }
    const existente = await pool.query("SELECT id FROM fichas WHERE loja = 'mercado-livre' AND id_produto_loja = $1", [n.idProdutoLoja]);
    return { id: existente.rows[0].id as string, jaExistia: true };
  });
}

/** Campos que você pode editar à mão no painel. */
export type Edicao = Partial<
  Pick<Ficha, "linkAfiliado" | "tituloCurto" | "categoria" | "observacao" | "destaque" | "tituloLoja" | "imagem" | "precoAtual" | "precoAnterior" | "imagemAjuste">
> & { verificadoAgora?: boolean };

const COLUNAS: Record<string, string> = {
  linkAfiliado: "link_afiliado", tituloCurto: "titulo_curto", categoria: "categoria", observacao: "observacao",
  destaque: "destaque", tituloLoja: "titulo_loja", imagem: "imagem", precoAtual: "preco_atual", precoAnterior: "preco_anterior",
  imagemAjuste: "imagem_ajuste",
};

export async function editarFicha(id: string, e: Edicao) {
  await comBanco(async (pool) => {
    const sets: string[] = [];
    const vals: unknown[] = [];
    for (const [campo, coluna] of Object.entries(COLUNAS)) {
      if (campo in e) {
        vals.push((e as Record<string, unknown>)[campo]);
        sets.push(`${coluna} = $${vals.length}`);
      }
    }
    if (e.verificadoAgora) sets.push("verificado_em = now()", "fonte = 'Conferido à mão no painel'", "moeda = 'BRL'");
    if (!sets.length) return;
    vals.push(id);
    // Foto trocada: o recorte antigo deixa de valer (o estagiário recorta a nova se for o achado)
    if ("imagem" in e) {
      await pool.query(
        "UPDATE fichas SET recorte_status = NULL, usar_recorte = false WHERE id = $1 AND imagem IS DISTINCT FROM $2",
        [id, e.imagem ?? null],
      );
    }
    // Só pode haver UM "achado da vez": quem recebe tira o de quem tinha
    if (e.destaque === "achado_da_vez") {
      await pool.query("UPDATE fichas SET destaque = 'nenhum' WHERE destaque = 'achado_da_vez' AND id <> $1", [id]);
    }
    await pool.query(`UPDATE fichas SET ${sets.join(", ")}, atualizado_em = now() WHERE id = $${vals.length}`, vals);
  });
  atualizarVitrine();
}

/** Muda o estado se o regulamento deixar; anota no diário. */
export async function mudarEstado(id: string, para: Estado, autor: Autor, motivo: string | null): Promise<{ ok: true } | { ok: false; motivo: string }> {
  const atual = await buscarFicha(id);
  if (!atual) return { ok: false, motivo: "Ficha não encontrada." };
  const regra = podeMudarEstado(atual.ficha, para, autor, motivo);
  if (!regra.ok) return regra;
  await comBanco(async (pool) => {
    await pool.query(
      `UPDATE fichas SET estado = $1::estado_oferta, motivo = $2, atualizado_em = now(), alterado_por = $4,
         publicado_em = CASE WHEN $1::estado_oferta = 'publicada' THEN now() ELSE publicado_em END,
         destaque = CASE WHEN $1::estado_oferta = 'publicada' THEN destaque ELSE 'nenhum' END
       WHERE id = $3`,
      [para, ["rejeitada", "pausada", "expirada"].includes(para) ? motivo?.trim() : null, id, autor],
    );
    await diario(pool, id, autor, "estado", motivo?.trim() ? [`motivo: ${motivo.trim()}`] : [], null, atual.ficha.estado, para);
  });
  atualizarVitrine();
  return { ok: true };
}

/** Grava o resultado de uma verificação de preço (manual pelo botão ou, no futuro, automática). */
export async function registrarVerificacao(
  id: string,
  autor: Autor,
  r: { ok: true; precoAtual: number | null; precoAnterior: number | null; statusNaLoja: string | null; fonte: string } | { ok: false; erro: string },
) {
  const atual = await buscarFicha(id);
  if (!atual) return;
  await comBanco(async (pool) => {
    if (!r.ok) {
      await diario(pool, id, autor, "erro", [], r.erro, null, null);
      return;
    }
    const m = mudancas(atual.ficha, { precoAtual: r.precoAtual, precoAnterior: r.precoAnterior, statusNaLoja: r.statusNaLoja, quantidadeAproximada: null });
    await pool.query(
      `UPDATE fichas SET preco_atual = $1, preco_anterior = $2, status_na_loja = $3, moeda = 'BRL', fonte = $4,
         verificado_em = now(), atualizado_em = now() WHERE id = $5`,
      [r.precoAtual, r.precoAnterior, r.statusNaLoja, r.fonte, id],
    );
    await diario(pool, id, autor, m.length ? "mudou" : "ok", m, null, null, null);
  });
  atualizarVitrine();
}

async function diario(
  pool: Pool, fichaId: string, autor: Autor, resultado: Verificacao["resultado"], m: string[], erro: string | null,
  de: Estado | null, para: Estado | null,
) {
  await pool.query(
    "INSERT INTO verificacoes (ficha_id, autor, resultado, mudancas, erro, estado_de, estado_para) VALUES ($1,$2,$3,$4,$5,$6,$7)",
    [fichaId, autor, resultado, m, erro, de, para],
  );
}

// ── Recorte da foto (só para o "Achado da vez") ──────────────────────────────

/** Você aprova (usar) ou recusa o recorte pronto. */
export async function decidirRecorte(id: string, usar: boolean) {
  await comBanco(async (pool) => {
    await pool.query("UPDATE fichas SET usar_recorte = $1 WHERE id = $2 AND recorte_status = 'pronto'", [usar, id]);
    await diario(pool, id, "moreno", "ok", [usar ? "recorte aprovado: nos destaques do topo, usa a foto sem fundo" : "recorte recusado: fica a foto original"], null, null, null);
  });
  atualizarVitrine();
}

/** Pede ao estagiário para recortar (ou refazer) esta foto na próxima execução. */
export async function pedirRecorte(id: string) {
  await comBanco(async (pool) => {
    await pool.query("UPDATE fichas SET recorte_status = 'pendente', recorte_erro = NULL, usar_recorte = false WHERE id = $1", [id]);
    await diario(pool, id, "moreno", "ok", ["recorte pedido: entra na próxima execução"], null, null, null);
  });
  atualizarVitrine();
}

// ── Garimpo automático (Etapa 6) ──────────────────────────────────────────────

/**
 * Publicação pela AUTOMAÇÃO: só pela porta do garimpo (podePublicarSozinho), que confere
 * interruptor, origem, link de afiliado, dados completos, preço recente e desconto mínimo.
 */
export async function publicarPeloGarimpo(id: string, cfg: ConfigGarimpo, motivo = "desconto confirmado"): Promise<Resultado> {
  const atual = await buscarFicha(id);
  if (!atual) return { ok: false, motivo: "Ficha não encontrada." };
  const regra = podePublicarSozinho(atual.ficha, cfg);
  if (!regra.ok) return regra;
  await comBanco(async (pool) => {
    await pool.query(
      `UPDATE fichas SET estado = 'publicada', motivo = NULL, alterado_por = 'automacao', publicado_em = now(), atualizado_em = now()
        WHERE id = $1`,
      [id],
    );
    await diario(pool, id, "automacao", "estado", [`publicada sozinha: ${motivo}`], null, atual.ficha.estado, "publicada");
  });
  atualizarVitrine();
  return { ok: true };
}

export async function anotarPreco(idCatalogo: string, itemId: string | null, preco: number, precoAnterior: number | null) {
  await comBanco((pool) =>
    pool.query("INSERT INTO historico_precos (id_catalogo, item_id, preco, preco_anterior) VALUES ($1, $2, $3, $4)", [
      idCatalogo, itemId, preco, precoAnterior,
    ]),
  );
}

export async function menorPreco30d(idCatalogo: string): Promise<number | null> {
  return comBanco(async (pool) => {
    const { rows } = await pool.query(
      "SELECT min(preco) AS m FROM historico_precos WHERE id_catalogo = $1 AND quando > now() - interval '30 days'",
      [idCatalogo],
    );
    return rows[0]?.m === null || rows[0]?.m === undefined ? null : Number(rows[0].m);
  });
}

export const NOMES_METODO: Record<string, string> = {
  fundo_branco: "Fundo branco",
  birefnet: "BiRefNet",
  isnet: "ISNet",
};

/** As versões de recorte que o estagiário gerou e qual está em uso. */
export async function opcoesRecorte(id: string): Promise<{ metodos: string[]; emUso: string | null }> {
  return comBanco(async (pool) => {
    const existe = await pool.query("SELECT to_regclass('recorte_opcoes') AS t");
    if (!existe.rows[0].t) return { metodos: [], emUso: null };
    const o = await pool.query("SELECT metodo FROM recorte_opcoes WHERE ficha_id = $1 ORDER BY array_position(ARRAY['fundo_branco','birefnet','isnet'], metodo)", [id]);
    const r = await pool.query("SELECT metodo FROM recortes WHERE ficha_id = $1", [id]);
    return { metodos: o.rows.map((x) => x.metodo as string), emUso: (r.rows[0]?.metodo as string) ?? null };
  });
}

/** Você escolhe outra versão do recorte: ela passa a ser a usada no site. */
export async function escolherOpcaoRecorte(id: string, metodo: string) {
  await comBanco(async (pool) => {
    const r = await pool.query(
      `UPDATE recortes SET png = o.png, metodo = o.metodo, criado_em = now()
         FROM recorte_opcoes o WHERE recortes.ficha_id = $1 AND o.ficha_id = $1 AND o.metodo = $2`,
      [id, metodo],
    );
    if (!r.rowCount) return;
    await pool.query("UPDATE fichas SET usar_recorte = true WHERE id = $1", [id]);
    await diario(pool, id, "moreno", "ok", [`recorte trocado para a versão "${NOMES_METODO[metodo] ?? metodo}"`], null, null, null);
  });
  atualizarVitrine();
}
