-- Migração 006: garimpo automático (Etapa 6).
-- O sistema procura produtos no catálogo oficial, guarda o histórico de preço,
-- publica quando há desconto real e tira do ar quando acaba. Tudo com interruptor no painel.

ALTER TABLE fichas ADD COLUMN IF NOT EXISTS origem text NOT NULL DEFAULT 'manual' CHECK (origem IN ('manual', 'garimpo'));
ALTER TABLE fichas ADD COLUMN IF NOT EXISTS alterado_por text CHECK (alterado_por IN ('moreno', 'automacao'));
CREATE INDEX IF NOT EXISTS fichas_por_origem ON fichas (origem, estado);

-- Cada preço que o sistema vê fica anotado (para saber se o desconto é de verdade)
CREATE TABLE IF NOT EXISTS historico_precos (
  id              bigserial PRIMARY KEY,
  id_catalogo     text NOT NULL,
  item_id         text,
  preco           numeric(12,2) NOT NULL CHECK (preco > 0),
  preco_anterior  numeric(12,2),
  quando          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS historico_por_catalogo ON historico_precos (id_catalogo, quando DESC);

-- O que o garimpo procura (você pode ligar/desligar cada busca)
CREATE TABLE IF NOT EXISTS buscas (
  id            serial PRIMARY KEY,
  termo         text NOT NULL UNIQUE,
  categoria     text NOT NULL CHECK (categoria IN ('raquetes','bolinhas','roupas','calcados','grips','equipamentos','bolsas','cordas')),
  obrigatorias  text[] NOT NULL DEFAULT '{}',   -- o nome do produto precisa ter uma destas
  proibidas     text[] NOT NULL DEFAULT '{}',   -- e nenhuma destas
  ativa         boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS configuracoes (
  chave  text PRIMARY KEY,
  valor  text NOT NULL
);

INSERT INTO configuracoes (chave, valor) VALUES
  ('desconto_minimo', '10'),
  -- etiqueta de afiliado (pública: aparece em todo link de afiliado do Moreno)
  ('afiliado_matt_word', 'guilhermemorenoribeiro'),
  ('afiliado_matt_tool', '33244529')
ON CONFLICT (chave) DO NOTHING;

INSERT INTO automacoes (nome, ativa) VALUES
  ('garimpo', true),
  ('conferencia', true),
  ('publicacao_automatica', true),
  ('link_por_etiqueta', false) -- liga só depois do teste de clique no painel de Afiliados
ON CONFLICT (nome) DO NOTHING;

INSERT INTO buscas (termo, categoria, obrigatorias, proibidas) VALUES
  ('raquete de tenis', 'raquetes', '{raquete,raquetes}', '{padel,beach,ping,pong,squash,badminton,mesa,usada,usado,frescobol}'),
  ('bola de tenis', 'bolinhas', '{bola,bolas,bolinha,bolinhas}', '{cesto,pegador,padel,beach,cachorro,pet,maquina,lancador,mesa,usada}'),
  ('corda para raquete de tenis', 'cordas', '{corda,cordas}', '{padel,pular,varal,usada,squash,badminton}'),
  ('overgrip tenis', 'grips', '{overgrip,overgrips,grip,grips}', '{padel,bike,bicicleta,mesa,beach}'),
  ('raqueteira tenis', 'bolsas', '{raqueteira,raqueteiras,bolsa,mochila,thermobag}', '{padel,beach,mesa}'),
  ('tenis para quadra saibro', 'calcados', '{quadra,saibro,clay,court}', '{padel,futsal,volei,mesa}'),
  ('camiseta de tenis', 'roupas', '{camiseta,camisetas,camisa,polo,regata}', '{padel,beach,mesa}'),
  ('antivibrador raquete', 'equipamentos', '{antivibrador,antivibradores,amortecedor}', '{padel,beach}'),
  ('rede de tenis quadra', 'equipamentos', '{rede}', '{padel,beach,volei,mesa,pesca}')
ON CONFLICT (termo) DO NOTHING;
