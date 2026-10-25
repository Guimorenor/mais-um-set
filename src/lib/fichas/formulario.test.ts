import { test } from "node:test";
import assert from "node:assert/strict";
import { lerCategoria, lerImagem, lerPreco, textoOuNull } from "./formulario.ts";

test("preço em vários formatos", () => {
  assert.equal(lerPreco("1.234,56"), 1234.56);
  assert.equal(lerPreco("67,8"), 67.8);
  assert.equal(lerPreco("67.80"), 67.8);
  assert.equal(lerPreco("R$ 89"), 89);
  assert.equal(lerPreco(""), null);
  assert.equal(lerPreco("abc"), null);
  assert.equal(lerPreco("0"), null);
  assert.equal(lerPreco("-5"), null);
});

test("texto, categoria e imagem", () => {
  assert.equal(textoOuNull("  oi  "), "oi");
  assert.equal(textoOuNull("   "), null);
  assert.equal(lerCategoria("bolinhas"), "bolinhas");
  assert.equal(lerCategoria("hacker"), null);
  assert.equal(lerImagem("https://http2.mlstatic.com/x.webp"), "https://http2.mlstatic.com/x.webp");
  assert.equal(lerImagem("http://inseguro.com/x.jpg"), null);
  assert.equal(lerImagem("javascript:alert(1)"), null);
});
