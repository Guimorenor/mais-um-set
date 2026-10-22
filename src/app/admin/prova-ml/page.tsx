// Página de prova técnica da API do Mercado Livre (Etapa 3).
// Só existe em preview com ML_PROVA_ATIVA=1. Não grava nada: consulta e mostra.
import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { notFound } from "next/navigation";
import { lerIdMercadoLivre } from "@/lib/ml/ids";
import { COOKIE_TOKEN, consultar, provaHabilitada, urlDeRetorno, variaveisPresentes, type Resposta } from "@/lib/ml/prova";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Prova · Mercado Livre", robots: { index: false, follow: false } };

type Props = { searchParams: Promise<{ url?: string; erro?: string }> };

// Campos que queremos da API e para que servem na ficha da oferta
const CAMPOS: { chave: string; rotulo: string; uso: string }[] = [
  { chave: "id", rotulo: "Código do anúncio", uso: "evitar duplicados" },
  { chave: "title", rotulo: "Título", uso: "nome no card" },
  { chave: "price", rotulo: "Preço atual", uso: "preço no card" },
  { chave: "original_price", rotulo: "Preço anterior", uso: "'De' e desconto (só se vier)" },
  { chave: "currency_id", rotulo: "Moeda", uso: "conferir que é BRL" },
  { chave: "status", rotulo: "Status do anúncio", uso: "pausar se não estiver ativo" },
  { chave: "available_quantity", rotulo: "Quantidade disponível", uso: "aproximada, segundo a doc" },
  { chave: "condition", rotulo: "Condição", uso: "novo/usado" },
  { chave: "pictures", rotulo: "Fotos", uso: "imagem do card" },
  { chave: "thumbnail", rotulo: "Miniatura", uso: "reserva de imagem" },
  { chave: "seller_id", rotulo: "Vendedor (código)", uso: "mostrar quem vende" },
  { chave: "permalink", rotulo: "Link do anúncio", uso: "conferir a URL original" },
  { chave: "catalog_product_id", rotulo: "Produto de catálogo", uso: "agrupar o mesmo produto" },
  { chave: "category_id", rotulo: "Categoria no ML", uso: "sugerir nossa categoria" },
  { chave: "last_updated", rotulo: "Última atualização no ML", uso: "saber se mudou" },
];

function resumo(valor: unknown): string {
  if (valor === undefined || valor === null || valor === "") return "";
  if (Array.isArray(valor)) {
    const primeira = valor[0] as { secure_url?: string } | undefined;
    return `${valor.length} item(ns)${primeira?.secure_url ? ` — 1ª: ${primeira.secure_url}` : ""}`;
  }
  if (typeof valor === "object") return JSON.stringify(valor).slice(0, 160);
  return String(valor);
}

function itemDoMultiget(r: Resposta): Record<string, unknown> | null {
  if (!Array.isArray(r.corpo)) return null;
  const primeiro = r.corpo[0] as { code?: number; body?: Record<string, unknown> } | undefined;
  return primeiro?.code === 200 && primeiro.body ? primeiro.body : null;
}

function Linha({ nome, r }: { nome: string; r: Resposta }) {
  const multi = Array.isArray(r.corpo) ? (r.corpo[0] as { code?: number } | undefined)?.code : undefined;
  const msg = (r.corpo as { message?: string } | null)?.message;
  return (
    <tr className="border-t border-border-default">
      <td className="py-2 pr-4">{nome}</td>
      <td className="py-2 pr-4 font-semibold">{r.status === 0 ? "sem resposta" : `HTTP ${r.status}`}{multi !== undefined && ` · item ${multi}`}</td>
      <td className="py-2 text-text-subtle">{r.erro ?? msg ?? (r.ok ? "ok" : "")}</td>
    </tr>
  );
}

