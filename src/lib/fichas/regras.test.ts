// Testes do regulamento da ficha: `npm test`
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  decisaoAutomatica,
  descontoConfiavel,
  linkAfiliadoValido,
  mudancas,
  pendenciasParaPublicar,
  podeMudarEstado,
  precoVelho,
  type Ficha,
} from "./regras.ts";

const agora = new Date("2026-10-22T12:00:00-03:00");
const horasAtras = (h: number) => new Date(agora.getTime() - h * 3_600_000);

const ficha = (extra: Partial<Ficha> = {}): Ficha => ({
  id: "1",
  loja: "mercado-livre",
  idProdutoLoja: "MLB4123456789",
  urlOriginal: "https://produto.mercadolivre.com.br/MLB-4123456789-raquete",
  linkAfiliado: "https://meli.la/2AbCdEf",
  tituloLoja: "Raquete Head Extreme Pro 2026",
  tituloCurto: null,
  imagem: "https://http2.mlstatic.com/foto.webp",
  vendedor: "Loja X",
  categoria: "raquetes",
  observacao: null,
  precoAtual: 1050,
  precoAnterior: 1500,
  moeda: "BRL",
  statusNaLoja: "active",
  quantidadeAproximada: 5,
  verificadoEm: horasAtras(1),
  fonte: "API Mercado Livre",
  estado: "em_revisao",
  motivo: null,
  destaque: "nenhum",
  criadoEm: horasAtras(2),
  atualizadoEm: horasAtras(1),
  publicadoEm: null,
  ...extra,
});

test("link de afiliado: aceita meli.la e /sec/, recusa link comum do produto", () => {
  assert.equal(linkAfiliadoValido("https://meli.la/2AbCdEf"), true);
  assert.equal(linkAfiliadoValido("https://mercadolivre.com/sec/1a2b3c"), true);
  assert.equal(linkAfiliadoValido("https://produto.mercadolivre.com.br/MLB-4123456789-raquete"), false);
  assert.equal(linkAfiliadoValido("http://meli.la/2AbCdEf"), false);
  assert.equal(linkAfiliadoValido("https://meli.la/"), false);
  assert.equal(linkAfiliadoValido(null), false);
});

test("desconto só quando os dois preços são confiáveis", () => {
  assert.equal(descontoConfiavel({ precoAtual: 1050, precoAnterior: 1500 }), 30);
  assert.equal(descontoConfiavel({ precoAtual: 1050, precoAnterior: null }), null);
  assert.equal(descontoConfiavel({ precoAtual: 1500, precoAnterior: 1050 }), null); // "anterior" menor que o atual
  assert.equal(descontoConfiavel({ precoAtual: 100, precoAnterior: 100 }), null);
  assert.equal(descontoConfiavel({ precoAtual: 10, precoAnterior: 1000 }), null); // 99%: provável erro
});

test("preço fica velho depois de 36 h sem verificação", () => {
  assert.equal(precoVelho({ verificadoEm: horasAtras(35) }, agora), false);
  assert.equal(precoVelho({ verificadoEm: horasAtras(37) }, agora), true);
  assert.equal(precoVelho({ verificadoEm: null }, agora), true);
});

test("pendências para publicar", () => {
  assert.deepEqual(pendenciasParaPublicar(ficha(), agora), []);
  const f = ficha({ linkAfiliado: "https://produto.mercadolivre.com.br/MLB-4123456789", categoria: null, verificadoEm: horasAtras(40) });
  assert.deepEqual(pendenciasParaPublicar(f, agora), [
    "link de afiliado válido (meli.la)",
    "categoria",
    "verificação recente (menos de 36 h)",
  ]);
});

test("só você publica; a automação não", () => {
  assert.deepEqual(podeMudarEstado(ficha({ verificadoEm: new Date() }), "publicada", "moreno"), { ok: true });
  assert.equal(podeMudarEstado(ficha(), "publicada", "automacao").ok, false);
  assert.equal(podeMudarEstado(ficha({ estado: "pausada" }), "publicada", "automacao").ok, false);
});

test("rejeitar, pausar e expirar exigem motivo", () => {
  assert.equal(podeMudarEstado(ficha(), "rejeitada", "moreno").ok, false);
  assert.equal(podeMudarEstado(ficha(), "rejeitada", "moreno", "preço não compensa").ok, true);
  assert.equal(podeMudarEstado(ficha({ estado: "publicada" }), "pausada", "automacao", "").ok, false);
});

test("não publica sem link de afiliado mesmo com clique seu", () => {
  const r = podeMudarEstado(ficha({ linkAfiliado: null, verificadoEm: new Date() }), "publicada", "moreno");
  assert.equal(r.ok, false);
});

test("automação: pausa, expira ou mantém — nunca publica", () => {
  const pub = ficha({ estado: "publicada" });
  const dados = { precoAtual: 1000, precoAnterior: 1500, statusNaLoja: "active", quantidadeAproximada: 3 };
  assert.deepEqual(decisaoAutomatica(pub, { ok: true, dados }), { acao: "manter" });
  assert.equal(decisaoAutomatica(pub, { ok: true, dados: { ...dados, statusNaLoja: "paused" } }).acao, "pausar");
  assert.equal(decisaoAutomatica(pub, { ok: true, dados: { ...dados, statusNaLoja: "closed" } }).acao, "expirar");
  assert.equal(decisaoAutomatica(pub, { ok: true, dados: { ...dados, quantidadeAproximada: 0 } }).acao, "pausar");
  assert.equal(decisaoAutomatica(pub, { ok: false, erro: "404", naoEncontrado: true }).acao, "expirar");
  // falha temporária com verificação recente: mantém; com verificação velha: pausa
  assert.equal(decisaoAutomatica(pub, { ok: false, erro: "timeout" }, agora).acao, "manter");
  assert.equal(decisaoAutomatica(ficha({ estado: "publicada", verificadoEm: horasAtras(40) }), { ok: false, erro: "timeout" }, agora).acao, "pausar");
  // fichas que não estão publicadas não são mexidas
  assert.deepEqual(decisaoAutomatica(ficha({ estado: "em_revisao" }), { ok: true, dados: { ...dados, statusNaLoja: "closed" } }), { acao: "manter" });
});

test("diário registra o que mudou", () => {
  const m = mudancas(ficha(), { precoAtual: 989, precoAnterior: 1500, statusNaLoja: "active", quantidadeAproximada: 5 });
  assert.deepEqual(m, ["preço: R$ 1.050,00 → R$ 989,00"]);
});
