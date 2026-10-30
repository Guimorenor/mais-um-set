// Chama o estagiário de imagens (GitHub Actions) NA HORA, sem esperar o relógio de 3 h.
// Usa uma chave do GitHub com permissão só de "Actions" neste repositório (GITHUB_ESTAGIARIO_TOKEN).
// Se a chave não existir, não faz nada: o relógio de 3 h continua valendo.
// Várias chamadas seguidas não duplicam trabalho: o GitHub enfileira no máximo uma execução.
import "server-only";
import { waitUntil } from "@vercel/functions";

const REPO = "Guimorenor/mais-um-set";
const WORKFLOW = "recorte.yml";

export function chamarEstagiario(motivo: string) {
  const token = process.env.GITHUB_ESTAGIARIO_TOKEN;
  if (!token) return;
  waitUntil(
    fetch(`https://api.github.com/repos/${REPO}/actions/workflows/${WORKFLOW}/dispatches`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" },
      body: JSON.stringify({ ref: "main" }),
      signal: AbortSignal.timeout(10_000),
    })
      .then((r) => {
        if (!r.ok) console.error("[estagiario] GitHub recusou", r.status, motivo);
      })
      .catch((e) => console.error("[estagiario]", e instanceof Error ? e.message : e)),
  );
}
