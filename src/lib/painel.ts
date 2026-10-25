// Regras de acesso ao painel. Só roda no servidor.
import "server-only";
import { redirect, notFound } from "next/navigation";
import { auth, DONO_GITHUB_ID } from "@/auth";

/** Por enquanto o painel só existe fora da produção (versões de teste). */
export const painelHabilitado = () => process.env.VERCEL_ENV !== "production";

/** Confere se quem está logado é o dono. Se não for, manda para a tela de entrar. */
export async function exigirDono() {
  if (!painelHabilitado()) notFound();
  const sessao = await auth();
  if (sessao?.user?.githubId !== DONO_GITHUB_ID) redirect("/admin/entrar");
  return sessao;
}
