-- Migração 010: enquadramento das fotos nos cards.
-- O estagiário olha cada foto: "cena" (foto com cenário) preenche o espaço;
-- "fundo_liso" (produto sobre fundo branco/liso) aparece inteiro, com respiro, na cor do fundo.
-- Você pode forçar na ficha: imagem_ajuste = 'inteira' | 'preencher' (ou 'auto').
ALTER TABLE fichas ADD COLUMN IF NOT EXISTS imagem_tipo text CHECK (imagem_tipo IN ('cena', 'fundo_liso'));
ALTER TABLE fichas ADD COLUMN IF NOT EXISTS imagem_fundo text CHECK (imagem_fundo ~ '^#[0-9a-f]{6}$');
ALTER TABLE fichas ADD COLUMN IF NOT EXISTS imagem_tipo_origem text; -- de qual foto saiu a análise
ALTER TABLE fichas ADD COLUMN IF NOT EXISTS imagem_ajuste text NOT NULL DEFAULT 'auto' CHECK (imagem_ajuste IN ('auto', 'inteira', 'preencher'));

INSERT INTO automacoes (nome, ativa) VALUES ('enquadramento', true) ON CONFLICT (nome) DO NOTHING;
