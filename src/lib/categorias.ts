// As 8 categorias do site. Cada uma tem um mascote (que funciona como filtro)
// e um tema de cor: os tokens category-<slug>-* do Design System.
export const categorias = [
  { slug: "raquetes", nome: "Raquetes", mascote: "Olha a terminação" },
  { slug: "bolinhas", nome: "Bolinhas", mascote: "Baloeiros" },
  { slug: "roupas", nome: "Roupas e acessórios", mascote: "Tô pelo lifestyle" },
  { slug: "calcados", nome: "Calçados", mascote: "Mexe esses pés" },
  { slug: "grips", nome: "Grips e overgrips", mascote: "Mão firme" },
  { slug: "equipamentos", nome: "Equipamentos", mascote: "Modo treino" },
  { slug: "bolsas", nome: "Bolsas e raqueteiras", mascote: "Ja ta pequena" },
  { slug: "cordas", nome: "Cordas", mascote: "Ta tenso?" },
] as const;

export type Categoria = (typeof categorias)[number];
export type CategoriaSlug = Categoria["slug"];

export const imagemMascote = (slug: CategoriaSlug) => `/mascotes/${slug}.webp`;

export function acharCategoria(slug: string | undefined) {
  return categorias.find((c) => c.slug === slug);
}

/** Estilo inline com as cores do tema da categoria (tokens category-<slug>-*). */
export function temaCategoria(slug: CategoriaSlug) {
  return {
    "--cat-surface": `var(--category-${slug}-surface)`,
    "--cat-text": `var(--category-${slug}-text)`,
    "--cat-accent": `var(--category-${slug}-accent)`,
    "--cat-on-accent": `var(--category-${slug}-on-accent)`,
  } as React.CSSProperties;
}
