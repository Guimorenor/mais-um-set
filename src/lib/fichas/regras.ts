// Regulamento da ficha de oferta (Etapa 4).
// Regras puras, sem banco e sem internet: valem igual para o painel e para a automação,
// e são conferidas por testes automáticos (regras.test.ts).
import type { CategoriaSlug } from "../categorias.ts";

/** Estados por onde uma ficha passa. Só "publicada" aparece no site. */
export const ESTADOS = ["rascunho", "em_revisao", "publicada", "pausada", "expirada", "rejeitada"] as const;
export type Estado = (typeof ESTADOS)[number];

export type Destaque = "nenhum" | "achado_da_vez" | "secundario";

/** Quem está pedindo a mudança: você (pelo painel) ou a verificação automática. */
export type Autor = "moreno" | "automacao";

export type Ficha = {
  id: string;
  loja: "mercado-livre";
  idProdutoLoja: string; // MLB… — a "digital" contra duplicados
  urlOriginal: string;
  idCatalogo?: string | null; // produto de catálogo (/p/MLB…): é por ele que a API traz o preço
  linkAfiliado: string | null; // colado à mão; o sistema nunca troca
  tituloLoja: string | null;
  tituloCurto: string | null; // editável por você
  imagem: string | null;
  vendedor: string | null;
  categoria: CategoriaSlug | null;
  observacao: string | null;
  precoAtual: number | null;
  precoAnterior: number | null; // só se a loja informar
  moeda: string | null;
  statusNaLoja: string | null; // "active", "paused", "closed"…
  quantidadeAproximada: number | null;
  verificadoEm: Date | null;
  fonte: string | null; // ex.: "API Mercado Livre /items"
  estado: Estado;
  motivo: string | null;
  destaque: Destaque;
  criadoEm: Date;
  atualizadoEm: Date;
  publicadoEm: Date | null;
  // Recorte da foto (só usado no "Achado da vez")
  recorteStatus?: "pendente" | "pronto" | "erro" | null;
  recorteErro?: string | null;
  usarRecorte?: boolean;
  // Garimpo automático (Etapa 6)
  origem?: "manual" | "garimpo";
  alteradoPor?: Autor | null; // quem fez a última mudança de estado
};

/** Depois de quanto tempo sem verificação o preço é considerado velho (decisão: 36 h). */
export const LIMITE_PRECO_VELHO_HORAS = 36;

// ── Transições ────────────────────────────────────────────────────────────────
// Quem pode levar a ficha de um estado para outro.
// A automação só pode PAUSAR ou EXPIRAR; publicar e reaprovar é sempre você.
const PERMITIDAS: Record<Autor, Partial<Record<Estado, Estado[]>>> = {
  moreno: {
    rascunho: ["em_revisao", "rejeitada"],
    em_revisao: ["publicada", "rejeitada", "rascunho"],
    publicada: ["pausada", "expirada"],
    pausada: ["publicada", "expirada", "em_revisao"],
    expirada: ["em_revisao"], // reativar
    rejeitada: ["em_revisao"],
  },
  automacao: {
    rascunho: ["em_revisao"], // dados chegaram completos
    publicada: ["pausada", "expirada"],
    pausada: ["expirada"],
  },
};

/** Estados que exigem anotar o motivo. */
const PEDEM_MOTIVO: Estado[] = ["rejeitada", "pausada", "expirada"];

export type Resultado = { ok: true } | { ok: false; motivo: string };

export function podeMudarEstado(ficha: Ficha, para: Estado, autor: Autor, motivo?: string | null): Resultado {
  if (ficha.estado === para) return { ok: false, motivo: "A ficha já está nesse estado." };
  const destinos = PERMITIDAS[autor][ficha.estado] ?? [];
  if (!destinos.includes(para)) {
    return {
      ok: false,
      motivo:
        autor === "automacao"
          ? `A automação não pode levar de "${ficha.estado}" para "${para}".`
          : `Não é possível ir de "${ficha.estado}" para "${para}".`,
    };
  }
  if (PEDEM_MOTIVO.includes(para) && !motivo?.trim()) return { ok: false, motivo: "Informe o motivo." };
  if (para === "publicada") {
    const falta = pendenciasParaPublicar(ficha);
    if (falta.length) return { ok: false, motivo: `Falta para publicar: ${falta.join(", ")}.` };
  }
  return { ok: true };
}

// ── Publicação ────────────────────────────────────────────────────────────────

/** Link de afiliado aceito: meli.la, /sec/ do Mercado Livre ou link com a etiqueta de afiliado. Nunca o link comum do produto. */
export function linkAfiliadoValido(link: string | null | undefined): boolean {
  if (!link) return false;
  try {
    const u = new URL(link.trim());
    if (u.protocol !== "https:") return false;
    const host = u.hostname.toLowerCase();
    if (host === "meli.la") return u.pathname.length > 1;
    if (/(^|\.)mercadolivre\.com$/.test(host)) return u.pathname.startsWith("/sec/");
    // Link com a etiqueta oficial de afiliado (matt_word + matt_tool), montado pelo garimpo
    if (/(^|\.)mercadolivre\.com\.br$/.test(host)) {
      return Boolean(u.searchParams.get("matt_word")?.trim() && /^\d+$/.test(u.searchParams.get("matt_tool") ?? ""));
    }
    return false;
  } catch {
    return false;
  }
}

