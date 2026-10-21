import type { CategoriaSlug } from "./categorias";

// DADOS DE EXEMPLO — iguais aos do Figma. Depois serão trocados pela fonte real
// das ofertas (planilha, painel ou API dos programas de afiliado).

export type Oferta = {
  id: string;
  titulo: string;
  categoria: CategoriaSlug;
  loja: string;
  imagem: string;
  precoDe: number;
  precoPor: number;
  link: string;
  observacao?: string;
};

export const formatarPreco = (valor: number) => {
  const centavos = Number.isInteger(valor) ? 0 : 2;
  return "R$ " + valor.toLocaleString("pt-BR", { minimumFractionDigits: centavos, maximumFractionDigits: centavos });
};

export const desconto = (o: Pick<Oferta, "precoDe" | "precoPor">) =>
  Math.round((1 - o.precoPor / o.precoDe) * 100);

/** Destaque grande do hero ("Achado da vez"). */
export const achadoDaVez: Oferta & { rotulo: string; video?: { thumb: string; chamada: string } } = {
  id: "head-extreme-mp-2026",
  titulo: "Head Extreme MP 2026",
  rotulo: "Raquete de tênis",
  categoria: "raquetes",
  loja: "Mercado livre",
  imagem: "/produtos/head-extreme-mp-2026.webp",
  precoDe: 1500,
  precoPor: 1050,
  link: "#",
  video: { thumb: "/home/video-thumb.webp", chamada: "Conheça o produto" },
};

/** Os dois destaques menores ao lado do título. */
export const destaquesSecundarios: Oferta[] = [
  {
    id: "bolsa-wilson-rf",
    titulo: "Bolsa Wilson RF Rollang",
    categoria: "bolsas",
    loja: "Amazon",
    imagem: "/produtos/bolsa-wilson-rf.webp",
    precoDe: 1500,
    precoPor: 1050,
    link: "#",
  },
  {
    id: "nike-zoom-vapor-12",
    titulo: "Nike Zoom Vapor 12 HC",
    categoria: "calcados",
    loja: "Mercado livre",
    imagem: "/produtos/nike-zoom-vapor-12.webp",
    precoDe: 1500,
    precoPor: 1050,
    link: "#",
  },
];

const obs = "Confira as condições no site.";

/** Grade "Achados para o próximo set" (os 8 produtos do Figma). */
export const ofertas: Oferta[] = [
  { id: "head-extreme-mp-l-2026", titulo: "Raquete De Tenis Head Extreme Mp L New 2026 - Mpl 280g - L2", categoria: "raquetes", loja: "Mercado livre", imagem: "/produtos/head-extreme-mp-l-2026.webp", precoDe: 1500, precoPor: 1050, link: "#", observacao: obs },
  { id: "bola-head-championship", titulo: "Bola De Tênis Head Championship Bolinha Tubo com 3 Unidades Amarela", categoria: "bolinhas", loja: "Mercado livre", imagem: "/produtos/bola-head-championship.webp", precoDe: 89.83, precoPor: 53.12, link: "#", observacao: obs },
  { id: "bone-head-microfibra", titulo: "Boné Head Microfibra Performance Uv Tennis E Esportes", categoria: "roupas", loja: "Amazon", imagem: "/produtos/bone-head-microfibra.webp", precoDe: 89.83, precoPor: 53.12, link: "#", observacao: obs },
  { id: "asics-gel-resolution-x", titulo: "Tênis Asics Gel-resolution X All Court Masculino", categoria: "calcados", loja: "Centauro", imagem: "/produtos/asics-gel-resolution-x.webp", precoDe: 1099.9, precoPor: 719.9, link: "#", observacao: obs },
  { id: "overgrip-babolat-pro-response", titulo: "Overgrip Babolat Pro Response - Branco Fita Cabo Empunhadura", categoria: "grips", loja: "Mercado livre", imagem: "/produtos/overgrip-babolat-pro-response.webp", precoDe: 99.99, precoPor: 59, link: "#", observacao: obs },
  { id: "lancador-de-bolas", titulo: "Treino Tênis Lançador Base Maquina Automática", categoria: "equipamentos", loja: "Mercado livre", imagem: "/produtos/lancador-de-bolas.webp", precoDe: 1840, precoPor: 1748, link: "#", observacao: obs },
  { id: "mochila-raqueteira-head", titulo: "Mochila Raqueteira Tenista Tênis/beach Tennis Head", categoria: "bolsas", loja: "Amazon", imagem: "/produtos/mochila-raqueteira-head.webp", precoDe: 649, precoPor: 403, link: "#", observacao: obs },
  { id: "corda-solinco-hyper-g", titulo: "Corda Solinco Hyper-g 12.2m 1.25mm Verde Co-poliéster Tênis Raquete.", categoria: "cordas", loja: "Amazon", imagem: "/produtos/corda-solinco-hyper-g.webp", precoDe: 109, precoPor: 103.31, link: "#", observacao: obs },
];
