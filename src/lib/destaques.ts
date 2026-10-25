// Escolha dos destaques do topo do site (puro, com teste).
//  - automático: "Achado da vez" = maior desconto confirmado pela loja; os 2 seguintes viram secundários.
//    Empate: quem tem foto recortada aprovada vem antes; depois, o preço verificado mais recentemente.
//  - manual: vale o que você marcou em cada ficha.
import { desconto, type Oferta } from "./ofertas.ts";

export type Candidata = { oferta: Oferta; destaqueManual: string; temRecorte: boolean };

export function escolherDestaques(lista: Candidata[], automatico: boolean): { achado: Oferta | null; secundarios: Oferta[] } {
  if (!automatico) {
    return {
      achado: lista.find((c) => c.destaqueManual === "achado_da_vez")?.oferta ?? null,
      secundarios: lista.filter((c) => c.destaqueManual === "secundario").slice(0, 2).map((c) => c.oferta),
    };
  }
  const ordenada = [...lista].sort((a, b) => {
    const da = desconto(a.oferta) ?? -1;
    const db = desconto(b.oferta) ?? -1;
    if (db !== da) return db - da;
    if (a.temRecorte !== b.temRecorte) return a.temRecorte ? -1 : 1;
    return b.oferta.verificadoEm.localeCompare(a.oferta.verificadoEm);
  });
  return { achado: ordenada[0]?.oferta ?? null, secundarios: ordenada.slice(1, 3).map((c) => c.oferta) };
}
