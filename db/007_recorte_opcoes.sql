-- Migração 007: o estagiário gera até 3 versões do recorte (métodos diferentes);
-- a melhor vai para o site e você pode trocar por outra na ficha.
ALTER TABLE recortes ADD COLUMN IF NOT EXISTS metodo text;

CREATE TABLE IF NOT EXISTS recorte_opcoes (
  ficha_id   uuid NOT NULL REFERENCES fichas(id) ON DELETE CASCADE,
  metodo     text NOT NULL CHECK (metodo IN ('fundo_branco', 'birefnet', 'isnet')),
  png        bytea NOT NULL,
  criado_em  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (ficha_id, metodo)
);
