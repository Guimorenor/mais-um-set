// Nova oferta: cole o link do produto → o painel lê o catálogo → você completa e salva como rascunho.
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
/* eslint-disable @next/next/no-img-element */
import { categorias } from "@/lib/categorias";
import { consultarLoja } from "@/lib/fichas/consultaLoja";
import { lerCategoria, lerImagem, lerPreco, textoOuNull } from "@/lib/fichas/formulario";
import { linkAfiliadoValido } from "@/lib/fichas/regras";
import { buscarPorProduto, criarFicha } from "@/lib/fichas/repositorio";
import { exigirDono } from "@/lib/painel";
import { Aviso, botao, caixa, campo, dataHora, preco } from "../_ui";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Nova oferta · Painel", robots: { index: false, follow: false } };

type Props = { searchParams: Promise<{ url?: string; erro?: string }> };

async function criar(form: FormData) {
  "use server";
  await exigirDono();
  const url = textoOuNull(form.get("url"), 2000) ?? "";
  const voltar = (erro: string) => redirect(`/admin/nova?url=${encodeURIComponent(url)}&erro=${encodeURIComponent(erro)}`);

  const link = textoOuNull(form.get("link_afiliado"), 500);
  if (link && !linkAfiliadoValido(link)) voltar("O link de afiliado precisa ser um meli.la (ou mercadolivre.com/sec/…). Link comum do produto não vale.");

  // Os dados automáticos são lidos de novo aqui no servidor (não confiamos no que veio do formulário)
  const r = await consultarLoja(url);
  if (!r.ok) return voltar(r.erro);
  const c = r.consulta;
  const a = c.automatico;
  const manual = !a?.precoAtual;

  const precoManual = lerPreco(form.get("preco_atual"));
  const anteriorManual = lerPreco(form.get("preco_anterior"));
  if (manual && !precoManual) voltar("Informe o preço que aparece na loja agora.");
  if (manual && anteriorManual && precoManual && anteriorManual <= precoManual) voltar("O preço anterior precisa ser maior que o atual (ou deixe em branco).");

  const { id } = await criarFicha({
    idProdutoLoja: c.idProdutoLoja,
    urlOriginal: url,
    idCatalogo: c.idCatalogo,
    linkAfiliado: link,
    tituloLoja: a?.tituloLoja ?? textoOuNull(form.get("titulo_loja")),
    tituloCurto: textoOuNull(form.get("titulo_curto"), 120),
    imagem: a?.imagem ?? lerImagem(form.get("imagem")),
    vendedor: a?.vendedor ?? null,
    categoria: lerCategoria(form.get("categoria")),
    observacao: textoOuNull(form.get("observacao"), 200),
    precoAtual: manual ? precoManual : a!.precoAtual,
    precoAnterior: manual ? anteriorManual : a!.precoAnterior,
    moeda: "BRL",
    statusNaLoja: manual ? null : a!.statusNaLoja,
    verificadoEm: new Date(),
    fonte: manual ? "Conferido à mão no painel" : a!.fonte,
  });
  redirect(`/admin/ficha/${id}?ok=${encodeURIComponent("Ficha criada como rascunho.")}`);
}

