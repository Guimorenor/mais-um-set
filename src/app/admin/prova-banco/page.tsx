// Prova do banco (Etapa 4, parte 2). Só existe em preview com ML_PROVA_ATIVA=1.
// Mostra se o banco responde e quais migrações já rodaram; o botão aplica as pendentes.
import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { comBanco, variavelDoBanco } from "@/lib/db/conexao";
import { aplicarPendentes, listarMigracoes, type Migracao } from "@/lib/db/migracoes";
import { provaHabilitada } from "@/lib/ml/prova";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Prova · Banco", robots: { index: false, follow: false } };

type Props = { searchParams: Promise<{ ok?: string; erro?: string }> };

async function aplicar() {
  "use server";
  if (!provaHabilitada()) notFound();
  let destino: string;
  try {
    const feitas = await comBanco(aplicarPendentes);
    destino = `/admin/prova-banco?ok=${encodeURIComponent(feitas.length ? feitas.join(", ") : "nada pendente")}`;
  } catch (e) {
    destino = `/admin/prova-banco?erro=${encodeURIComponent(e instanceof Error ? e.message : String(e))}`;
  }
  redirect(destino);
}

/** Mensagem do erro + a causa por trás (sem mostrar endereço nem senha do banco). */
function descreverErro(e: unknown): string {
  if (!(e instanceof Error)) return String(e);
  const causa = e.cause instanceof Error ? ` · causa: ${e.cause.message}` : "";
  return `${e.message}${causa}`.replace(/postgres(ql)?:\/\/\S+/gi, "[endereço oculto]");
}

type Estado = {
  agora: string;
  versao: string;
  migracoes: Migracao[];
  tabelas: string[];
  fichas: number | null;
};

export default async function ProvaBanco({ searchParams }: Props) {
  if (!provaHabilitada()) notFound();
  const { ok, erro } = await searchParams;
  const variavel = variavelDoBanco();

  let estado: Estado | null = null;
  let falha: string | null = null;
  if (variavel) {
    try {
      estado = await comBanco(async (pool) => {
        const { rows } = await pool.query<{ agora: Date; versao: string }>("SELECT now() AS agora, version() AS versao");
        const migracoes = await listarMigracoes(pool);
        const t = await pool.query<{ tablename: string }>("SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY 1");
        const tabelas = t.rows.map((r) => r.tablename);
        const fichas = tabelas.includes("fichas")
          ? Number((await pool.query<{ n: string }>("SELECT count(*) AS n FROM fichas")).rows[0].n)
          : null;
        return {
          agora: rows[0].agora.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }),
          versao: rows[0].versao.split(" ").slice(0, 2).join(" "),
          migracoes,
          tabelas,
          fichas,
        };
      });
    } catch (e) {
      falha = descreverErro(e);
    }
  }
  const pendentes = estado?.migracoes.filter((m) => !m.aplicadaEm).length ?? 0;

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 text-text-default">
      <p className="text-200 font-semibold text-text-subtlest uppercase">Prova técnica · só em preview</p>
      <h1 className="mt-1 text-800 font-bold text-text-brand">Banco de ofertas</h1>

      {ok && <p className="mt-6 rounded-2xl bg-surface-subtle p-4 text-300">✅ Migrações aplicadas: {ok}</p>}
      {erro && <p className="mt-6 rounded-2xl bg-surface-subtle p-4 text-300">❌ {erro}</p>}

      <section className="mt-8 rounded-[32px] border border-border-default bg-surface-default p-6">
        <h2 className="text-500 font-semibold text-text-brand">1. Conexão</h2>
        <ul className="mt-3 space-y-1 text-300">
          <li>{variavel ? "✅" : "❌"} Endereço do banco {variavel ? <>configurado (<code>{variavel}</code>)</> : "faltando"}</li>
          {estado && <li>✅ Banco respondeu às {estado.agora} · {estado.versao}</li>}
          {falha && <li>❌ Banco não respondeu: {falha}</li>}
        </ul>
      </section>

      {estado && (
        <section className="mt-6 rounded-[32px] border border-border-default bg-surface-default p-6">
          <h2 className="text-500 font-semibold text-text-brand">2. Migrações (plantas do banco)</h2>
          <table className="mt-3 w-full text-left text-300">
            <tbody>
              {estado.migracoes.map((m) => (
                <tr key={m.nome} className="border-t border-border-default">
                  <td className="py-2 pr-4"><code>{m.nome}</code></td>
                  <td className="py-2">
                    {m.aplicadaEm
                      ? `✅ aplicada em ${m.aplicadaEm.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`
                      : "⏳ pendente"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {pendentes > 0 ? (
            <form action={aplicar} className="mt-4">
              <button className="h-12 rounded-full bg-action-primary-default px-6 text-300 font-semibold text-text-on-brand">
                Aplicar {pendentes} migração(ões) pendente(s)
              </button>
            </form>
          ) : (
            <p className="mt-4 text-300">Tudo aplicado. Nada pendente.</p>
          )}
        </section>
      )}

      {estado && (
        <section className="mt-6 rounded-[32px] border border-border-default bg-surface-default p-6">
          <h2 className="text-500 font-semibold text-text-brand">3. O que existe no banco</h2>
          <p className="mt-3 text-300">Tabelas: {estado.tabelas.length ? estado.tabelas.join(", ") : "nenhuma ainda"}</p>
          {estado.fichas !== null && <p className="mt-1 text-300">Fichas cadastradas: {estado.fichas}</p>}
        </section>
      )}
    </main>
  );
}
