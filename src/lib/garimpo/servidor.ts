// Garimpo e conferência automáticos (Etapa 6). Só no servidor; só caminhos oficiais da API.
//
//  GARIMPO     procura produtos no catálogo (buscas do banco), guarda o preço no histórico e,
//              se o desconto for real e ≥ mínimo, cria a ficha. Com link de afiliado (etiqueta
//              ligada) e publicação automática ligada, publica sozinho; senão fica na fila.
//  CONFERÊNCIA confere o preço das fichas no ar e das pausadas pela automação; pausa, expira
//              ou republica sempre com motivo, e anota tudo no Diário.
//
// Limites (combinados): tempo máximo por execução, máximo de produtos e de fichas novas,
// poucas consultas ao mesmo tempo, e interruptor no painel que é conferido antes de rodar.
import "server-only";
import { comBanco } from "@/lib/db/conexao";
import { categorias, type CategoriaSlug } from "@/lib/categorias";
import { descontoConfiavel } from "@/lib/fichas/regras";
import {
  anotarPreco, buscarFicha, criarFicha, menorPreco30d, mudarEstado, publicarPeloGarimpo, registrarVerificacao,
} from "@/lib/fichas/repositorio";
import { precoAnteriorValido } from "@/lib/ml/catalogo";
import { consultar } from "@/lib/ml/prova";
import { lerCatalogo, obterPasseDoApp } from "@/lib/ml/servidor";
import {
  decidirConferencia, descontoReal, montarLinkEtiqueta, passaFiltro, type Busca, type Conferencia, type ConfigGarimpo,
} from "./regras";

const PRAZO_MS = 240_000; // para antes dos 300 s da função
const POR_BUSCA = 50;
const MAX_PRODUTOS = 300;
const MAX_FICHAS_NOVAS = 40;
const MAX_CONFERENCIAS = 150;
const AO_MESMO_TEMPO = 6;

export async function lerConfigGarimpo(): Promise<ConfigGarimpo & { ligadas: Record<string, boolean> }> {
  return comBanco(async (pool) => {
    const a = await pool.query<{ nome: string; ativa: boolean }>("SELECT nome, ativa FROM automacoes");
    const c = await pool.query<{ chave: string; valor: string }>("SELECT chave, valor FROM configuracoes");
    const ligadas = Object.fromEntries(a.rows.map((r) => [r.nome, r.ativa]));
    const cfg = Object.fromEntries(c.rows.map((r) => [r.chave, r.valor]));
    return {
      ligadas,
      descontoMinimo: Math.min(90, Math.max(1, Number(cfg.desconto_minimo) || 10)),
      publicacaoAutomatica: Boolean(ligadas.publicacao_automatica),
      linkPorEtiqueta: Boolean(ligadas.link_por_etiqueta) && Boolean(cfg.afiliado_matt_word && cfg.afiliado_matt_tool),
      mattWord: cfg.afiliado_matt_word ?? "",
      mattTool: cfg.afiliado_matt_tool ?? "",
    };
  });
}

async function anotarExecucao(nome: string, resultado: string) {
  await comBanco((pool) =>
    pool.query("UPDATE automacoes SET ultima_execucao = now(), ultimo_resultado = $1 WHERE nome = $2", [resultado.slice(0, 300), nome]),
  );
}

/** Roda `tarefa` em cada item, `n` por vez, parando quando o prazo acaba. */
async function emLotes<T>(itens: T[], n: number, prazo: number, tarefa: (item: T) => Promise<void>) {
  let i = 0;
  const trabalhador = async () => {
    while (i < itens.length && Date.now() < prazo) await tarefa(itens[i++]);
  };
  await Promise.all(Array.from({ length: n }, trabalhador));
}

// ── GARIMPO ───────────────────────────────────────────────────────────────────

