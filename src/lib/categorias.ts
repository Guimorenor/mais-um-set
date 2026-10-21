// As 8 categorias do site. Cada uma tem um mascote e um tema de cor
// (tokens category-<slug>-* do Design System).
export const categorias = [
  { slug: "raquetes", nome: "Raquetes" },
  { slug: "bolinhas", nome: "Bolinhas" },
  { slug: "calcados", nome: "Calçados" },
  { slug: "roupas", nome: "Roupas" },
  { slug: "bolsas", nome: "Bolsas e raqueteiras" },
  { slug: "cordas", nome: "Cordas" },
  { slug: "grips", nome: "Grips" },
  { slug: "equipamentos", nome: "Equipamentos" },
] as const;

export type CategoriaSlug = (typeof categorias)[number]["slug"];
