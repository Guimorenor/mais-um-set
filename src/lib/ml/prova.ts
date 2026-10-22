// Prova técnica da API oficial do Mercado Livre (Etapa 3).
// Só roda no servidor: as chaves vêm das variáveis de ambiente e nunca vão para o navegador.
import "server-only";

export const API = "https://api.mercadolibre.com";
export const AUTORIZACAO = "https://auth.mercadolivre.com.br/authorization";
export const COOKIE_ESTADO = "ml_prova_estado";
export const COOKIE_TOKEN = "ml_prova_token";

/** A página de prova só existe fora da produção e com ML_PROVA_ATIVA=1. */
export function provaHabilitada() {
  return process.env.VERCEL_ENV !== "production" && process.env.ML_PROVA_ATIVA === "1";
}

/** Mostra só SE as variáveis existem — nunca o valor. */
export function variaveisPresentes() {
  return {
    ML_CLIENT_ID: Boolean(process.env.ML_CLIENT_ID),
    ML_CLIENT_SECRET: Boolean(process.env.ML_CLIENT_SECRET),
    ML_PROVA_ATIVA: process.env.ML_PROVA_ATIVA === "1",
  };
}

export const urlDeRetorno = (origem: string) => `${origem}/api/ml/retorno`;

export type Resposta = { status: number; ok: boolean; corpo: unknown; erro?: string };

/** GET na API com tempo limite (10 s) e sem cache. Nunca lança erro: devolve o que aconteceu. */
export async function consultar(caminho: string, token?: string): Promise<Resposta> {
  try {
    const r = await fetch(`${API}${caminho}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
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
