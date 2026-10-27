import { test } from "node:test";
import assert from "node:assert/strict";
import type { Ficha } from "../fichas/regras.ts";
import { linkAfiliadoValido, podeMudarEstado } from "../fichas/regras.ts";
import { decidirConferencia, descontoReal, montarLinkEtiqueta, passaFiltro, podePublicarSozinho, type ConfigGarimpo } from "./regras.ts";

const agora = new Date("2026-10-27T12:00:00Z");
const cfg: ConfigGarimpo = { descontoMinimo: 10, publicacaoAutomatica: true, linkPorEtiqueta: true, mattWord: "guilhermemorenoribeiro", mattTool: "33244529" };
const ficha = (x: Partial<Ficha> = {}): Ficha => ({
  id: "1", loja: "mercado-livre", idProdutoLoja: "MLB1", urlOriginal: "u", idCatalogo: "MLB9",
  linkAfiliado: montarLinkEtiqueta("MLB9", cfg), tituloLoja: "Bola", tituloCurto: null, imagem: "https://x/y.jpg", vendedor: null,
  categoria: "bolinhas", observacao: null, precoAtual: 80, precoAnterior: 100, moeda: "BRL", statusNaLoja: "active",
  quantidadeAproximada: null, verificadoEm: new Date("2026-10-27T10:00:00Z"), fonte: "API", estado: "rascunho", motivo: null,
  destaque: "nenhum", criadoEm: agora, atualizadoEm: agora, publicadoEm: null, origem: "garimpo", alteradoPor: null, ...x,
});

test("filtro de palavras do garimpo", () => {
  const b = { obrigatorias: ["bola", "bolinha"], proibidas: ["cesto", "padel", "beach"] };
  assert.equal(passaFiltro("Bola De Tênis Dunlop Atp Official Ball", b), true);
  assert.equal(passaFiltro("Cesto Pegador Bola Tênis", b), false);
  assert.equal(passaFiltro("Bola Padel Head", b), false);
  assert.equal(passaFiltro("Raquete Head", b), false);
  assert.equal(passaFiltro("Bolinha Wilson - Shopping Pack", { obrigatorias: ["bolinha"], proibidas: ["ping"] }), true); // palavra inteira
  assert.equal(passaFiltro("Bolas/Tubo", { obrigatorias: ["bolas"], proibidas: [] }), true);
});

test("desconto real: perto do menor preço visto em 30 dias", () => {
  assert.equal(descontoReal(80, null), true);
  assert.equal(descontoReal(80, 79), true); // até 2% acima
  assert.equal(descontoReal(90, 70), false); // já esteve bem mais barato: desconto "inflado"
});

test("link com etiqueta é montado e aceito como link de afiliado; link comum continua recusado", () => {
  const l = montarLinkEtiqueta("MLB62535400", cfg);
  assert.equal(l, "https://www.mercadolivre.com.br/p/MLB62535400?matt_word=guilhermemorenoribeiro&matt_tool=33244529");
  assert.equal(linkAfiliadoValido(l), true);
  assert.equal(linkAfiliadoValido("https://www.mercadolivre.com.br/p/MLB62535400"), false);
  assert.equal(linkAfiliadoValido("https://www.mercadolivre.com.br/p/MLB1?matt_word=x&matt_tool=abc"), false);
});

test("automação só publica pela porta do garimpo, com todas as travas", () => {
  assert.equal(podeMudarEstado(ficha(), "publicada", "automacao").ok, false); // regra geral intacta
  assert.equal(podePublicarSozinho(ficha(), cfg, agora).ok, true);
  assert.equal(podePublicarSozinho(ficha(), { ...cfg, publicacaoAutomatica: false }, agora).ok, false);
  assert.equal(podePublicarSozinho(ficha({ origem: "manual" }), cfg, agora).ok, false);
  assert.equal(podePublicarSozinho(ficha({ precoAtual: 95 }), cfg, agora).ok, false); // 5% < 10%
  assert.equal(podePublicarSozinho(ficha({ linkAfiliado: null }), cfg, agora).ok, false);
  assert.equal(podePublicarSozinho(ficha({ estado: "pausada", alteradoPor: "moreno" }), cfg, agora).ok, false);
  assert.equal(podePublicarSozinho(ficha({ estado: "rejeitada" }), cfg, agora).ok, false);
  assert.equal(podePublicarSozinho(ficha({ verificadoEm: new Date("2026-10-20T00:00:00Z") }), cfg, agora).ok, false);
});

test("conferência: pausa, expira e republica com motivo", () => {
  const pub = ficha({ estado: "publicada" });
  assert.deepEqual(decidirConferencia(pub, { ok: true, achou: true, precoAtual: 80, precoAnterior: 100 }, cfg, agora), { acao: "manter" });
  assert.equal(decidirConferencia(pub, { ok: true, achou: true, precoAtual: 98, precoAnterior: 100 }, cfg, agora).acao, "pausar");
  assert.equal(decidirConferencia(pub, { ok: true, achou: false }, cfg, agora).acao, "pausar");
  assert.equal(decidirConferencia(pub, { ok: false, erro: "x", naoEncontrado: true }, cfg, agora).acao, "expirar");
  assert.equal(decidirConferencia(pub, { ok: false, erro: "timeout" }, cfg, agora).acao, "manter");
  const pausadaAuto = ficha({ estado: "pausada", alteradoPor: "automacao", motivo: "Desconto caiu" });
  assert.equal(decidirConferencia(pausadaAuto, { ok: true, achou: true, precoAtual: 70, precoAnterior: 100 }, cfg, agora).acao, "republicar");
  const pausadaMoreno = ficha({ estado: "pausada", alteradoPor: "moreno", motivo: "não quero" });
  assert.equal(decidirConferencia(pausadaMoreno, { ok: true, achou: true, precoAtual: 70, precoAnterior: 100 }, cfg, agora).acao, "manter");
  // ficha manual publicada não é pausada por desconto (só o garimpo tem regra de desconto mínimo)
  assert.equal(decidirConferencia(ficha({ estado: "publicada", origem: "manual" }), { ok: true, achou: true, precoAtual: 99, precoAnterior: null }, cfg, agora).acao, "manter");
});
