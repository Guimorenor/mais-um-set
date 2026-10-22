// Teste automático: `npm test`
import { test } from "node:test";
import assert from "node:assert/strict";
import { lerIdMercadoLivre } from "./ids.ts";

test("página de anúncio", () => {
  assert.deepEqual(
    lerIdMercadoLivre("https://produto.mercadolivre.com.br/MLB-4123456789-raquete-head-extreme-pro-2026-_JM"),
    { tipo: "anuncio", id: "MLB4123456789" },
  );
});

test("página de catálogo", () => {
  assert.deepEqual(
    lerIdMercadoLivre("https://www.mercadolivre.com.br/raquete-head-extreme-pro-2026/p/MLB41234567"),
    { tipo: "catalogo", id: "MLB41234567" },
  );
});

test("catálogo com anúncio escolhido na URL", () => {
  assert.deepEqual(
    lerIdMercadoLivre("https://www.mercadolivre.com.br/raquete/p/MLB41234567?pdp_filters=item_id:MLB4999999999"),
    { tipo: "anuncio", id: "MLB4999999999" },
  );
  assert.deepEqual(
    lerIdMercadoLivre("https://www.mercadolivre.com.br/raquete/p/MLB41234567#wid=MLB4888888888&sid=search"),
    { tipo: "anuncio", id: "MLB4888888888" },
  );
});

test("link encurtado meli.la é recusado com explicação", () => {
  const r = lerIdMercadoLivre("https://meli.la/2AbCdEf");
  assert.equal(r.tipo, "erro");
});

test("URL de outra loja ou texto solto é recusado", () => {
  assert.equal(lerIdMercadoLivre("https://www.amazon.com.br/dp/B0XYZ").tipo, "erro");
  assert.equal(lerIdMercadoLivre("raquete head").tipo, "erro");
  assert.equal(lerIdMercadoLivre("").tipo, "erro");
});