export default async function NovaOferta({ searchParams }: Props) {
  const { url, erro } = await searchParams;
  const r = url ? await consultarLoja(url) : null;
  const c = r?.ok ? r.consulta : null;
  const existente = c ? await buscarPorProduto(c.idProdutoLoja) : null;
  const a = c?.automatico;
  const manual = c && !a?.precoAtual;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 text-text-default">
      <Link href="/admin" className="text-200 underline">← Ofertas</Link>
      <h1 className="mt-2 text-800 font-bold text-text-brand">Nova oferta</h1>

      <form action="/admin/nova" className={`mt-6 ${caixa} flex flex-col gap-3`}>
        <label className="text-300 font-semibold" htmlFor="url">1. Link ORIGINAL do produto no Mercado Livre</label>
        <p className="text-200 text-text-subtle">Copie da barra do navegador. Não use o meli.la aqui: ele vem no passo 2.</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input id="url" name="url" defaultValue={url} required placeholder="https://www.mercadolivre.com.br/…/p/MLB…" className={campo} />
          <button className={botao}>Ler produto</button>
        </div>
      </form>

      {erro && <div className="mt-4"><Aviso tipo="erro">{erro}</Aviso></div>}
      {r && !r.ok && <div className="mt-4"><Aviso tipo="erro">{r.erro}</Aviso></div>}

      {existente && (
        <div className="mt-4">
          <Aviso>
            Este produto já tem ficha ({existente.estado}).{" "}
            <Link className="underline" href={`/admin/ficha/${existente.id}`}>Abrir a ficha existente</Link>
          </Aviso>
        </div>
      )}

      {c && !existente && (
        <form action={criar} className={`mt-6 ${caixa} flex flex-col gap-4`}>
          <input type="hidden" name="url" value={url} />
          <h2 className="text-500 font-semibold text-text-brand">2. Confira e complete</h2>
          {c.aviso && <Aviso>{c.aviso}</Aviso>}

          {a?.precoAtual ? (
            <div className="flex gap-4 rounded-3xl bg-surface-subtle p-4">
              {a.imagem && <img src={a.imagem} alt="" className="size-24 shrink-0 rounded-2xl object-cover" />}
              <div className="flex flex-col gap-1 text-300">
                <p className="font-semibold text-text-brand">{a.tituloLoja}</p>
                <p>
                  <span className="text-500 font-bold">{preco(a.precoAtual)}</span>
                  {a.precoAnterior && <span className="ml-2 text-text-subtle line-through">{preco(a.precoAnterior)}</span>}
                </p>
                <p className="text-200 text-text-subtle">{a.vendedor} · verificado {dataHora(a.verificadoEm)}</p>
                <p className="text-100 text-text-subtlest">Fonte: {a.fonte}</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-200 text-text-subtle">Copie da página do produto, como aparece agora.</p>
              <Campo rotulo="Título na loja" nome="titulo_loja" valor={a?.tituloLoja ?? ""} />
              <Campo rotulo="Endereço da foto (https://…)" nome="imagem" valor={a?.imagem ?? ""} dica="Na página do produto: botão direito na foto → Copiar endereço da imagem." />
              <div className="grid gap-3 sm:grid-cols-2">
                <Campo rotulo="Preço agora (R$)" nome="preco_atual" obrigatorio={Boolean(manual)} placeholder="67,80" />
                <Campo rotulo="Preço riscado na loja (R$, opcional)" nome="preco_anterior" placeholder="119,90" />
              </div>
            </div>
          )}

          <Campo
            rotulo="Link de afiliado (meli.la)"
            nome="link_afiliado"
            placeholder="https://meli.la/…"
            dica="Gere no painel de Afiliados do Mercado Livre. Pode deixar para depois: sem ele a ficha não publica."
          />
          <Campo rotulo="Título curto para o card (opcional)" nome="titulo_curto" placeholder="Ex.: Dunlop ATP · tubo com 3" />
          <label className="flex flex-col gap-1 text-300">
            <span className="font-semibold">Categoria</span>
            <select name="categoria" className={campo} defaultValue="">
              <option value="">Escolha…</option>
              {categorias.map((cat) => <option key={cat.slug} value={cat.slug}>{cat.nome}</option>)}
            </select>
          </label>
          <Campo rotulo="Observação (opcional)" nome="observacao" placeholder="Ex.: cupom aplicado no carrinho" />

          <button className={botao}>Salvar como rascunho</button>
        </form>
      )}
    </main>
  );
}

function Campo(p: { rotulo: string; nome: string; valor?: string; placeholder?: string; dica?: string; obrigatorio?: boolean }) {
  return (
    <label className="flex flex-col gap-1 text-300">
      <span className="font-semibold">{p.rotulo}</span>
      <input name={p.nome} defaultValue={p.valor} placeholder={p.placeholder} required={p.obrigatorio} className={campo} />
      {p.dica && <span className="text-200 text-text-subtle">{p.dica}</span>}
    </label>
  );
}
