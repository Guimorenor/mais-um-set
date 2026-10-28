import type { CategoriaSlug } from "./categorias";

// Formato de uma oferta como o SITE mostra (cards, destaques do topo).
// As ofertas vêm das fichas PUBLICADAS no painel (src/lib/vitrine.ts).

export type Oferta = {
  id: string;
  titulo: string;
  categoria: CategoriaSlug;
  loja: string;
  imagem: string;
  imagemRecorte?: string; // foto sem fundo (PNG), quando você aprovou o recorte
  precoDe: number | null; // só quando a loja informou o preço anterior
  precoPor: number;
  link: string; // link de afiliado (meli.la)
  observacao?: string;
  verificadoEm: string; // ISO: quando o preço foi conferido
  enquadramento?: Enquadramento; // como a foto aparece no card
  fundoImagem?: string; // cor do fundo da foto (#rrggbb), usada em volta do produto inteiro
};

export type Enquadramento = "inteira" | "preencher";

/**
 * Como mostrar a foto no card. Você manda (ajuste na ficha); senão, o que o estagiário viu:
 * foto com cenário preenche; produto em fundo liso aparece inteiro. Sem análise ainda: inteira (nunca corta).
 */
export function decidirEnquadramento(tipo: string | null | undefined, ajuste: string | null | undefined): Enquadramento {
  if (ajuste === "inteira" || ajuste === "preencher") return ajuste;
  return tipo === "cena" ? "preencher" : "inteira";
}

export const formatarPreco = (valor: number) => {
  const centavos = Number.isInteger(valor) ? 0 : 2;
  return "R$ " + valor.toLocaleString("pt-BR", { minimumFractionDigits: centavos, maximumFractionDigits: centavos });
};

/** Desconto só quando a loja informou os dois preços e o número faz sentido (1–90%). */
export const desconto = (o: Pick<Oferta, "precoDe" | "precoPor">): number | null => {
  if (!o.precoDe || o.precoDe <= o.precoPor) return null;
  const pct = Math.round((1 - o.precoPor / o.precoDe) * 100);
  return pct >= 1 && pct <= 90 ? pct : null;
};

/** "verificado 25/10, 18:19" no fuso de Brasília. */
export const verificadoEm = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
