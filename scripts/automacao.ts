// Roda o garimpo ou a conferência FORA do site, nas máquinas do GitHub (.github/workflows/automacoes.yml).
// Uso: node --conditions=react-server --import tsx scripts/automacao.ts garimpo|conferencia|tudo
// Mesmo código do painel (src/lib/garimpo/servidor.ts), mesmas regras e limites.
import { rodarConferencia, rodarGarimpo } from "@/lib/garimpo/servidor";

const tarefa = process.argv[2] ?? "tudo";

async function principal() {
  if (!["garimpo", "conferencia", "tudo"].includes(tarefa)) throw new Error(`tarefa desconhecida: ${tarefa}`);
  // conferência primeiro: tira do ar o que acabou antes de buscar novidades
  if (tarefa === "conferencia" || tarefa === "tudo") console.log("Conferência:", await rodarConferencia());
  if (tarefa === "garimpo" || tarefa === "tudo") console.log("Garimpo:", await rodarGarimpo());
}

principal()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Falhou:", e instanceof Error ? e.message : e);
    process.exit(1);
  });
