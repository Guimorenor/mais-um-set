// Tela de entrar no painel (a única parte de /admin aberta sem login).
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { signIn } from "@/auth";
import { painelHabilitado } from "@/lib/painel";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Entrar · Painel", robots: { index: false, follow: false } };

type Props = { searchParams: Promise<{ error?: string }> };

export default async function Entrar({ searchParams }: Props) {
  if (!painelHabilitado()) notFound();
  const { error } = await searchParams;
  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 px-4 py-16 text-text-default">
      <p className="text-200 font-semibold text-text-subtlest uppercase">Painel · só em preview</p>
      <h1 className="text-800 font-bold text-text-brand">Entrar</h1>
      {error && (
        <p className="rounded-2xl bg-surface-subtle p-4 text-300">
          {error === "AccessDenied" ? "❌ Essa conta do GitHub não tem acesso ao painel." : `❌ Não deu para entrar (${error}).`}
        </p>
      )}
      {error === "Configuration" && (
        <ul className="rounded-2xl bg-surface-subtle p-4 text-200">
          <li className="font-semibold">Chaves do login no cofre da Vercel (só mostra se existem):</li>
          {["AUTH_SECRET", "AUTH_GITHUB_ID", "AUTH_GITHUB_SECRET"].map((nome) => (
            <li key={nome}>{process.env[nome] ? "✅" : "❌"} <code>{nome}</code></li>
          ))}
        </ul>
      )}
      <form
        action={async () => {
          "use server";
          await signIn("github", { redirectTo: "/admin" });
        }}
      >
        <button className="h-12 w-full rounded-full bg-action-primary-default px-6 text-300 font-semibold text-text-on-brand">
          Entrar com GitHub
        </button>
      </form>
    </main>
  );
}
