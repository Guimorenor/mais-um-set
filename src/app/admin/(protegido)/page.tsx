// Início do painel: fila de revisão, lista de fichas e conexão com o Mercado Livre.
import type { Metadata } from "next";
import Link from "next/link";
/* eslint-disable @next/next/no-img-element */
import { comBanco } from "@/lib/db/conexao";
import { listarMigracoes } from "@/lib/db/migracoes";
import { listarFichas } from "@/lib/fichas/repositorio";
import { ESTADOS, precoVelho, type Estado } from "@/lib/fichas/regras";
import { estadoConexaoML } from "@/lib/ml/servidor";
import { ligarAutomacao, lerAutomacoes, type NomeAutomacao } from "@/lib/automacoes";
import { exigirDono } from "@/lib/painel";
import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { rodarConferencia, rodarGarimpo } from "@/lib/garimpo/servidor";
import { descontoConfiavel } from "@/lib/fichas/regras";

export const maxDuration = 300; // o botão "Rodar agora" pode levar alguns minutos

async function rodarAgora(form: FormData) {
  "use server";
  await exigirDono();
  const tarefa = String(form.get("tarefa"));
  const resultado = tarefa === "garimpo" ? await rodarGarimpo() : tarefa === "conferencia" ? await rodarConferencia() : "tarefa desconhecida";
  redirect(`/admin?ok=${encodeURIComponent(`${tarefa === "garimpo" ? "Garimpo" : "Conferência"}: ${resultado}`)}`);
}

async function salvarDescontoMinimo(form: FormData) {
  "use server";
  await exigirDono();
  const n = Math.round(Number(form.get("desconto_minimo")));
  if (!(n >= 1 && n <= 90)) redirect(`/admin?erro=${encodeURIComponent("Desconto mínimo precisa ser de 1 a 90%.")}`);
  await comBanco((pool) => pool.query("UPDATE configuracoes SET valor = $1 WHERE chave = 'desconto_minimo'", [String(n)]));
  redirect(`/admin?ok=${encodeURIComponent(`Desconto mínimo agora é ${n}%.`)}`);
}

async function alternarBusca(form: FormData) {
  "use server";
  await exigirDono();
  await comBanco((pool) => pool.query("UPDATE buscas SET ativa = NOT ativa WHERE id = $1", [Number(form.get("id"))]));
  redirect("/admin");
}

async function alternar(form: FormData) {
  "use server";
  await exigirDono();
  const nome = String(form.get("nome")) as NomeAutomacao;
  if (!(nome in SOBRE)) return;
  await ligarAutomacao(nome, form.get("ativa") === "1");
  revalidateTag("vitrine");
  redirect("/admin");
}

const SOBRE: Record<NomeAutomacao, { titulo: string; texto: string; rodar?: boolean }> = {
  garimpo: {
    titulo: "Garimpo",
    texto: "Todo dia procura produtos no catálogo do Mercado Livre (buscas abaixo) e cria fichas quando o desconto é real e ≥ o mínimo.",
    rodar: true,
  },
  conferencia: {
    titulo: "Conferência de preços",
    texto: "Todo dia confere as ofertas no ar: pausa quando o desconto acaba ou o anúncio some, republica quando volta.",
    rodar: true,
  },
  publicacao_automatica: {
    titulo: "Publicar sozinho",
    texto: "Fichas do garimpo com link de afiliado e desconto ≥ mínimo vão direto para o site. Desligado: ficam na fila para você aprovar.",
  },
  link_por_etiqueta: {
    titulo: "Montar o link de afiliado sozinho (etiqueta)",
    texto: "⚠️ Ligue só depois do teste de clique no painel de Afiliados. Desligado: as fichas do garimpo esperam você colar o meli.la.",
  },
  destaque_automatico: {
    titulo: "Destaque automático",
    texto: "A oferta publicada com maior desconto confirmado vira o Achado da vez; as 2 seguintes, destaques secundários.",
  },
  recorte_aprovacao_automatica: {
    titulo: "Aprovar o recorte sozinho",
    texto: "O recorte pronto já vai para o site. Se não gostar de algum, volte para a foto original na ficha.",
  },
  recorte: {
    titulo: "Recorte das fotos dos destaques",
    texto: "A cada 3 h, recorta o fundo das fotos dos 3 destaques do topo (máx. 5 por vez).",
  },
};
const ORDEM: NomeAutomacao[] = [
  "garimpo", "conferencia", "publicacao_automatica", "link_por_etiqueta", "destaque_automatico", "recorte", "recorte_aprovacao_automatica",
];
import { Aviso, EtiquetaEstado, NOMES_ESTADO, botao, botaoSecundario, caixa, dataHora, preco } from "./_ui";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Painel", robots: { index: false, follow: false } };

