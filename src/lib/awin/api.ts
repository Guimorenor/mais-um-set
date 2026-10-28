// Awin (rede de afiliados: Netshoes, Centauro…). Só caminhos oficiais da API pública da Awin.
// A chave (AWIN_API_TOKEN) e o número de publisher (AWIN_PUBLISHER_ID) ficam no cofre da Vercel.
import "server-only";

export const AWIN_API = "https://api.awin.com";

export type RespostaAwin = { status: number; ok: boolean; corpo: unknown; erro?: string };

export function configAwin() {
  return { token: process.env.AWIN_API_TOKEN ?? "", publisher: process.env.AWIN_PUBLISHER_ID ?? "" };
}

async function chamar(caminho: string, init: RequestInit = {}): Promise<RespostaAwin> {
  const { token } = configAwin();
  try {
    const r = await fetch(`${AWIN_API}${caminho}`, {
      ...init,
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json", ...(init.headers ?? {}) },
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
    const texto = await r.text();
    let corpo: unknown = texto;
    try {
      corpo = JSON.parse(texto);
    } catch {}
    return { status: r.status, ok: r.ok, corpo };
  } catch (e) {
    return { status: 0, ok: false, corpo: null, erro: e instanceof Error ? e.message : String(e) };
  }
}

/** Programas (lojas) em que você foi aceito no Brasil. */
export const programasAceitos = () =>
  chamar(`/publishers/${configAwin().publisher}/programmes?relationship=joined&countryCode=BR`);

/** Gera o link de afiliado de uma página da loja (Link Builder oficial). */
export const gerarLink = (advertiserId: number, destino: string) =>
  chamar(`/publishers/${configAwin().publisher}/linkbuilder/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ advertiserId, destinationUrl: destino, shorten: true }),
  });

/** Primeiras linhas do feed de produtos de uma loja (JSONL). Lê pouco, só para testar. */
export async function amostraDoFeed(advertiserId: number, locale = "pt_BR", linhas = 3) {
  const { token, publisher } = configAwin();
  try {
    const r = await fetch(`${AWIN_API}/publishers/${publisher}/awinfeeds/download/${advertiserId}-retail-${locale}.jsonl`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    });
    if (!r.ok || !r.body) return { status: r.status, produtos: [] as Record<string, unknown>[], texto: (await r.text()).slice(0, 200) };
    const leitor = r.body.getReader();
    let buffer = "";
    while (buffer.split("\n").length <= linhas) {
      const { value, done } = await leitor.read();
      if (done) break;
      buffer += new TextDecoder().decode(value);
      if (buffer.length > 200_000) break;
    }
    leitor.cancel().catch(() => {});
    const produtos = buffer.split("\n").slice(0, linhas).filter(Boolean).map((l) => {
      try { return JSON.parse(l) as Record<string, unknown>; } catch { return { linha_invalida: l.slice(0, 100) }; }
    });
    return { status: r.status, produtos, texto: "" };
  } catch (e) {
    return { status: 0, produtos: [], texto: e instanceof Error ? e.message : String(e) };
  }
}
