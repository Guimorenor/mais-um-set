-- Migração 008: mais buscas para o garimpo (marcas e variações), para encher a vitrine.
INSERT INTO buscas (termo, categoria, obrigatorias, proibidas) VALUES
  ('raquete de tenis wilson', 'raquetes', '{raquete,raquetes}', '{padel,beach,ping,pong,squash,badminton,mesa,usada,usado,frescobol}'),
  ('raquete de tenis babolat', 'raquetes', '{raquete,raquetes}', '{padel,beach,ping,pong,squash,badminton,mesa,usada,usado,frescobol}'),
  ('raquete de tenis head', 'raquetes', '{raquete,raquetes}', '{padel,beach,ping,pong,squash,badminton,mesa,usada,usado,frescobol}'),
  ('raquete de tenis yonex', 'raquetes', '{raquete,raquetes}', '{padel,beach,ping,pong,squash,badminton,mesa,usada,usado,frescobol}'),
  ('bola de tenis wilson', 'bolinhas', '{bola,bolas,bolinha,bolinhas}', '{cesto,pegador,padel,beach,cachorro,pet,maquina,lancador,mesa,usada}'),
  ('bola de tenis babolat', 'bolinhas', '{bola,bolas,bolinha,bolinhas}', '{cesto,pegador,padel,beach,cachorro,pet,maquina,lancador,mesa,usada}'),
  ('bola de tenis head', 'bolinhas', '{bola,bolas,bolinha,bolinhas}', '{cesto,pegador,padel,beach,cachorro,pet,maquina,lancador,mesa,usada}'),
  ('corda babolat rpm', 'cordas', '{corda,cordas}', '{padel,pular,varal,usada,squash,badminton}'),
  ('corda luxilon', 'cordas', '{corda,cordas}', '{padel,pular,varal,usada,squash,badminton}'),
  ('overgrip wilson', 'grips', '{overgrip,overgrips,grip,grips}', '{padel,bike,bicicleta,mesa,beach}'),
  ('tenis asics quadra', 'calcados', '{quadra,saibro,clay,court,tennis}', '{padel,futsal,volei,mesa,infantil}'),
  ('tenis babolat quadra', 'calcados', '{quadra,saibro,clay,court,tennis}', '{padel,futsal,volei,mesa,infantil}'),
  ('bermuda tenis', 'roupas', '{bermuda,short,shorts}', '{padel,beach,mesa,praia}'),
  ('saia de tenis feminina', 'roupas', '{saia,short,saia-short}', '{padel,beach,mesa}'),
  ('munhequeira tenis', 'roupas', '{munhequeira,munhequeiras,testeira}', '{padel,beach,mesa}'),
  ('cesto de bolas tenis', 'equipamentos', '{cesto,pegador,coletor}', '{padel,beach,mesa,basquete}')
ON CONFLICT (termo) DO NOTHING;