type Props = { searchParams: Promise<{ estado?: string; erro?: string; ok?: string }> };

const FILTROS = ["fila", "falta_link", ...ESTADOS, "todas"] as const;

export default async function Painel({ searchParams }: Props) {
  const { estado: filtroBruto, erro, ok } = await searchParams;
  const filtro = (FILTROS as readonly string[]).includes(filtroBruto ?? "") ? filtroBruto! : "fila";

  const pendentes = (await comBanco(listarMigracoes)).filter((m) => !m.aplicadaEm);
  if (pendentes.length) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10 text-text-default">
        <h1 className="text-800 font-bold text-text-brand">Painel</h1>
        <div className="mt-6">
          <Aviso>
            O banco precisa de uma atualização ({pendentes.map((m) => m.nome).join(", ")}).{" "}
            <Link className="underline" href="/admin/prova-banco">Abrir a página do banco e aplicar</Link>.
          </Aviso>
        </div>
      </main>
    );
  }

  const [fichas, ml, automacoesBrutas, extras] = await Promise.all([
    listarFichas(),
    estadoConexaoML(),
    lerAutomacoes(),
    comBanco(async (pool) => {
      const temGarimpo = Boolean((await pool.query("SELECT to_regclass('buscas') AS t")).rows[0].t);
      if (!temGarimpo) return null;
      const b = await pool.query("SELECT id, termo, categoria, ativa FROM buscas ORDER BY id");
      const d = await pool.query("SELECT valor FROM configuracoes WHERE chave = 'desconto_minimo'");
      return { buscas: b.rows as { id: number; termo: string; categoria: string; ativa: boolean }[], descontoMinimo: Number(d.rows[0]?.valor ?? 10) };
    }),
  ]);
  const automacoes = [...automacoesBrutas].sort((a, b) => ORDEM.indexOf(a.nome) - ORDEM.indexOf(b.nome));
  const faltaLink = fichas.filter((f) => (f.estado === "rascunho" || f.estado === "em_revisao") && !f.linkAfiliado);
  const contagem = Object.fromEntries(ESTADOS.map((e) => [e, fichas.filter((f) => f.estado === e).length])) as Record<Estado, number>;
  const visiveis =
    filtro === "falta_link"
      ? faltaLink
      : fichas.filter((f) =>
          filtro === "todas" ? true : filtro === "fila" ? f.estado === "rascunho" || f.estado === "em_revisao" : f.estado === filtro,
        );
  const nomeFiltro = (f: string) =>
    f === "fila"
      ? `Fila (${contagem.rascunho + contagem.em_revisao})`
      : f === "falta_link"
        ? `Falta meli.la (${faltaLink.length})`
        : f === "todas"
          ? `Todas (${fichas.length})`
          : `${NOMES_ESTADO[f as Estado]} (${contagem[f as Estado]})`;

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 text-text-default">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-200 font-semibold text-text-subtlest uppercase">Painel · só em preview</p>
          <h1 className="mt-1 text-800 font-bold text-text-brand">Ofertas</h1>
        </div>
        <Link href="/admin/nova" className={botao}>+ Nova oferta</Link>
      </div>

      {erro && <div className="mt-6"><Aviso tipo="erro">{erro}</Aviso></div>}
      {ok && <div className="mt-6"><Aviso tipo="ok">{ok}</Aviso></div>}

      <section className={`mt-6 ${caixa} flex flex-wrap items-center justify-between gap-3 py-4`}>
        <p className="text-300">
          Catálogo do Mercado Livre: <strong>passe do próprio app</strong> (renova sozinho, não precisa conectar).
          <br />
          <span className="text-200 text-text-subtle">Conta conectada (reserva):{" "}
          {!ml.conectado
            ? "não conectada."
            : ml.valida
              ? `conectado · acesso vale até ${dataHora(ml.expiraEm)}${ml.renovavel ? " (renova sozinho)" : ""}`
              : ml.renovavel
                ? "conectado · renova sozinho na próxima consulta"
                : "acesso expirado · reconecte"}
          </span>
        </p>
        <a href="/api/ml/autorizar?para=painel" className={botaoSecundario}>
          {ml.conectado ? "Reconectar" : "Conectar Mercado Livre"}
        </a>
      </section>

      {automacoes.length > 0 && (
        <section className={`mt-4 ${caixa} flex flex-col gap-3 py-4`}>
          <h2 className="text-400 font-semibold text-text-brand">Automações</h2>
          {automacoes.map((a) => (
            <div key={a.nome} className="flex flex-wrap items-center justify-between gap-3 border-t border-border-default pt-3">
              <div className="min-w-0 flex-1 text-200">
                <p className="text-300 font-semibold">
                  {a.ativa ? "🟢" : "⏸️"} {SOBRE[a.nome]?.titulo ?? a.nome}
                </p>
                <p className="text-text-subtle">{SOBRE[a.nome]?.texto}</p>
                {(a.nome === "recorte" || SOBRE[a.nome]?.rodar) && (
                  <p className="text-text-subtlest">
                    Última execução: {a.ultimaExecucao ? `${dataHora(a.ultimaExecucao)} · ${a.ultimoResultado ?? ""}` : "ainda não rodou"}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                {SOBRE[a.nome]?.rodar && a.ativa && (
                  <form action={rodarAgora}>
                    <input type="hidden" name="tarefa" value={a.nome} />
                    <button className={botaoSecundario}>Rodar agora</button>
                  </form>
                )}
                <form action={alternar}>
                  <input type="hidden" name="nome" value={a.nome} />
                  <input type="hidden" name="ativa" value={a.ativa ? "0" : "1"} />
                  <button className={botaoSecundario}>{a.ativa ? "Pausar" : "Ligar"}</button>
                </form>
              </div>
            </div>
          ))}
        </section>
      )}

      {extras && (
        <section className={`mt-4 ${caixa} flex flex-col gap-3 py-4`}>
          <h2 className="text-400 font-semibold text-text-brand">Garimpo: regras</h2>
          <form action={salvarDescontoMinimo} className="flex flex-wrap items-center gap-2 text-300">
            <label htmlFor="dm">Desconto mínimo para entrar e publicar:</label>
            <input id="dm" name="desconto_minimo" type="number" min={1} max={90} defaultValue={extras.descontoMinimo} className="w-20 rounded-xl border border-border-input bg-surface-default px-3 py-2" />
            <span>%</span>
            <button className={botaoSecundario}>Salvar</button>
          </form>
          <p className="text-200 text-text-subtle">Buscas (clique para ligar/desligar):</p>
          <div className="flex flex-wrap gap-2">
            {extras.buscas.map((b) => (
              <form key={b.id} action={alternarBusca}>
                <input type="hidden" name="id" value={b.id} />
                <button
                  className={`rounded-full px-3 py-1.5 text-200 font-semibold ${b.ativa ? "bg-action-accent-default text-text-on-accent" : "bg-surface-subtle text-text-subtlest line-through"}`}
                  title={b.categoria}
                >
                  {b.termo}
                </button>
              </form>
            ))}
          </div>
        </section>
      )}

      <nav className="mt-6 flex flex-wrap gap-2" aria-label="Filtrar por estado">
        {FILTROS.map((f) => (
          <Link
            key={f}
            href={`/admin?estado=${f}`}
            aria-current={f === filtro ? "true" : undefined}
            className={`rounded-full px-3 py-1.5 text-200 font-semibold ${f === filtro ? "bg-action-primary-default text-text-on-brand" : "bg-surface-subtle text-text-subtle"}`}
          >
            {nomeFiltro(f)}
          </Link>
        ))}
      </nav>

      <section className="mt-4 flex flex-col gap-2">
        {visiveis.length === 0 && (
          <p className="py-8 text-center text-300 text-text-subtle">
            {filtro === "falta_link" ? (
              "Nenhuma ficha esperando link de afiliado."
            ) : filtro === "fila" ? (
              fichas.length ? "Nenhuma oferta esperando revisão." : <Link className="underline" href="/admin/nova">Cadastre a primeira oferta</Link>
            ) : (
              "Nada aqui."
            )}
          </p>
        )}
        {visiveis.map((f) => (
          <Link
            key={f.id}
            href={`/admin/ficha/${f.id}`}
            className="flex items-center gap-4 rounded-3xl border border-border-default bg-surface-default p-3 transition-colors hover:border-border-brand"
          >
            <span className="size-16 shrink-0 overflow-hidden rounded-2xl bg-surface-subtle">
              {f.imagem && <img src={f.imagem} alt="" className="size-full object-cover" />}
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="truncate text-300 font-semibold text-text-brand">{f.tituloCurto ?? f.tituloLoja ?? f.idProdutoLoja}</span>
              <span className="text-200 text-text-subtle">
                {preco(f.precoAtual)} · verificado {dataHora(f.verificadoEm)}
                {precoVelho(f) && f.estado === "publicada" && " · ⚠️ preço velho"}
                {descontoConfiavel(f) && ` · -${descontoConfiavel(f)}%`}
                {!f.linkAfiliado && " · falta meli.la"}
                {f.origem === "garimpo" && " · 🤖 garimpo"}
              </span>
            </span>
            <EtiquetaEstado estado={f.estado} />
          </Link>
        ))}
      </section>

      <p className="mt-10 text-200 text-text-subtlest">
        Ferramentas: <Link className="underline" href="/admin/prova-banco">banco</Link> ·{" "}
        <Link className="underline" href="/admin/prova-ml">prova da API</Link>
      </p>
    </main>
  );
}
