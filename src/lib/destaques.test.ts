import { test } from "node:test";
import assert from "node:assert/strict";
import { escolherDestaques, type Candidata } from "./destaques.ts";
import { decidirEnquadramento } from "./ofertas.ts";

test("enquadramento: ajuste da ficha manda; senão cena preenche e fundo liso fica inteira", () => {
  assert.equal(decidirEnquadramento("cena", "auto"), "preencher");
  assert.equal(decidirEnquadramento("fundo_liso", "auto"), "inteira");
  assert.equal(decidirEnquadramento(null, null), "inteira"); // sem análise: nunca corta
  assert.equal(decidirEnquadramento("cena", "inteira"), "inteira");
  assert.equal(decidirEnquadramento("fundo_liso", "preencher"), "preencher");
});

const c = (id: string, por: number, de: number | null, extra: Partial<Candidata> = {}, verificado = "2026-10-25T10:00:00Z"): Candidata => ({
  oferta: { id, titulo: id, categoria: "bolinhas", loja: "Mercado Livre", imagem: "x", precoPor: por, precoDe: de, link: "l", verificadoEm: verificado },
  destaqueManual: "nenhum",
  temRecorte: false,
  ...extra,
});

test("automático: maior desconto confirmado vira o achado, os dois seguintes secundários", () => {
  const r = escolherDestaques([c("a", 90, 100), c("b", 50, 100), c("c", 70, 100), c("d", 10, null)], true);
  assert.equal(r.achado?.id, "b");
  assert.deepEqual(r.secundarios.map((o) => o.id), ["c", "a"]);
});

test("automático: sem desconto ainda escolhe (mais recente), sem inventar desconto", () => {
  const r = escolherDestaques([c("velha", 10, null, {}, "2026-10-24T10:00:00Z"), c("nova", 10, null, {}, "2026-10-25T10:00:00Z")], true);
  assert.equal(r.achado?.id, "nova");
});

test("automático: empate de desconto → quem tem recorte aprovado", () => {
  const r = escolherDestaques([c("sem", 50, 100), c("com", 50, 100, { temRecorte: true })], true);
  assert.equal(r.achado?.id, "com");
});

test("manual: vale o que foi marcado na ficha", () => {
  const r = escolherDestaques([c("a", 50, 100), c("b", 90, 100, { destaqueManual: "achado_da_vez" }), c("s", 1, 2, { destaqueManual: "secundario" })], false);
  assert.equal(r.achado?.id, "b");
  assert.deepEqual(r.secundarios.map((o) => o.id), ["s"]);
  assert.equal(escolherDestaques([], true).achado, null);
});
