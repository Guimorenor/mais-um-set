// Prova técnica da Awin: programas aceitos, feed de produtos e gerador de links.
// Não grava nada; nunca mostra a chave.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { amostraDoFeed, configAwin, gerarLink, programasAceitos } from "@/lib/awin/api";
import { painelHabilitado } from "@/lib/painel";

export const dynamic = "force-dynamic";
export const maxDuration = 120;
export const metadata: Metadata = { title: "Prova · Awin", robots: { index: false, follow: false } };

type Programa = { id?: number; name?: string; displayUrl?: string; primaryRegion?: { countryCode?: string } };

const caixa = "mt-6 rounded-[32px] border border-border-default bg-surface-default p-6";
const resumo = (v: unknown) => (typeof v === "object" ? JSON.stringify(v) : String(v ?? "")).slice(0, 180);

export default async function ProvaAwin() {
  if (!painelHabilitado()) notFound();
  const cfg = configAwin();
  const temTudo = Boolean(cfg.token && cfg.publisher);

  const prog = temTudo ? await programasAceitos() : null;
  const programas = (Array.isArray(prog?.corpo) ? (prog!.corpo as Programa[]) : []).slice(0, 10);

  const testes = [];
  for (const p of programas.slice(0, 4)) {
    if (!p.id) continue;
    const feed = await amostraDoFeed(p.id);
    const destino = p.displayUrl ? (p.displayUrl.startsWith("http") ? p.displayUrl : `https://${p.displayUrl}`) : null;
    const link = destino ? await gerarLink(p.id, destino) : null;
    testes.push({ p, feed, destino, link });
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 text-text-default">
      <p className="text-200 font-semibold text-text-subtlest uppercase">Prova técnica · só em preview</p>
      <h1 className="mt-1 text-800 font-bold text-text-brand">Awin (Netshoes, Centauro…)</h1>

      <section className={caixa}>
        <h2 className="text-500 font-semibold text-text-brand">1. Configuração</h2>
        <ul className="mt-3 space-y-1 text-300">
          <li>{cfg.token ? "✅" : "❌"} <code>AWIN_API_TOKEN</code> {cfg.token ? "configurada" : "faltando"}</li>
          <li>{cfg.publisher ? "✅" : "❌"} <code>AWIN_PUBLISHER_ID</code> {cfg.publisher ? `configurado (${cfg.publisher})` : "faltando"}</li>
        </ul>
      </section>

      {prog && (
        <section className={caixa}>
          <h2 className="text-500 font-semibold text-text-brand">2. Lojas que aceitaram você (Brasil)</h2>
          <p className="mt-2 text-300">HTTP {prog.status} {prog.ok ? "✅" : `❌ ${resumo(prog.corpo)}`}</p>
          <ul className="mt-2 space-y-1 text-300">
            {programas.map((p) => <li key={p.id}>• {p.name} (id {p.id}) — {p.displayUrl}</li>)}
            {prog.ok && programas.length === 0 && <li>Nenhuma loja aceitou ainda (ou os pedidos estão em análise).</li>}
          </ul>
        </section>
      )}

      {testes.map(({ p, feed, destino, link }) => (
        <section key={p.id} className={caixa}>
          <h2 className="text-500 font-semibold text-text-brand">3. {p.name}</h2>
          <p className="mt-2 text-300 font-semibold">Feed de produtos (pt_BR): HTTP {feed.status || "sem resposta"} {feed.produtos.length ? "✅" : "❌"}</p>
          {feed.texto && <p className="text-200 text-text-subtle break-all">{feed.texto}</p>}
          {feed.produtos.length > 0 && (
            <>
              <p className="mt-1 text-200 text-text-subtle break-all">Campos: {Object.keys(feed.produtos[0]).join(", ")}</p>
              <ul className="mt-2 space-y-1 text-200">
                {feed.produtos.map((x, i) => (
                  <li key={i} className="break-all">• {resumo(x.title ?? x.product_name ?? x.name)} · {resumo(x.price ?? x.search_price)} · antes {resumo(x.sale_price ?? x.rrp_price ?? x.product_price_old)}</li>
                ))}
              </ul>
            </>
          )}
          <p className="mt-4 text-300 font-semibold">Gerador de link ({destino}): HTTP {link?.status ?? "—"} {link?.ok ? "✅" : "❌"}</p>
          <p className="text-200 break-all text-text-subtle">{link ? resumo(link.corpo) : "sem endereço da loja"}</p>
        </section>
      ))}
    </main>
  );
}
