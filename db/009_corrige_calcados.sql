-- Migração 009: a busca de calçados aceitava "tennis" e pegou bolas/raquetes como Calçados.
-- 1) busca corrigida: só palavras de calçado, e barra itens de outras categorias
UPDATE buscas SET obrigatorias = '{quadra,saibro,clay,court}',
       proibidas = '{padel,futsal,volei,mesa,infantil,bola,bolas,bolinha,bolinhas,raquete,raquetes,corda,cordas,overgrip,grip,raqueteira,meia,meias}'
 WHERE categoria = 'calcados';
-- 2) fichas do garimpo que caíram em Calçados por engano vão para a categoria certa
UPDATE fichas SET categoria = 'bolinhas', atualizado_em = now()
 WHERE origem = 'garimpo' AND categoria = 'calcados' AND (titulo_loja ILIKE '%bola%' OR titulo_loja ILIKE '%bolinha%');
UPDATE fichas SET categoria = 'raquetes', atualizado_em = now()
 WHERE origem = 'garimpo' AND categoria = 'calcados' AND titulo_loja ILIKE '%raquete%' AND titulo_loja NOT ILIKE '%raqueteira%';
UPDATE fichas SET categoria = 'bolsas', atualizado_em = now()
 WHERE origem = 'garimpo' AND categoria = 'calcados' AND titulo_loja ILIKE '%raqueteira%';
-- o que sobrar em Calçados sem palavra de calçado sai do ar até você revisar
UPDATE fichas SET estado = 'pausada', motivo = 'Categoria duvidosa (correção do garimpo): revise', alterado_por = NULL, atualizado_em = now()
 WHERE origem = 'garimpo' AND categoria = 'calcados' AND estado = 'publicada'
   AND titulo_loja !~* '(t[eê]nis|sapat|cal[cç]ad|chuteira)';
