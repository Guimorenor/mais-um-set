-- Mais um Set · Banco de ofertas (Postgres / Neon)
-- Migração 001: cria as fichas de oferta e o diário de verificações.
-- Pode ser rodada mais de uma vez sem estragar nada (IF NOT EXISTS).

-- Estados possíveis de uma ficha (o banco recusa qualquer outro valor)
DO $$ BEGIN
  CREATE TYPE estado_oferta AS ENUM ('rascunho', 'em_revisao', 'publicada', 'pausada', 'expirada', 'rejeitada');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE destaque_oferta AS ENUM ('nenhum', 'achado_da_vez', 'secundario');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS fichas (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificação (a dupla loja + id_produto_loja nunca se repete)
  loja                   text NOT NULL DEFAULT 'mercado-livre',
  id_produto_loja        text NOT NULL,              -- ex.: MLB4123456789
  url_original           text NOT NULL,              -- página do produto (de onde sai o MLB)
  link_afiliado          text,                       -- meli.la colado à mão; o sistema nunca troca

  -- O que aparece no card
  titulo_loja            text,
  titulo_curto           text,                       -- editável no painel
  imagem                 text,
  vendedor               text,
  categoria              text CHECK (categoria IN ('raquetes','bolinhas','roupas','calcados','grips','equipamentos','bolsas','cordas')),
  observacao             text,

  -- Preço, com fonte e horário
  preco_atual            numeric(12,2) CHECK (preco_atual IS NULL OR preco_atual > 0),
  preco_anterior         numeric(12,2) CHECK (preco_anterior IS NULL OR preco_anterior > 0), -- só se a loja informar
  moeda                  text,
  status_na_loja         text,                       -- active, paused, closed…
  quantidade_aproximada  integer,
  verificado_em          timestamptz,
  fonte                  text,                       -- ex.: 'API Mercado Livre /items'

  -- Controle
  estado                 estado_oferta NOT NULL DEFAULT 'rascunho',
  motivo                 text,                       -- de rejeição, pausa ou expiração
  destaque               destaque_oferta NOT NULL DEFAULT 'nenhum',
  criado_em              timestamptz NOT NULL DEFAULT now(),
  atualizado_em          timestamptz NOT NULL DEFAULT now(),
  publicado_em           timestamptz,

  CONSTRAINT fichas_sem_duplicado UNIQUE (loja, id_produto_loja),
  -- publicada exige link de afiliado (segunda trava, além das regras do código)
  CONSTRAINT publicada_tem_link CHECK (estado <> 'publicada' OR link_afiliado IS NOT NULL),
  -- rejeitar/pausar/expirar exige motivo
  CONSTRAINT estado_com_motivo CHECK (estado NOT IN ('rejeitada','pausada','expirada') OR coalesce(motivo, '') <> '')
);

-- Buscas mais rápidas pelo que o site e a automação mais pedem
CREATE INDEX IF NOT EXISTS fichas_por_estado ON fichas (estado);
CREATE INDEX IF NOT EXISTS fichas_publicadas_por_categoria ON fichas (categoria) WHERE estado = 'publicada';

-- Diário: uma linha a cada verificação ou mudança de estado
CREATE TABLE IF NOT EXISTS verificacoes (
  id          bigserial PRIMARY KEY,
  ficha_id    uuid NOT NULL REFERENCES fichas(id) ON DELETE CASCADE,
  quando      timestamptz NOT NULL DEFAULT now(),
  autor       text NOT NULL CHECK (autor IN ('moreno','automacao')),
  resultado   text NOT NULL CHECK (resultado IN ('ok','mudou','erro','estado')),
  mudancas    text[] NOT NULL DEFAULT '{}',  -- ex.: {'preço: R$ 1.050,00 → R$ 989,00'}
  erro        text,
  estado_de   estado_oferta,
  estado_para estado_oferta
);

CREATE INDEX IF NOT EXISTS verificacoes_por_ficha ON verificacoes (ficha_id, quando DESC);
