// Vitrine do site: as fichas PUBLICADAS no painel, prontas para os cards.
// Só entra o que está completo e com preço conferido há menos de 36 h —
// preço velho não aparece, mesmo publicado (a automação vai pausá-lo).
// Se o banco não responder, o site mostra a vitrine vazia (nunca preço inventado).
import "server-only";
import { unstable_cache } from "next/cache";
import { comBanco, variavelDoBanco } from "@/lib/db/conexao";
import { categorias, type CategoriaSlug } from "@/lib/categorias";
import { LIMITE_PRECO_VELHO_HORAS } from "@/lib/fichas/regras";
import type { Oferta } from "@/lib/ofertas";

export const TAG_VITRINE = "vitrine";

export type Vitrine = { ofertas: Oferta[]; achado: Oferta | null; secundarios: Oferta[] };

const VAZIA: Vitrine = { ofertas: [], achado: null, secundarios: [] };

async function lerDoBanco(): Promise<Vitrine> {
  if (!variavelDoBanco()) return VAZIA;
  try {
    const { rows } = await comBanco((pool) =>
      pool.query(
        `SELECT id, titulo_curto, titulo_loja, categoria, imagem, preco_atual, preco_anterior, link_afiliado,
                observacao, verificado_em, destaque
           FROM fichas
          WHERE estado = 'publicada'
            AND link_afiliado IS NOT NULL AND imagem IS NOT NULL AND categoria IS NOT NULL
            AND preco_atual IS NOT NULL AND coalesce(moeda, 'BRL') = 'BRL'
            AND verificado_em > now() - make_interval(hours => $1)
          ORDER BY publicado_em DESC NULLS LAST
          LIMIT 200`,
        [LIMITE_PRECO_VELHO_HORAS],
      ),
    );
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
        };
        return { oferta, destaque: r.destaque as string };
      });
    return {
      ofertas: lista.map((l) => l.oferta),
      achado: lista.find((l) => l.destaque === "achado_da_vez")?.oferta ?? null,
      secundarios: lista.filter((l) => l.destaque === "secundario").slice(0, 2).map((l) => l.oferta),
    };
  } catch (e) {
    console.error("[vitrine] banco não respondeu", e instanceof Error ? e.message : e);
    return VAZIA;
  }
}

/** Guardada por 60 s (o painel limpa na hora quando você muda uma ficha). */
export const lerVitrine = unstable_cache(lerDoBanco, ["vitrine-v1"], { revalidate: 60, tags: [TAG_VITRINE] });
