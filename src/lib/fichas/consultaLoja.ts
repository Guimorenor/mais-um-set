// Do link colado até os dados da ficha: lê o código MLB, consulta o catálogo (se houver)
// e monta o que dá para preencher sozinho. Nada é inventado: o que a API não trouxer fica vazio.
import "server-only";
import { lerIdMercadoLivre, type IdMercadoLivre } from "@/lib/ml/ids";
import { precoAnteriorValido } from "@/lib/ml/catalogo";
import { lerCatalogo, type ResultadoCatalogo } from "@/lib/ml/servidor";

export type Consulta = {
  id: Exclude<IdMercadoLivre, { tipo: "erro" }>;
  idProdutoLoja: string;
  idCatalogo: string | null;
  catalogo: ResultadoCatalogo | null; // null = página sem catálogo (dados à mão)
  automatico: {
    tituloLoja: string | null;
    imagem: string | null;
    vendedor: string | null;
    precoAtual: number | null;
    precoAnterior: number | null;
    moeda: string | null;
    statusNaLoja: string | null;
    fonte: string | null;
    verificadoEm: Date | null;
  } | null;
  aviso: string | null;
};

export async function consultarLoja(url: string): Promise<{ ok: true; consulta: Consulta } | { ok: false; erro: string }> {
  const id = lerIdMercadoLivre(url);
  if (id.tipo === "erro") return { ok: false, erro: id.motivo };

  const idCatalogo = id.tipo === "catalogo" ? id.id : (id.catalogo ?? null);
  const idAnuncio = id.tipo === "anuncio" ? id.id : null;
  const base = { id, idCatalogo, idProdutoLoja: id.id };

  if (!idCatalogo) {
    return {
      ok: true,
      consulta: {
        ...base, catalogo: null, automatico: null,
        aviso: "Este link é de um anúncio fora de catálogo: a API oficial não libera os dados dele. Preencha título, foto e preço à mão.",
      },
    };
  }

  const catalogo = await lerCatalogo(idCatalogo, idAnuncio);
  if (!catalogo.ok) return { ok: true, consulta: { ...base, catalogo, automatico: null, aviso: catalogo.erro } };

  const d = catalogo.dados;
  const o = d.oferta;
  const aviso = !o
    ? idAnuncio
      ? `O anúncio ${idAnuncio} não aparece entre as ${d.totalOfertas} ofertas ativas do catálogo. Pode ter acabado: confira na loja.`
      : "O catálogo não tem ofertas ativas agora."
    : d.criterio === "menor_preco"
      ? `O link não indica o vendedor: usei a oferta de menor preço entre ${d.totalOfertas} (anúncio ${o.item_id}). Confira se é a mesma da página do seu link de afiliado.`
      : null;

  return {
    ok: true,
    consulta: {
      ...base,
      // sem anúncio na URL, a "digital" da ficha passa a ser o anúncio escolhido
      idProdutoLoja: idAnuncio ?? o?.item_id ?? idCatalogo,
      catalogo,
      aviso,
      automatico: {
        tituloLoja: d.nome,
        imagem: d.imagem,
        vendedor: o?.official_store_id ? `Loja oficial ${o.official_store_id}` : o?.seller_id ? `Vendedor ${o.seller_id}` : null,
        precoAtual: o && typeof o.price === "number" ? o.price : null,
        precoAnterior: o ? precoAnteriorValido(o) : null,
        moeda: o?.currency_id ?? null,
        statusNaLoja: o ? "active" : null,
        fonte: o ? `API oficial Mercado Livre · catálogo ${idCatalogo} · anúncio ${o.item_id}` : null,
        verificadoEm: o ? new Date() : null,
      },
    },
  };
}
