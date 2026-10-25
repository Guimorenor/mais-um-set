import { test } from "node:test";
import assert from "node:assert/strict";
import { escolherOferta, precoAnteriorValido, type OfertaCatalogo } from "./catalogo.ts";

const o = (item_id: string, price: number | null, original_price: number | null = null, currency_id = "BRL"): OfertaCatalogo => ({
  item_id, price, original_price, currency_id, seller_id: 1,
});
const lista = [o("MLB1", 76.63, 79), o("MLB2", 65.7, 69.9), o("MLB3", 67.8, 119.9), o("MLB4", null), o("MLB5", 10, null, "USD")];

test("usa exatamente o anúncio da URL quando ele está na lista", () => {
  const r = escolherOferta(lista, "mlb3");
  assert.equal(r.oferta?.item_id, "MLB3");
  assert.equal(r.criterio, "anuncio_da_url");
});

test("anúncio da URL fora da lista: não inventa outro", () => {
  assert.deepEqual(escolherOferta(lista, "MLB999"), { oferta: null, criterio: null });
});

test("sem anúncio na URL: menor preço válido em reais", () => {
  const r = escolherOferta(lista, null);
  assert.equal(r.oferta?.item_id, "MLB2");
  assert.equal(r.criterio, "menor_preco");
  assert.deepEqual(escolherOferta([], null), { oferta: null, criterio: null });
});

test("preço anterior só quando maior que o atual", () => {
  assert.equal(precoAnteriorValido({ price: 67.8, original_price: 119.9 }), 119.9);
  assert.equal(precoAnteriorValido({ price: 67.8, original_price: 67.8 }), null);
  assert.equal(precoAnteriorValido({ price: 67.8, original_price: null }), null);
});
