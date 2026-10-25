// Início do painel. As telas de cadastro e fila de revisão entram na Parte 4.
import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Painel", robots: { index: false, follow: false } };

export default function Painel() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10 text-text-default">
      <p className="text-200 font-semibold text-text-subtlest uppercase">Painel · só em preview</p>
      <h1 className="mt-1 text-800 font-bold text-text-brand">Mais um Set</h1>
      <p className="mt-4 text-300">✅ Você entrou. Só a sua conta do GitHub passa desta porta.</p>
      <ul className="mt-6 space-y-2 text-300">
        <li><Link className="underline" href="/admin/prova-banco">Prova do banco</Link></li>
        <li><Link className="underline" href="/admin/prova-ml">Prova da API do Mercado Livre</Link></li>
      </ul>
    </main>
  );
}
