// Leitura do CATÁLOGO do Mercado Livre — a porta oficial que a prova (2026-10-24) mostrou aberta.
//  - /products/{id}        → nome, fotos, status do produto
//  - /products/{id}/items  → ofertas dos vendedores: preço, preço anterior, vendedor, frete
// Parte pura (escolherOferta) separada para ter teste automático.

export type OfertaCatalogo = {
  item_id: string;
  price: number | null;
  original_price: number | null;
  currency_id: string | null;
  seller_id: number | string | null;
  official_store_id?: number | null;
  condition?: string | null;
  shipping?: { free_shipping?: boolean } | null;
};

export type DadosCatalogo = {
  idCatalogo: string;
  nome: string | null;
  imagem: string | null;
  statusProduto: string | null;
  totalOfertas: number;
  oferta: OfertaCatalogo | null; // a oferta escolhida
  criterio: "anuncio_da_url" | "menor_preco" | null;
};

/**
 * Escolhe a oferta da ficha:
 *  - se a URL trouxe o anúncio (MLB…), usa exatamente ele (null se ele não estiver na lista);
 *  - se não trouxe, usa a de menor preço em reais, com preço válido.
 */
export function escolherOferta(
  ofertas: OfertaCatalogo[],
  idAnuncio: string | null,
): { oferta: OfertaCatalogo | null; criterio: DadosCatalogo["criterio"] } {
  if (idAnuncio) {
    const achada = ofertas.find((o) => o.item_id?.toUpperCase() === idAnuncio.toUpperCase()) ?? null;
    return { oferta: achada, criterio: achada ? "anuncio_da_url" : null };
  }
  const validas = ofertas.filter((o) => typeof o.price === "number" && o.price > 0 && (o.currency_id ?? "BRL") === "BRL");
  if (!validas.length) return { oferta: null, criterio: null };
  const menor = validas.reduce((a, b) => ((b.price as number) < (a.price as number) ? b : a));
  return { oferta: menor, criterio: "menor_preco" };
}

/** Preço anterior só vale se for MAIOR que o atual (senão não é desconto, é dado estranho). */
export function precoAnteriorValido(o: Pick<OfertaCatalogo, "price" | "original_price">): number | null {
  return typeof o.original_price === "number" && typeof o.price === "number" && o.original_price > o.price
    ? o.original_price
    : null;
}
