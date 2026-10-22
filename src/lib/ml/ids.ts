// Lê o código do produto (MLB…) a partir de uma URL do Mercado Livre.
//
// O ML tem dois tipos de página:
//  - Anúncio:  produto.mercadolivre.com.br/MLB-1234567890-raquete-...   → código do anúncio (item)
//  - Catálogo: www.mercadolivre.com.br/raquete-.../p/MLB12345678        → código do produto de catálogo
//    (uma página de catálogo junta vários vendedores; às vezes a URL traz o anúncio
//     escolhido em "item_id:MLB…" ou "wid=MLB…", e nesse caso preferimos o anúncio)
// Links encurtados (meli.la) não trazem o código: é preciso a URL original.

export type IdMercadoLivre =
  | { tipo: "anuncio"; id: string }
  | { tipo: "catalogo"; id: string }
  | { tipo: "erro"; motivo: string };

const normalizar = (bruto: string) => bruto.toUpperCase().replace("-", "");

export function lerIdMercadoLivre(entrada: string): IdMercadoLivre {
  const texto = entrada.trim();
  if (!texto) return { tipo: "erro", motivo: "Cole a URL do produto." };

  let url: URL;
  try {
    url = new URL(texto);
  } catch {
    return { tipo: "erro", motivo: "Isso não parece uma URL. Copie o endereço completo da página do produto." };
  }

  const host = url.hostname.toLowerCase();
  if (host === "meli.la" || host.endsWith(".meli.la")) {
    return {
      tipo: "erro",
      motivo: "Link encurtado (meli.la) não traz o código do produto. Use a URL original da página do produto.",
    };
  }
  if (!/(^|\.)mercadolivre\.com\.br$|(^|\.)mercadolibre\.com$/.test(host)) {
    return { tipo: "erro", motivo: "A URL não é do Mercado Livre." };
  }

  const completo = decodeURIComponent(url.pathname + url.search + url.hash);

  // 1) anúncio escolhido dentro de uma página de catálogo
  const anuncioEscolhido = completo.match(/(?:item_id[:=]|wid=)(MLB-?\d{6,})/i);
  if (anuncioEscolhido) return { tipo: "anuncio", id: normalizar(anuncioEscolhido[1]) };

  // 2) página de catálogo: /p/MLB12345678
  const catalogo = url.pathname.match(/\/p\/(MLB\d{6,})/i);
  if (catalogo) return { tipo: "catalogo", id: normalizar(catalogo[1]) };

  // 3) página de anúncio: /MLB-1234567890-...
  const anuncio = url.pathname.match(/\/(MLB-?\d{6,})/i);
  if (anuncio) return { tipo: "anuncio", id: normalizar(anuncio[1]) };

  return { tipo: "erro", motivo: "Não encontrei o código MLB nesta URL." };
}
