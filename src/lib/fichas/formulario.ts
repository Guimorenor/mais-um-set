// Leitura dos campos do formulário do painel (puro, com teste).
import { categorias, type CategoriaSlug } from "../categorias.ts";

/** "1.234,56" · "1234,56" · "67.80" · "R$ 89" → número. Vazio ou inválido → null. */
export function lerPreco(bruto: FormDataEntryValue | null | undefined): number | null {
  if (typeof bruto !== "string") return null;
  let t = bruto.replace(/R\$|\s/gi, "");
  if (!t) return null;
  if (t.includes(",")) t = t.replace(/\./g, "").replace(",", "."); // formato brasileiro
  if (!/^\d+(\.\d{1,2})?$/.test(t)) return null;
  const n = Number(t);
  return n > 0 && n < 1_000_000 ? n : null;
}

export function textoOuNull(bruto: FormDataEntryValue | null | undefined, max = 300): string | null {
  if (typeof bruto !== "string") return null;
  const t = bruto.trim().slice(0, max);
  return t || null;
}

export function lerCategoria(bruto: FormDataEntryValue | null | undefined): CategoriaSlug | null {
  return categorias.find((c) => c.slug === bruto)?.slug ?? null;
}

/** Imagem só por https (o card não pode puxar foto de endereço inseguro). */
export function lerImagem(bruto: FormDataEntryValue | null | undefined): string | null {
  const t = textoOuNull(bruto, 1000);
  if (!t) return null;
  try {
    return new URL(t).protocol === "https:" ? t : null;
  } catch {
    return null;
  }
}
