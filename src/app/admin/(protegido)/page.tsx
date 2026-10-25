// Início do painel: fila de revisão, lista de fichas e conexão com o Mercado Livre.
import type { Metadata } from "next";
import Link from "next/link";
/* eslint-disable @next/next/no-img-element */
import { comBanco } from "@/lib/db/conexao";
import { listarMigracoes } from "@/lib/db/migracoes";
import { listarFichas } from "@/lib/fichas/repositorio";
import { ESTADOS, precoVelho, type Estado } from "@/lib/fichas/regras";
import { estadoConexaoML } from "@/lib/ml/servidor";
import { Aviso, EtiquetaEstado, NOMES_ESTADO, botao, botaoSecundario, caixa, dataHora, preco } from "./_ui";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Painel", robots: { index: false, follow: false } };

type Props = { searchParams: Promise<{ estado?: string; erro?: string }> };

const FILTROS = ["fila", ...ESTADOS, "todas"] as const;

export default async function Painel({ searchParams }: Props) {
  const { estado: filtroBruto, erro } = await searchParams;
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

  const [fichas, ml] = await Promise.all([listarFichas(), estadoConexaoML()]);
  const contagem = Object.fromEntries(ESTADOS.map((e) => [e, fichas.filter((f) => f.estado === e).length])) as Record<Estado, number>;
  const visiveis = fichas.filter((f) =>
    filtro === "todas" ? true : filtro === "fila" ? f.estado === "rascunho" || f.estado === "em_revisao" : f.estado === filtro,
  );
  const nomeFiltro = (f: string) =>
    f === "fila" ? `Fila (${contagem.rascunho + contagem.em_revisao})` : f === "todas" ? `Todas (${fichas.length})` : `${NOMES_ESTADO[f as Estado]} (${contagem[f as Estado]})`;

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

      <section className={`mt-6 ${caixa} flex flex-wrap items-center justify-between gap-3 py-4`}>
        <p className="text-300">
          Mercado Livre:{" "}
          {!ml.conectado
            ? "não conectado (o catálogo pode funcionar mesmo assim; conecte se a consulta pedir login)."
            : ml.valida
              ? `conectado · acesso vale até ${dataHora(ml.expiraEm)}${ml.renovavel ? " (renova sozinho)" : ""}`
              : ml.renovavel
                ? "conectado · renova sozinho na próxima consulta"
                : "acesso expirado · reconecte"}
        </p>
        <a href="/api/ml/autorizar?para=painel" className={botaoSecundario}>
          {ml.conectado ? "Reconectar" : "Conectar Mercado Livre"}
        </a>
      </section>

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
            {filtro === "fila" ? (
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
                {!f.linkAfiliado && " · sem link de afiliado"}
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