export async function rodarGarimpo(): Promise<string> {
  const prazo = Date.now() + PRAZO_MS;
  const cfg = await lerConfigGarimpo();
  if (!cfg.ligadas.garimpo) {
    await anotarExecucao("garimpo", "pausado");
    return "Garimpo pausado no painel.";
  }
  const passe = await obterPasseDoApp();
  if (!passe) {
    await anotarExecucao("garimpo", "erro: sem passe do app");
    return "Sem passe do app do Mercado Livre (confira ML_CLIENT_ID/SECRET).";
  }

  const buscas = await comBanco(async (pool) =>
    (await pool.query("SELECT termo, categoria, obrigatorias, proibidas FROM buscas WHERE ativa ORDER BY id")).rows as Busca[],
  );
  const slugs = categorias.map((c) => c.slug as string);

  // 1) Procurar no catálogo e filtrar pelo nome
  const candidatos = new Map<string, CategoriaSlug>();
  for (const b of buscas) {
    if (Date.now() > prazo || candidatos.size >= MAX_PRODUTOS) break;
    if (!slugs.includes(b.categoria)) continue;
    const r = await consultar(`/products/search?status=active&site_id=MLB&q=${encodeURIComponent(b.termo)}&limit=${POR_BUSCA}`, passe);
    const lista = (r.corpo as { results?: { id?: string; name?: string }[] } | null)?.results ?? [];
    for (const p of lista) {
      if (p.id && p.name && passaFiltro(p.name, b) && !candidatos.has(p.id) && candidatos.size < MAX_PRODUTOS) candidatos.set(p.id, b.categoria);
    }
  }

  // 2) Pular o que já tem ficha e o que já foi conferido nas últimas 12 h (economiza consultas)
  const jaTem = new Set(
    await comBanco(async (pool) =>
      (
        await pool.query(
          `SELECT id_catalogo FROM fichas WHERE id_catalogo = ANY($1)
           UNION SELECT id_catalogo FROM historico_precos WHERE id_catalogo = ANY($1) AND quando > now() - interval '12 hours'`,
          [[...candidatos.keys()]],
        )
      ).rows.map((r) => r.id_catalogo as string),
    ),
  );
  const fila = [...candidatos].filter(([id]) => !jaTem.has(id));

  // 3) Conferir preço de cada um; criar ficha se o desconto for real
  let vistos = 0, comDesconto = 0, novas = 0, publicadas = 0, erros = 0;
  await emLotes(fila, AO_MESMO_TEMPO, prazo, async ([idCatalogo, categoria]) => {
    if (novas >= MAX_FICHAS_NOVAS) return;
    try {
      const r = await lerCatalogo(idCatalogo, null);
      vistos++;
      if (!r.ok || !r.dados.oferta || typeof r.dados.oferta.price !== "number") return;
      const o = r.dados.oferta;
      const por = o.price as number;
      const de = precoAnteriorValido(o);
      await anotarPreco(idCatalogo, o.item_id, por, de);
      const pct = descontoConfiavel({ precoAtual: por, precoAnterior: de });
      if (pct === null || pct < cfg.descontoMinimo) return;
      if (!descontoReal(por, await menorPreco30d(idCatalogo))) return;
      if (!r.dados.imagem || !r.dados.nome) return;
      comDesconto++;
      if (novas >= MAX_FICHAS_NOVAS) return;
      novas++;
      const { id, jaExistia } = await criarFicha({
        idProdutoLoja: o.item_id,
        urlOriginal: `https://www.mercadolivre.com.br/p/${idCatalogo}`,
        idCatalogo,
        linkAfiliado: cfg.linkPorEtiqueta ? montarLinkEtiqueta(idCatalogo, cfg) : null,
        tituloLoja: r.dados.nome,
        tituloCurto: null,
        imagem: r.dados.imagem,
        vendedor: o.official_store_id ? `Loja oficial ${o.official_store_id}` : o.seller_id ? `Vendedor ${o.seller_id}` : null,
        categoria,
        observacao: null,
        precoAtual: por,
        precoAnterior: de,
        moeda: "BRL",
        statusNaLoja: "active",
        verificadoEm: new Date(),
        fonte: `API oficial Mercado Livre · catálogo ${idCatalogo} · anúncio ${o.item_id} · garimpo`,
        origem: "garimpo",
      });
      if (!jaExistia && (await publicarPeloGarimpo(id, cfg, `-${pct}% confirmado no catálogo`)).ok) publicadas++;
    } catch (e) {
      erros++;
      console.error("[garimpo]", idCatalogo, e instanceof Error ? e.message : e);
    }
  });

  const resumo = `${candidatos.size} achados, ${vistos} conferidos, ${comDesconto} com desconto real ≥ ${cfg.descontoMinimo}%, ${novas} fichas novas, ${publicadas} publicadas${erros ? `, ${erros} erros` : ""}${Date.now() > prazo ? " (parou no tempo limite)" : ""}`;
  await anotarExecucao("garimpo", resumo);
  return resumo;
}

