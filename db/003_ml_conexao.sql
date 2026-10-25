-- Migração 003: guarda a conexão com o Mercado Livre (para o painel e, no futuro, a verificação automática).
-- Os tokens ficam CIFRADOS (AES-256-GCM) com uma chave derivada do AUTH_SECRET:
-- quem olhar o banco sozinho não consegue usá-los. Só existe uma linha (id = 1).

CREATE TABLE IF NOT EXISTS ml_conexao (
  id                     integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  access_token_cifrado   text NOT NULL,
  refresh_token_cifrado  text,                -- só vem se o app tiver acesso offline
  expira_em              timestamptz NOT NULL,
  ml_user_id             text,
  conectado_em           timestamptz NOT NULL DEFAULT now(),
  atualizado_em          timestamptz NOT NULL DEFAULT now()
);
