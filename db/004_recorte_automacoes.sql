-- Migração 004: recorte de fundo das fotos e chaves das automações.

-- Situação do recorte em cada ficha. O recorte só aparece no site se você aprovar (usar_recorte).
ALTER TABLE fichas ADD COLUMN IF NOT EXISTS recorte_status text CHECK (recorte_status IN ('pendente', 'pronto', 'erro'));
ALTER TABLE fichas ADD COLUMN IF NOT EXISTS recorte_erro text;
ALTER TABLE fichas ADD COLUMN IF NOT EXISTS usar_recorte boolean NOT NULL DEFAULT false;

-- O PNG recortado fica no próprio banco (são poucas imagens, ~100–400 KB cada)
CREATE TABLE IF NOT EXISTS recortes (
  ficha_id       uuid PRIMARY KEY REFERENCES fichas(id) ON DELETE CASCADE,
  png            bytea NOT NULL,
  imagem_origem  text NOT NULL,          -- de qual foto saiu (se a foto mudar, recorta de novo)
  largura        integer,
  altura         integer,
  criado_em      timestamptz NOT NULL DEFAULT now()
);

-- Interruptores das automações (o painel liga/desliga; as automações conferem antes de rodar)
CREATE TABLE IF NOT EXISTS automacoes (
  nome              text PRIMARY KEY,
  ativa             boolean NOT NULL,
  atualizado_em     timestamptz NOT NULL DEFAULT now(),
  ultima_execucao   timestamptz,
  ultimo_resultado  text
);

INSERT INTO automacoes (nome, ativa) VALUES ('recorte', true), ('destaque_automatico', true)
ON CONFLICT (nome) DO NOTHING;