// ── CONFERÊNCIA ───────────────────────────────────────────────────────────────

export async function rodarConferencia(): Promise<string> {
  const prazo = Date.now() + PRAZO_MS;
  const cfg = await lerConfigGarimpo();
  if (!cfg.ligadas.conferencia) {
    await anotarExecucao("conferencia", "pausada");
    return "Conferência pausada no painel.";
  }
  // No ar; pausadas pela automação; e rascunhos do garimpo que já ganharam link (você colou o meli.la)
  const ids = await comBanco(async (pool) =>
    (
      await pool.query(
        `SELECT id FROM fichas
          WHERE id_catalogo IS NOT NULL AND (
                estado = 'publicada'
             OR (estado = 'pausada' AND alterado_por = 'automacao')
             OR (estado IN ('rascunho', 'em_revisao') AND origem = 'garimpo' AND link_afiliado IS NOT NULL))
          ORDER BY verificado_em ASC NULLS FIRST LIMIT $1`,
        [MAX_CONFERENCIAS],
      )
    ).rows.map((r) => r.id as string),
  );

  let conferidas = 0, pausadas = 0, expiradas = 0, publicadas = 0, erros = 0;
  await emLotes(ids, AO_MESMO_TEMPO, prazo, async (id) => {
    try {
      const atual = await buscarFicha(id);
      if (!atual?.ficha.idCatalogo) return;
      const f = atual.ficha;
      const idAnuncio = f.idProdutoLoja === f.idCatalogo ? null : f.idProdutoLoja;
      const r = await lerCatalogo(f.idCatalogo!, idAnuncio);
      conferidas++;
      let c: Conferencia;
      if (!r.ok) {
        c = { ok: false, erro: r.erro, naoEncontrado: r.naoEncontrado };
        await registrarVerificacao(id, "automacao", { ok: false, erro: r.erro });
      } else if (!r.dados.oferta) {
        c = { ok: true, achou: false };
        await registrarVerificacao(id, "automacao", { ok: false, erro: "anúncio não está entre as ofertas ativas do catálogo" });
      } else {
        const o = r.dados.oferta;
        const por = typeof o.price === "number" ? o.price : null;
        const de = precoAnteriorValido(o);
        c = { ok: true, achou: true, precoAtual: por, precoAnterior: de };
        if (por) await anotarPreco(f.idCatalogo!, o.item_id, por, de);
        await registrarVerificacao(id, "automacao", {
          ok: true, precoAtual: por, precoAnterior: de, statusNaLoja: "active",
          fonte: `API oficial Mercado Livre · catálogo ${f.idCatalogo} · anúncio ${o.item_id}`,
        });
      }

      if (f.estado === "rascunho" || f.estado === "em_revisao") {
        if ((await publicarPeloGarimpo(id, cfg, "link de afiliado colado e desconto confirmado")).ok) publicadas++;
        return;
      }
      const d = decidirConferencia(f, c, cfg);
      if (d.acao === "pausar" && (await mudarEstado(id, "pausada", "automacao", d.motivo)).ok) pausadas++;
      if (d.acao === "expirar" && (await mudarEstado(id, "expirada", "automacao", d.motivo)).ok) expiradas++;
      if (d.acao === "republicar" && (await publicarPeloGarimpo(id, cfg, d.motivo)).ok) publicadas++;
    } catch (e) {
      erros++;
      console.error("[conferencia]", id, e instanceof Error ? e.message : e);
    }
  });

  const resumo = `${conferidas} conferidas, ${pausadas} pausadas, ${expiradas} expiradas, ${publicadas} publicadas/republicadas${erros ? `, ${erros} erros` : ""}${Date.now() > prazo ? " (parou no tempo limite)" : ""}`;
  await anotarExecucao("conferencia", resumo);
  return resumo;
}
