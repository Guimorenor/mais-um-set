// Vitrine do site: as fichas PUBLICADAS no painel, prontas para os cards.
// Só entra o que está completo e com preço conferido há menos de 36 h —
// preço velho não aparece, mesmo publicado (a automação vai pausá-lo).
// Se o banco não responder, o site mostra a vitrine vazia (nunca preço inventado).
import "server-only";
import { unstable_cache } from "next/cache";
import { comBanco, variavelDoBanco } from "@/lib/db/conexao";
import { categorias, type CategoriaSlug } from "@/lib/categorias";
import { LIMITE_PRECO_VELHO_HORAS } from "@/lib/fichas/regras";
import { decidirEnquadramento, type Oferta } from "@/lib/ofertas";
import { escolherDestaques } from "@/lib/destaques";

export const TAG_VITRINE = "vitrine";

export type Vitrine = { ofertas: Oferta[]; achado: Oferta | null; secundarios: Oferta[] };

const VAZIA: Vitrine = { ofertas: [], achado: null, secundarios: [] };

async function lerDoBanco(): Promise<Vitrine> {
  if (!variavelDoBanco()) return VAZIA;
  try {
    const { rows, automatico } = await comBanco(async (pool) => {
      // as colunas de recorte/automação chegam na migração 004; antes dela, segue sem elas
      const temRecorte = Boolean((await pool.query("SELECT to_regclass('recortes') AS t")).rows[0].t);
      const temEnquadramento = Boolean(
        (await pool.query("SELECT 1 FROM information_schema.columns WHERE table_name = 'fichas' AND column_name = 'imagem_ajuste'")).rowCount,
      );
      const r = await pool.query(
        `SELECT f.id, f.titulo_curto, f.titulo_loja, f.categoria, f.imagem, f.preco_atual, f.preco_anterior, f.link_afiliado,
                f.observacao, f.verificado_em, f.destaque,
                ${temEnquadramento ? "f.imagem_tipo, f.imagem_fundo, f.imagem_ajuste," : "null AS imagem_tipo, null AS imagem_fundo, null AS imagem_ajuste,"}
                ${temRecorte ? "(f.usar_recorte AND rc.imagem_origem = f.imagem) AS com_recorte, extract(epoch FROM rc.criado_em)::bigint AS versao_recorte" : "false AS com_recorte, null AS versao_recorte"}
           FROM fichas f
           ${temRecorte ? "LEFT JOIN recortes rc ON rc.ficha_id = f.id" : ""}
          WHERE f.estado = 'publicada'
            AND f.link_afiliado IS NOT NULL AND f.imagem IS NOT NULL AND f.categoria IS NOT NULL
            AND f.preco_atual IS NOT NULL AND coalesce(f.moeda, 'BRL') = 'BRL'
            AND f.verificado_em > now() - make_interval(hours => $1)
          ORDER BY f.publicado_em DESC NULLS LAST
          LIMIT 200`,
        [LIMITE_PRECO_VELHO_HORAS],
      );
      const auto = temRecorte
        ? Boolean((await pool.query("SELECT ativa FROM automacoes WHERE nome = 'destaque_automatico'")).rows[0]?.ativa)
        : false;
      return { rows: r.rows, automatico: auto };
    });
    const slugs = categorias.map((c) => c.slug as string);
    const lista = rows
      .filter((r) => slugs.includes(r.categoria))
      .map((r) => {
        const por = Number(r.preco_atual);
        const de = r.preco_anterior === null ? null : Number(r.preco_anterior);
        const oferta: Oferta = {
          id: r.id,
          titulo: r.titulo_curto || r.titulo_loja || "Oferta",
          categoria: r.categoria as CategoriaSlug,
          loja: "Mercado Livre",
          imagem: r.imagem,
          precoPor: por,
          precoDe: de !== null && de > por ? de : null,
          link: r.link_afiliado,
          observacao: r.observacao ?? undefined,
          verificadoEm: new Date(r.verificado_em).toISOString(),
          imagemRecorte: r.com_recorte ? `/api/recorte/${r.id}?v=${r.versao_recorte}` : undefined,
          enquadramento: decidirEnquadramento(r.imagem_tipo, r.imagem_ajuste),
          fundoImagem: r.imagem_fundo ?? undefined,
        };
        return { oferta, destaqueManual: r.destaque as string, temRecorte: Boolean(r.com_recorte) };
      });
    return { ofertas: lista.map((l) => l.oferta), ...escolherDestaques(lista, automatico) };
  } catch (e) {
    console.error("[vitrine] banco não respondeu", e instanceof Error ? e.message : e);
    return VAZIA;
  }
}

/** Guardada por 60 s (o painel limpa na hora quando você muda uma ficha). */
export const lerVitrine = unstable_cache(lerDoBanco, ["vitrine-v3"], { revalidate: 60, tags: [TAG_VITRINE] });
