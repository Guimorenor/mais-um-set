-- Migração 002: ajustes depois da prova técnica do Mercado Livre (2026-10-24).
-- A API oficial só entrega preço de anúncios que estão num CATÁLOGO (/p/MLB…),
-- pela lista de ofertas do catálogo. Por isso a ficha guarda também o código do catálogo.
-- Estoque não vem da API: quantidade_aproximada continua opcional.

ALTER TABLE fichas ADD COLUMN IF NOT EXISTS id_catalogo text;  -- ex.: MLB62535400 (vazio = sem catálogo, preço manual)

CREATE INDEX IF NOT EXISTS fichas_por_catalogo ON fichas (id_catalogo) WHERE id_catalogo IS NOT NULL;
