// Ficha de uma oferta: conferir, editar, verificar o preço e decidir (revisar, publicar, rejeitar, pausar).
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
/* eslint-disable @next/next/no-img-element */
import { categorias } from "@/lib/categorias";
import { lerCategoria, lerImagem, lerPreco, textoOuNull } from "@/lib/fichas/formulario";
import { descontoConfiavel, linkAfiliadoValido, pendenciasParaPublicar, podeMudarEstado, ESTADOS, type Destaque, type Estado } from "@/lib/fichas/regras";
import { buscarFicha, editarFicha, mudarEstado, registrarVerificacao, type Edicao } from "@/lib/fichas/repositorio";
import { precoAnteriorValido } from "@/lib/ml/catalogo";
import { lerCatalogo } from "@/lib/ml/servidor";
import { exigirDono } from "@/lib/painel";
import { Aviso, EtiquetaEstado, NOMES_ESTADO, botao, botaoSecundario, caixa, campo, dataHora, preco } from "../../_ui";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Ficha · Painel", robots: { index: false, follow: false } };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; erro?: string }> };

const voltar = (id: string, tipo: "ok" | "erro", msg: string): never =>
  redirect(`/admin/ficha/${id}?${tipo}=${encodeURIComponent(msg)}`);

async function salvar(form: FormData) {
  "use server";
  await exigirDono();
  const id = String(form.get("id"));
  const atual = await buscarFicha(id);
  if (!atual) notFound();
  const link = textoOuNull(form.get("link_afiliado"), 500);
  if (link && !linkAfiliadoValido(link)) voltar(id, "erro", "O link de afiliado precisa ser um meli.la (ou mercadolivre.com/sec/…).");

  const destaque = String(form.get("destaque") ?? "nenhum") as Destaque;
  const e: Edicao = {
    linkAfiliado: link,
    tituloCurto: textoOuNull(form.get("titulo_curto"), 120),
    categoria: lerCategoria(form.get("categoria")),
    observacao: textoOuNull(form.get("observacao"), 200),
    destaque: atual.ficha.estado === "publicada" && ["nenhum", "achado_da_vez", "secundario"].includes(destaque) ? destaque : "nenhum",
  };
  // Ficha sem catálogo: dados da loja são à mão
  if (!atual.ficha.idCatalogo) {
    e.tituloLoja = textoOuNull(form.get("titulo_loja"));
    e.imagem = lerImagem(form.get("imagem"));
    const por = lerPreco(form.get("preco_atual"));
    const de = lerPreco(form.get("preco_anterior"));
    if (!por) voltar(id, "erro", "Informe o preço atual.");
    if (de && por && de <= por) voltar(id, "erro", "O preço anterior precisa ser maior que o atual (ou deixe em branco).");
    e.precoAtual = por;
    e.precoAnterior = de;
    e.verificadoAgora = form.get("conferi") === "on";
  }
  await editarFicha(id, e);
  voltar(id, "ok", "Alterações salvas.");
}

async function verificar(form: FormData) {
  "use server";
  await exigirDono();
  const id = String(form.get("id"));
  const atual = await buscarFicha(id);
  if (!atual) notFound();
  const f = atual.ficha;
  if (!f.idCatalogo) voltar(id, "erro", "Ficha sem catálogo: confira o preço na loja e salve marcando “conferi agora”.");
  const r = await lerCatalogo(f.idCatalogo!, f.idProdutoLoja === f.idCatalogo ? null : f.idProdutoLoja);
  if (!r.ok) {
    await registrarVerificacao(id, "moreno", { ok: false, erro: r.erro });
    voltar(id, "erro", r.erro);
  } else if (!r.dados.oferta) {
    await registrarVerificacao(id, "moreno", { ok: false, erro: "Anúncio não está mais entre as ofertas ativas do catálogo." });
    voltar(id, "erro", "O anúncio não aparece mais entre as ofertas ativas do catálogo. Considere pausar ou expirar.");
  } else {
    const o = r.dados.oferta;
    await registrarVerificacao(id, "moreno", {
      ok: true,
      precoAtual: typeof o.price === "number" ? o.price : null,
      precoAnterior: precoAnteriorValido(o),
      statusNaLoja: "active",
      fonte: `API oficial Mercado Livre · catálogo ${f.idCatalogo} · anúncio ${o.item_id}`,
    });
    voltar(id, "ok", "Preço verificado agora.");
  }
}

