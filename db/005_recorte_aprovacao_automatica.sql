-- Migração 005: o recorte pronto vai direto para o site (pedido do Moreno em 2026-10-25).
-- Interruptor próprio: desligando no painel, volta a pedir a sua aprovação.
INSERT INTO automacoes (nome, ativa) VALUES ('recorte_aprovacao_automatica', true)
ON CONFLICT (nome) DO NOTHING;