export default async function ProvaMercadoLivre({ searchParams }: Props) {
  if (!provaHabilitada()) notFound();
  const { url, erro } = await searchParams;
  const token = (await cookies()).get(COOKIE_TOKEN)?.value;
  const h = await headers();
  const origem = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
  const vars = variaveisPresentes();
  const id = url ? lerIdMercadoLivre(url) : null;
  const verificadoEm = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

  let testes: { nome: string; r: Resposta }[] = [];
  let item: Record<string, unknown> | null = null;
  if (token && id && id.tipo !== "erro") {
    const busca = await consultar("/sites/MLB/search?q=raquete%20head&limit=1", token);
    if (id.tipo === "anuncio") {
      const semToken = await consultar(`/items?ids=${id.id}`);
      const comToken = await consultar(`/items?ids=${id.id}`, token);
      item = itemDoMultiget(comToken);
      testes = [
        { nome: `Dados do anúncio SEM login (/items?ids=${id.id})`, r: semToken },
        { nome: `Dados do anúncio COM login (/items?ids=${id.id})`, r: comToken },
      ];
    } else {
      const produto = await consultar(`/products/${id.id}`, token);
      const vencedor = (produto.corpo as { buy_box_winner?: { item_id?: string } } | null)?.buy_box_winner?.item_id;
      testes = [{ nome: `Produto de catálogo COM login (/products/${id.id})`, r: produto }];
      if (vencedor) {
        const comToken = await consultar(`/items?ids=${vencedor}`, token);
        item = itemDoMultiget(comToken);
        testes.push({ nome: `Anúncio vencedor do catálogo (/items?ids=${vencedor})`, r: comToken });
      }
    }
    testes.push({ nome: "Busca por palavra COM login (/sites/MLB/search)", r: busca });
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 text-text-default">
      <p className="text-200 font-semibold text-text-subtlest uppercase">Prova técnica · só em preview</p>
      <h1 className="mt-1 text-800 font-bold text-text-brand">API oficial do Mercado Livre</h1>

      {erro && <p className="mt-6 rounded-2xl bg-surface-subtle p-4 text-300 text-text-default">⚠️ {erro}</p>}

      <section className="mt-8 rounded-[32px] border border-border-default bg-surface-default p-6">
        <h2 className="text-500 font-semibold text-text-brand">1. Configuração</h2>
        <ul className="mt-3 space-y-1 text-300">
          {Object.entries(vars).map(([k, v]) => (
            <li key={k}>{v ? "✅" : "❌"} <code>{k}</code> {v ? "configurada" : "faltando"}</li>
          ))}
        </ul>
        <p className="mt-4 text-300">Endereço de retorno para cadastrar no app do Mercado Livre (copie exatamente):</p>
        <code className="mt-1 block rounded-xl bg-surface-subtle p-3 text-200 break-all">{urlDeRetorno(origem)}</code>
      </section>

      <section className="mt-6 rounded-[32px] border border-border-default bg-surface-default p-6">
        <h2 className="text-500 font-semibold text-text-brand">2. Conectar sua conta</h2>
        {token ? (
          <p className="mt-3 text-300">✅ Conectado. O acesso vale até ~6 h e some sozinho.</p>
        ) : (
          <a href="/api/ml/autorizar" className="mt-3 inline-flex h-12 items-center rounded-full bg-action-primary-default px-6 text-300 font-semibold text-text-on-brand">
            Conectar Mercado Livre
          </a>
        )}
      </section>

      <section className="mt-6 rounded-[32px] border border-border-default bg-surface-default p-6">
        <h2 className="text-500 font-semibold text-text-brand">3. Testar um produto</h2>
        <form className="mt-3 flex flex-col gap-3 sm:flex-row" action="/admin/prova-ml">
          <input
            name="url"
            defaultValue={url}
            placeholder="Cole a URL ORIGINAL da página do produto (não o meli.la)"
            className="min-w-0 flex-1 rounded-full border border-border-input bg-surface-default px-4 py-3 text-300"
          />
          <button className="h-12 rounded-full bg-action-primary-default px-6 text-300 font-semibold text-text-on-brand">Consultar</button>
        </form>
        {id && (
          <p className="mt-3 text-300">
            {id.tipo === "erro" ? `❌ ${id.motivo}` : `Código lido: ${id.id} (${id.tipo === "anuncio" ? "anúncio" : "página de catálogo"})`}
          </p>
        )}
        {id && id.tipo !== "erro" && !token && <p className="mt-2 text-300">Conecte a conta (passo 2) para consultar.</p>}
      </section>

      {testes.length > 0 && (
        <section className="mt-6 rounded-[32px] border border-border-default bg-surface-default p-6">
          <h2 className="text-500 font-semibold text-text-brand">4. Resultado · verificado em {verificadoEm}</h2>
          <table className="mt-3 w-full text-left text-200">
            <tbody>
              {testes.map((t) => <Linha key={t.nome} {...t} />)}
            </tbody>
          </table>

          <h3 className="mt-6 text-400 font-semibold text-text-brand">Campos que a API devolveu para o anúncio</h3>
          {item ? (
            <table className="mt-2 w-full text-left text-200">
              <thead>
                <tr className="text-text-subtlest"><th className="py-2 pr-3">Campo</th><th className="py-2 pr-3">Veio?</th><th className="py-2 pr-3">Valor</th><th className="py-2">Uso na ficha</th></tr>
              </thead>
              <tbody>
                {CAMPOS.map((c) => {
                  const v = resumo(item![c.chave]);
                  return (
                    <tr key={c.chave} className="border-t border-border-default align-top">
                      <td className="py-2 pr-3">{c.rotulo} <code className="text-text-subtlest">{c.chave}</code></td>
                      <td className="py-2 pr-3">{v ? "✅" : "—"}</td>
                      <td className="py-2 pr-3 break-all">{v || "não veio"}</td>
                      <td className="py-2 text-text-subtle">{c.uso}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p className="mt-2 text-300">Nenhum dado de anúncio retornado — veja os códigos HTTP acima.</p>
          )}
        </section>
      )}
    </main>
  );
}