async function mudar(form: FormData) {
  "use server";
  await exigirDono();
  const id = String(form.get("id"));
  const para = String(form.get("para")) as Estado;
  if (!ESTADOS.includes(para)) voltar(id, "erro", "Estado inválido.");
  const r = await mudarEstado(id, para, "moreno", textoOuNull(form.get("motivo"), 200));
  if (r.ok) voltar(id, "ok", `Ficha agora está: ${NOMES_ESTADO[para]}.`);
  else voltar(id, "erro", r.motivo);
}

const ROTULO_ACAO: Partial<Record<Estado, string>> = {
  em_revisao: "Enviar para revisão",
  publicada: "Aprovar e publicar",
  rascunho: "Voltar para rascunho",
  rejeitada: "Rejeitar",
  pausada: "Pausar",
  expirada: "Expirar",
};
const PEDE_MOTIVO: Estado[] = ["rejeitada", "pausada", "expirada"];

export default async function FichaPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { ok, erro } = await searchParams;
  const dados = await buscarFicha(id);
  if (!dados) notFound();
  const { ficha: f, diario } = dados;
  const pct = descontoConfiavel(f);
  const falta = pendenciasParaPublicar(f);
  const acoes = ESTADOS.filter((e) => e !== f.estado && ROTULO_ACAO[e]).filter((e) => {
    // mostra só o que o regulamento permite (o motivo é pedido no próprio botão)
    const r = podeMudarEstado(f, e, "moreno", "x");
    return r.ok || (e === "publicada" && r.motivo.startsWith("Falta para publicar"));
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 text-text-default">
      <Link href="/admin" className="text-200 underline">← Ofertas</Link>

      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-700 font-bold text-text-brand">{f.tituloCurto ?? f.tituloLoja ?? f.idProdutoLoja}</h1>
        <EtiquetaEstado estado={f.estado} />
      </div>
      {f.motivo && <p className="mt-1 text-200 text-text-subtle">Motivo: {f.motivo}</p>}

      <div className="mt-4 flex flex-col gap-3">
        {ok && <Aviso tipo="ok">{ok}</Aviso>}
        {erro && <Aviso tipo="erro">{erro}</Aviso>}
      </div>

      {/* Como está agora */}
      <section className={`mt-6 ${caixa} flex flex-col gap-4 sm:flex-row`}>
        {f.imagem ? <img src={f.imagem} alt="" className="size-40 shrink-0 rounded-3xl object-cover" /> : <div className="size-40 shrink-0 rounded-3xl bg-surface-subtle" />}
        <div className="flex min-w-0 flex-col gap-1 text-300">
          <p className="font-semibold">{f.tituloLoja ?? "Sem título da loja"}</p>
          <p>
            <span className="text-600 font-bold text-text-brand">{preco(f.precoAtual)}</span>
            {f.precoAnterior && <span className="ml-2 text-text-subtle line-through">{preco(f.precoAnterior)}</span>}
            {pct && <span className="ml-2 font-semibold">-{pct}%</span>}
          </p>
          <p className="text-200 text-text-subtle">Verificado {dataHora(f.verificadoEm)} · {f.fonte ?? "sem fonte"}</p>
          <p className="text-200 text-text-subtle">{f.vendedor ?? "Vendedor não informado"} · código {f.idProdutoLoja}{f.idCatalogo && ` · catálogo ${f.idCatalogo}`}</p>
          <p className="text-200 break-all">
            <a className="underline" href={f.urlOriginal} target="_blank" rel="noopener noreferrer">Página do produto ↗</a>
            {f.linkAfiliado && <> · <a className="underline" href={f.linkAfiliado} target="_blank" rel="noopener noreferrer">Link de afiliado ↗</a></>}
          </p>
          {f.idCatalogo && (
            <form action={verificar} className="mt-2">
              <input type="hidden" name="id" value={f.id} />
              <button className={botaoSecundario}>Verificar preço agora</button>
            </form>
          )}
        </div>
      </section>

      {/* Decisão */}
      <section className={`mt-6 ${caixa} flex flex-col gap-4`}>
        <h2 className="text-500 font-semibold text-text-brand">Decisão</h2>
        {f.estado !== "publicada" && (
          falta.length ? (
            <div className="text-300">
              <p className="font-semibold">Falta para poder publicar:</p>
              <ul className="mt-1 list-disc pl-6">{falta.map((p) => <li key={p}>{p}</li>)}</ul>
            </div>
          ) : (
            <p className="text-300">✅ Tudo pronto para publicar.</p>
          )
        )}
        <div className="flex flex-col gap-3">
          {acoes.map((para) => (
            <form key={para} action={mudar} className="flex flex-col gap-2 sm:flex-row">
              <input type="hidden" name="id" value={f.id} />
              <input type="hidden" name="para" value={para} />
              {PEDE_MOTIVO.includes(para) && <input name="motivo" required placeholder="Motivo (obrigatório)" className={campo} />}
              <button
                className={para === "publicada" || para === "em_revisao" ? botao : botaoSecundario}
                disabled={para === "publicada" && falta.length > 0}
              >
                {ROTULO_ACAO[para]}
              </button>
            </form>
          ))}
        </div>
        {f.estado === "publicada" && (
          <p className="text-200 text-text-subtle">Por enquanto “publicada” fica só no banco: o site oficial passa a ler as fichas na Etapa 5.</p>
        )}
      </section>

      {/* Edição */}
      <form action={salvar} className={`mt-6 ${caixa} flex flex-col gap-4`}>
        <input type="hidden" name="id" value={f.id} />
        <h2 className="text-500 font-semibold text-text-brand">Editar</h2>
        <Campo rotulo="Link de afiliado (meli.la)" nome="link_afiliado" valor={f.linkAfiliado} placeholder="https://meli.la/…" />
        <Campo rotulo="Título curto para o card" nome="titulo_curto" valor={f.tituloCurto} />
        <label className="flex flex-col gap-1 text-300">
          <span className="font-semibold">Categoria</span>
          <select name="categoria" className={campo} defaultValue={f.categoria ?? ""}>
            <option value="">Escolha…</option>
            {categorias.map((c) => <option key={c.slug} value={c.slug}>{c.nome}</option>)}
          </select>
        </label>
        <Campo rotulo="Observação" nome="observacao" valor={f.observacao} />
        {f.estado === "publicada" && (
          <label className="flex flex-col gap-1 text-300">
            <span className="font-semibold">Destaque no topo do site</span>
            <select name="destaque" className={campo} defaultValue={f.destaque}>
              <option value="nenhum">Nenhum</option>
              <option value="achado_da_vez">Achado da vez (só um por vez)</option>
              <option value="secundario">Destaque secundário</option>
            </select>
          </label>
        )}
        {!f.idCatalogo && (
          <>
            <p className="text-200 text-text-subtle">Produto sem catálogo: estes dados são à mão.</p>
            <Campo rotulo="Título na loja" nome="titulo_loja" valor={f.tituloLoja} />
            <Campo rotulo="Endereço da foto (https://…)" nome="imagem" valor={f.imagem} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Campo rotulo="Preço agora (R$)" nome="preco_atual" valor={f.precoAtual?.toString().replace(".", ",") ?? null} />
              <Campo rotulo="Preço riscado (R$, opcional)" nome="preco_anterior" valor={f.precoAnterior?.toString().replace(".", ",") ?? null} />
            </div>
            <label className="flex items-center gap-2 text-300">
              <input type="checkbox" name="conferi" /> Conferi esses dados na loja agora (atualiza o “verificado em”)
            </label>
          </>
        )}
        <button className={botao}>Salvar alterações</button>
      </form>

      {/* Diário */}
      <section className={`mt-6 ${caixa}`}>
        <h2 className="text-500 font-semibold text-text-brand">Diário</h2>
        <ul className="mt-3 flex flex-col gap-2 text-200">
          {diario.map((d, i) => (
            <li key={i} className="border-t border-border-default pt-2">
              <span className="text-text-subtle">{dataHora(d.quando)} · {d.autor === "moreno" ? "você" : "automação"} · </span>
              {d.resultado === "estado" && <>estado: {d.estadoDe ? NOMES_ESTADO[d.estadoDe] : "—"} → {d.estadoPara ? NOMES_ESTADO[d.estadoPara] : "—"}</>}
              {d.resultado === "ok" && <>verificado, nada mudou</>}
              {d.resultado === "mudou" && <>verificado</>}
              {d.resultado === "erro" && <>❌ {d.erro}</>}
              {d.mudancas.length > 0 && <> · {d.mudancas.join(" · ")}</>}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

function Campo(p: { rotulo: string; nome: string; valor?: string | null; placeholder?: string }) {
  return (
    <label className="flex flex-col gap-1 text-300">
      <span className="font-semibold">{p.rotulo}</span>
      <input name={p.nome} defaultValue={p.valor ?? ""} placeholder={p.placeholder} className={campo} />
    </label>
  );
}
