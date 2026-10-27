// Regulamento do GARIMPO automático (Etapa 6) — puro, sem banco e sem internet, com testes.
// Decisão do Moreno (2026-10-25/26): o sistema acha produtos, publica e tira do ar sozinho,
// pelo caminho oficial (catálogo do Mercado Livre). Tudo com interruptor no painel.
import { descontoConfiavel, pendenciasParaPublicar, precoVelho, type Ficha, type Resultado } from "../fichas/regras.ts";
import type { CategoriaSlug } from "../categorias.ts";

export type Busca = {
  termo: string;
  categoria: CategoriaSlug;
  obrigatorias: string[]; // o nome do produto precisa ter ao menos UMA destas palavras
  proibidas: string[]; // nenhuma destas
};

export type ConfigGarimpo = {
  descontoMinimo: number; // % (decisão inicial: 10)
  publicacaoAutomatica: boolean;
  linkPorEtiqueta: boolean; // só ligar depois do teste de clique no painel de Afiliados
  mattWord: string;
  mattTool: string;
};

// sem acento, minúsculas, pontuação vira espaço: comparamos PALAVRAS inteiras ("ping" não casa com "shopping")
const normalizar = (t: string) =>
  ` ${t.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()} `;

/** O produto achado combina com a busca? (evita "cesto pegador" em Bolinhas, "padel" em Raquetes…) */
export function passaFiltro(nome: string, b: Pick<Busca, "obrigatorias" | "proibidas">): boolean {
  const n = normalizar(nome);
  const tem = (p: string) => n.includes(normalizar(p));
  if (b.proibidas.some(tem)) return false;
  return b.obrigatorias.length === 0 || b.obrigatorias.some(tem);
}

/**
 * Desconto "de verdade": além do preço riscado da loja, o preço de agora precisa estar
 * perto do MENOR preço que nós mesmos vimos nos últimos 30 dias (até 2% acima).
 * Pega o truque de subir o preço antes para depois "dar desconto".
 */
export function descontoReal(precoAtual: number, menorPreco30d: number | null): boolean {
  return menorPreco30d === null || precoAtual <= menorPreco30d * 1.02;
}

/** Link do produto com a SUA etiqueta de afiliado. */
export function montarLinkEtiqueta(idCatalogo: string, cfg: Pick<ConfigGarimpo, "mattWord" | "mattTool">): string {
  const u = new URL(`https://www.mercadolivre.com.br/p/${idCatalogo}`);
  u.searchParams.set("matt_word", cfg.mattWord);
  u.searchParams.set("matt_tool", cfg.mattTool);
  return u.toString();
}

/** Única porta para a AUTOMAÇÃO publicar. A regra geral (regras.ts) continua proibindo. */
export function podePublicarSozinho(f: Ficha, cfg: ConfigGarimpo, agora = new Date()): Resultado {
  if (!cfg.publicacaoAutomatica) return { ok: false, motivo: "Publicação automática desligada no painel." };
  if (f.origem !== "garimpo") return { ok: false, motivo: "Só fichas do garimpo são publicadas sozinhas." };
  if (!["rascunho", "em_revisao", "pausada"].includes(f.estado)) return { ok: false, motivo: `Estado "${f.estado}" não é publicado sozinho.` };
  if (f.estado === "pausada" && f.alteradoPor !== "automacao") return { ok: false, motivo: "Você pausou esta ficha: só você republica." };
  const falta = pendenciasParaPublicar(f, agora);
  if (falta.length) return { ok: false, motivo: `Falta: ${falta.join(", ")}.` };
  const pct = descontoConfiavel(f);
  if (pct === null || pct < cfg.descontoMinimo) return { ok: false, motivo: `Desconto abaixo de ${cfg.descontoMinimo}%.` };
  return { ok: true };
}

export type Conferencia =
  | { ok: true; achou: true; precoAtual: number | null; precoAnterior: number | null }
  | { ok: true; achou: false } // o anúncio saiu da lista de ofertas do catálogo
  | { ok: false; erro: string; naoEncontrado?: boolean };

/** Depois de conferir o preço: o que a automação faz com a ficha. Nunca apaga; sempre com motivo. */
export function decidirConferencia(
  f: Ficha,
  c: Conferencia,
  cfg: ConfigGarimpo,
  agora = new Date(),
): { acao: "manter" } | { acao: "pausar" | "expirar" | "republicar"; motivo: string } {
  if (f.estado === "publicada") {
    if (!c.ok) {
      if (c.naoEncontrado) return { acao: "expirar", motivo: "Produto não existe mais no catálogo." };
      return precoVelho(f, agora) ? { acao: "pausar", motivo: `Sem conferir o preço há mais de 36 h (${c.erro}).` } : { acao: "manter" };
    }
    if (!c.achou) return { acao: "pausar", motivo: "O anúncio saiu das ofertas ativas do catálogo." };
    if (c.precoAtual === null) return { acao: "pausar", motivo: "A loja não informou o preço." };
    if (f.origem === "garimpo") {
      const pct = descontoConfiavel({ precoAtual: c.precoAtual, precoAnterior: c.precoAnterior });
      if (pct === null || pct < cfg.descontoMinimo) return { acao: "pausar", motivo: `Desconto caiu para menos de ${cfg.descontoMinimo}%.` };
    }
    return { acao: "manter" };
  }
  if (f.estado === "pausada" && f.alteradoPor === "automacao" && c.ok && c.achou && c.precoAtual !== null) {
    const depois: Ficha = { ...f, precoAtual: c.precoAtual, precoAnterior: c.precoAnterior, verificadoEm: agora, statusNaLoja: "active" };
    if (podePublicarSozinho(depois, cfg, agora).ok) return { acao: "republicar", motivo: "Desconto voltou." };
  }
  return { acao: "manter" };
}