/** O que falta para a ficha poder ir ao site. Lista vazia = pode publicar. */
export function pendenciasParaPublicar(f: Ficha, agora = new Date()): string[] {
  const falta: string[] = [];
  if (!linkAfiliadoValido(f.linkAfiliado)) falta.push("link de afiliado válido (meli.la)");
  if (!(f.tituloCurto ?? f.tituloLoja)?.trim()) falta.push("título");
  if (!f.imagem) falta.push("imagem");
  if (!f.categoria) falta.push("categoria");
  if (f.precoAtual === null || f.precoAtual <= 0) falta.push("preço atual");
  if (f.moeda && f.moeda !== "BRL") falta.push("preço em reais");
  if (f.statusNaLoja && f.statusNaLoja !== "active") falta.push("anúncio ativo na loja");
  if (precoVelho(f, agora)) falta.push(`verificação recente (menos de ${LIMITE_PRECO_VELHO_HORAS} h)`);
  return falta;
}

// ── Preço ─────────────────────────────────────────────────────────────────────

export function precoVelho(f: Pick<Ficha, "verificadoEm">, agora = new Date()): boolean {
  if (!f.verificadoEm) return true;
  return agora.getTime() - f.verificadoEm.getTime() > LIMITE_PRECO_VELHO_HORAS * 3_600_000;
}

/**
 * Desconto só quando os DOIS preços vieram da loja e fazem sentido.
 * Nunca é digitado. Retorna null quando não dá para afirmar um desconto.
 */
export function descontoConfiavel(f: Pick<Ficha, "precoAtual" | "precoAnterior">): number | null {
  const { precoAtual: por, precoAnterior: de } = f;
  if (por === null || de === null || por <= 0 || de <= por) return null;
  const pct = Math.round((1 - por / de) * 100);
  return pct >= 1 && pct <= 90 ? pct : null; // fora disso, provavelmente dado errado
}

// ── Verificação automática ────────────────────────────────────────────────────

export type DadosVerificados = {
  precoAtual: number | null;
  precoAnterior: number | null;
  statusNaLoja: string | null;
  quantidadeAproximada: number | null;
};

/** Compara a ficha com o que a loja respondeu agora e diz o que mudou (para o diário). */
export function mudancas(f: Ficha, novo: DadosVerificados): string[] {
  const m: string[] = [];
  const fmt = (v: number | null) => (v === null ? "—" : `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`);
  if (f.precoAtual !== novo.precoAtual) m.push(`preço: ${fmt(f.precoAtual)} → ${fmt(novo.precoAtual)}`);
  if (f.precoAnterior !== novo.precoAnterior) m.push(`preço anterior: ${fmt(f.precoAnterior)} → ${fmt(novo.precoAnterior)}`);
  if (f.statusNaLoja !== novo.statusNaLoja) m.push(`status na loja: ${f.statusNaLoja ?? "—"} → ${novo.statusNaLoja ?? "—"}`);
  return m;
}

/**
 * Decide o que a automação deve fazer com uma ficha PUBLICADA depois de verificar.
 * Nunca publica nem apaga: no máximo pausa ou expira, sempre com motivo.
 */
export function decisaoAutomatica(
  f: Ficha,
  verificacao: { ok: true; dados: DadosVerificados } | { ok: false; erro: string; naoEncontrado?: boolean },
  agora = new Date(),
): { acao: "manter" } | { acao: "pausar" | "expirar"; motivo: string } {
  if (f.estado !== "publicada") return { acao: "manter" };
  if (!verificacao.ok) {
    if (verificacao.naoEncontrado) return { acao: "expirar", motivo: "Anúncio não existe mais na loja." };
    // falha temporária: mantém e tenta de novo, a menos que o preço já esteja velho demais
    if (precoVelho(f, agora)) {
      return { acao: "pausar", motivo: `Preço sem verificação há mais de ${LIMITE_PRECO_VELHO_HORAS} h (${verificacao.erro}).` };
    }
    return { acao: "manter" };
  }
  const s = verificacao.dados.statusNaLoja;
  if (s === "closed") return { acao: "expirar", motivo: "Anúncio encerrado na loja." };
  if (s && s !== "active") return { acao: "pausar", motivo: `Anúncio ${s} na loja.` };
  if (verificacao.dados.quantidadeAproximada === 0) return { acao: "pausar", motivo: "Sem estoque na loja." };
  if (verificacao.dados.precoAtual === null) return { acao: "pausar", motivo: "A loja não informou o preço." };
  return { acao: "manter" };
}
