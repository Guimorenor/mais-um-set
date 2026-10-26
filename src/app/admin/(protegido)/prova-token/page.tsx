// Prova: o catálogo funciona com um passe do PRÓPRIO APP (client credentials),
// sem depender da sua conta conectada? Se sim, a conferência diária não precisa de reconexão.
// Nunca mostra o token: só se veio, por quanto tempo vale e o código HTTP de cada teste.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { API, consultar, provaHabilitada, type Resposta } from "@/lib/ml/prova";
import { obterTokenML } from "@/lib/ml/servidor";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Prova · Passe do app", robots: { index: false, follow: false } };

const CATALOGO = "MLB62535400"; // bola Dunlop (já cadastrada)

type PasseApp = { status: number; ok: boolean; expiraEm?: number; escopo?: string; temRefresh?: boolean; mensagem?: string; token?: string };

async function pedirPasseDoApp(): Promise<PasseApp> {
  try {
    const r = await fetch(`${API}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: process.env.ML_CLIENT_ID ?? "",
        client_secret: process.env.ML_CLIENT_SECRET ?? "",
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    const d = (await r.json().catch(() => ({}))) as Record<string, unknown>;
    return {
      status: r.status,
      ok: r.ok && typeof d.access_token === "string",
      expiraEm: typeof d.expires_in === "number" ? d.expires_in : undefined,
      escopo: typeof d.scope === "string" ? d.scope : undefined,
      temRefresh: typeof d.refresh_token === "string",
      mensagem: (d.message ?? d.error_description ?? d.error) as string | undefined,
      token: typeof d.access_token === "string" ? d.access_token : undefined,
    };
  } catch (e) {
    return { status: 0, ok: false, mensagem: e instanceof Error ? e.message : String(e) };
  }
}

function Linha({ nome, r }: { nome: string; r: Resposta }) {
  const msg = (r.corpo as { message?: string } | null)?.message;
  return (
    <tr className="border-t border-border-default">
      <td className="py-2 pr-4">{nome}</td>
      <td className="py-2 pr-4 font-semibold">{r.status ? `HTTP ${r.status}` : "sem resposta"}</td>
      <td className="py-2 text-text-subtle">{r.ok ? "✅ ok" : (msg ?? r.erro ?? "❌")}</td>
    </tr>
  );
}

export default async function ProvaPasse() {
  if (!provaHabilitada()) notFound();
  const passe = await pedirPasseDoApp();
  const testes: { nome: string; r: Resposta }[] = [];
  if (passe.token) {
    testes.push({ nome: `Catálogo com passe do APP (/products/${CATALOGO})`, r: await consultar(`/products/${CATALOGO}`, passe.token) });
    testes.push({ nome: `Ofertas com passe do APP (/products/${CATALOGO}/items)`, r: await consultar(`/products/${CATALOGO}/items`, passe.token) });
  }
  const daConta = await obterTokenML().catch(() => null);
  if (daConta) {
    testes.push({ nome: `Ofertas com passe da SUA CONTA (comparação)`, r: await consultar(`/products/${CATALOGO}/items`, daConta) });
  }
  testes.push({ nome: "Ofertas SEM passe nenhum", r: await consultar(`/products/${CATALOGO}/items`) });

  // ── Portas para ACHAR produtos sozinho (todas oficiais) ──
  const descoberta: { nome: string; r: Resposta; resumo: string }[] = [];
  let categoria: string | null = null;
  let produtoTeste: { id: string; nome: string } | null = null;
  if (passe.token) {
    const ofertas = await consultar(`/products/${CATALOGO}/items`, passe.token);
    categoria = ((ofertas.corpo as { results?: { category_id?: string }[] } | null)?.results?.[0]?.category_id) ?? null;
    const buscaCatalogo = await consultar(`/products/search?status=active&site_id=MLB&q=${encodeURIComponent("bola de tenis")}&limit=5`, passe.token);
    const res = (buscaCatalogo.corpo as { results?: { id?: string; name?: string }[]; paging?: { total?: number } } | null);
    descoberta.push({
      nome: "Busca no CATÁLOGO por palavra (/products/search?q=bola de tenis)",
      r: buscaCatalogo,
      resumo: res?.results ? `${res.paging?.total ?? "?"} produtos · ex.: ${res.results.slice(0, 3).map((x) => x.name).join(" | ")}` : "",
    });
    if (categoria) {
      const destaques = await consultar(`/highlights/MLB/category/${categoria}`, passe.token);
      const c = destaques.corpo as { content?: { id?: string; type?: string }[] } | null;
      const primeiro = c?.content?.find((x) => x.type === "PRODUCT")?.id;
      if (primeiro) {
        const p = await consultar(`/products/${primeiro}`, passe.token);
        produtoTeste = { id: primeiro, nome: (p.corpo as { name?: string } | null)?.name ?? primeiro };
      }
      descoberta.push({
        nome: `Mais vendidos da categoria (/highlights/MLB/category/${categoria})`,
        r: destaques,
        resumo: c?.content ? `${c.content.length} itens · tipos: ${[...new Set(c.content.map((x) => x.type))].join(", ")}` : "",
      });
    }
    descoberta.push({ nome: "Busca geral por palavra (/sites/MLB/search) — já sabíamos que é fechada", r: await consultar(`/sites/MLB/search?q=bola%20de%20tenis&limit=1`, passe.token), resumo: "" });
  }

  // ── Formato do seu link de afiliado (só para ver para onde o meli.la leva; nada é alterado) ──
  let destinoMeliLa: string | null = null;
  try {
    const r = await fetch("https://meli.la/2rRsq5s", { redirect: "manual", cache: "no-store", signal: AbortSignal.timeout(10_000) });
    destinoMeliLa = r.headers.get("location") ?? `HTTP ${r.status} sem redirecionamento`;
  } catch (e) {
    destinoMeliLa = `não consegui abrir: ${e instanceof Error ? e.message : e}`;
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 text-text-default">
      <p className="text-200 font-semibold text-text-subtlest uppercase">Prova técnica · só em preview</p>
      <h1 className="mt-1 text-800 font-bold text-text-brand">Passe do próprio app</h1>

      <section className="mt-8 rounded-[32px] border border-border-default bg-surface-default p-6">
        <h2 className="text-500 font-semibold text-text-brand">1. Pedido do passe do app (client credentials)</h2>
        <ul className="mt-3 space-y-1 text-300">
          <li>{passe.ok ? "✅" : "❌"} HTTP {passe.status || "sem resposta"}{passe.mensagem && ` · ${passe.mensagem}`}</li>
          {passe.ok && <li>Vale por: {passe.expiraEm ? `${Math.round(passe.expiraEm / 3600)} h` : "não informado"}</li>}
          {passe.ok && <li>Escopo: {passe.escopo || "não informado"} · token de renovação: {passe.temRefresh ? "sim" : "não"}</li>}
        </ul>
      </section>

      <section className="mt-6 rounded-[32px] border border-border-default bg-surface-default p-6">
        <h2 className="text-500 font-semibold text-text-brand">2. O catálogo responde? · {new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</h2>
        <table className="mt-3 w-full text-left text-200"><tbody>{testes.map((t) => <Linha key={t.nome} {...t} />)}</tbody></table>
      </section>

      <section className="mt-6 rounded-[32px] border border-border-default bg-surface-default p-6">
        <h2 className="text-500 font-semibold text-text-brand">3. Portas para achar produtos sozinho</h2>
        <table className="mt-3 w-full text-left text-200">
          <tbody>
            {descoberta.map((t) => (
              <tr key={t.nome} className="border-t border-border-default align-top">
                <td className="py-2 pr-4">{t.nome}</td>
                <td className="py-2 pr-4 font-semibold">{t.r.status ? `HTTP ${t.r.status}` : "sem resposta"}</td>
                <td className="py-2 break-all text-text-subtle">{t.r.ok ? `✅ ${t.resumo}` : ((t.r.corpo as { message?: string } | null)?.message ?? "❌")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {produtoTeste && (
        <section className="mt-6 rounded-[32px] border border-border-default bg-surface-default p-6">
          <h2 className="text-500 font-semibold text-text-brand">5. Link de teste de comissão (montado pelo sistema)</h2>
          <p className="mt-2 text-300">Produto: {produtoTeste.nome} ({produtoTeste.id})</p>
          <code className="mt-2 block rounded-xl bg-surface-subtle p-3 text-200 break-all">
            {`https://www.mercadolivre.com.br/p/${produtoTeste.id}?matt_word=guilhermemorenoribeiro&matt_tool=33244529`}
          </code>
        </section>
      )}

      <section className="mt-6 rounded-[32px] border border-border-default bg-surface-default p-6">
        <h2 className="text-500 font-semibold text-text-brand">4. Para onde o seu meli.la leva</h2>
        <p className="mt-3 text-200 break-all">{destinoMeliLa}</p>
      </section>
    </main>
  );
}
