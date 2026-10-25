// Pecinhas visuais do painel (só usadas aqui dentro).
import type { Estado } from "@/lib/fichas/regras";
import { formatarPreco } from "@/lib/ofertas";

export const NOMES_ESTADO: Record<Estado, string> = {
  rascunho: "Rascunho",
  em_revisao: "Em revisão",
  publicada: "Publicada",
  pausada: "Pausada",
  expirada: "Expirada",
  rejeitada: "Rejeitada",
};

export function EtiquetaEstado({ estado }: { estado: Estado }) {
  const cor =
    estado === "publicada" ? "bg-action-accent-default text-text-on-accent"
    : estado === "em_revisao" ? "bg-action-primary-default text-text-on-brand"
    : "bg-surface-subtle text-text-subtle";
  return <span className={`rounded-full px-2 py-0.5 text-100 font-semibold whitespace-nowrap ${cor}`}>{NOMES_ESTADO[estado]}</span>;
}

export const preco = (v: number | null) => (v === null ? "—" : formatarPreco(v));
export const dataHora = (d: Date | null) => (d ? d.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" }) : "—");

export const caixa = "rounded-[32px] border border-border-default bg-surface-default p-6";
export const campo = "w-full rounded-2xl border border-border-input bg-surface-default px-4 py-3 text-300";
export const botao = "inline-flex h-11 items-center justify-center rounded-full bg-action-primary-default px-5 text-300 font-semibold text-text-on-brand disabled:opacity-50";
export const botaoSecundario = "inline-flex h-11 items-center justify-center rounded-full border border-border-default px-5 text-300 font-semibold";

export function Aviso({ tipo = "info", children }: { tipo?: "info" | "erro" | "ok"; children: React.ReactNode }) {
  const icone = tipo === "erro" ? "❌" : tipo === "ok" ? "✅" : "⚠️";
  return <p className="rounded-2xl bg-surface-subtle p-4 text-300">{icone} {children}</p>;
}
