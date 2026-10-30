// Chama as automações que rodam nas máquinas do GitHub (GitHub Actions) NA HORA:
//  - recorte.yml: estagiário de imagens (recorte e enquadramento)
//  - automacoes.yml: garimpo e conferência (rodam lá porque levam minutos)
// Usa uma chave do GitHub com permissão só de "Actions" neste repositório (GITHUB_ESTAGIARIO_TOKEN).
// Sem a chave, não faz nada: os relógios do GitHub continuam valendo.
// Chamadas seguidas não duplicam trabalho: o GitHub enfileira no máximo uma execução de cada.
import "server-only";
import { after } from "next/server";

const REPO = "Guimorenor/mais-um-set";

export async function dispararWorkflow(arquivo: string, inputs?: Record<string, string>): Promise<boolean> {
  const token = process.env.GITHUB_ESTAGIARIO_TOKEN;
  if (!token) return false;
  try {
    const r = await fetch(`https://api.github.com/repos/${REPO}/actions/workflows/${arquivo}/dispatches`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" },
      body: JSON.stringify({ ref: "main", ...(inputs ? { inputs } : {}) }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!r.ok) console.error("[github] recusou", arquivo, r.status);
    return r.ok;
  } catch (e) {
    console.error("[github]", e instanceof Error ? e.message : e);
    return false;
  }
}

/** Estagiário de imagens, sem atrasar a resposta da página. */
export function chamarEstagiario(motivo: string) {
  if (process.env.SEM_DISPARO === "1") return; // dentro das próprias automações do GitHub: elas já chamam as imagens no fim
  const tarefa = () => dispararWorkflow("recorte.yml").then((ok) => void (ok || console.error("[estagiario] não chamado:", motivo)));
  try {
    after(tarefa);
  } catch {
    void tarefa();
  }
}
