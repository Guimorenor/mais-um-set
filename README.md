# Mais um Set

Site de achados de tênis com links de afiliado (Mercado Livre, Amazon…). Os mascotes funcionam como filtros de categoria.

## Rodar no computador

```bash
npm install
npm run dev
```

Abra http://localhost:3000.

## Como está organizado

- `src/app/` — páginas (Next.js App Router)
- `src/app/tokens.css` — cores do Design System no Figma, em modo claro e escuro. Gerado a partir do Figma: mude lá, não aqui.
- `src/lib/categorias.ts` — as 8 categorias / mascotes
- `src/lib/ofertas.ts` — ofertas (por enquanto, os dados de exemplo do Figma)
- `src/lib/site.ts` — links do WhatsApp, Instagram e contato
- `src/components/` — peças da tela (Header, Hero, ProductCard, Footer…)
- `public/` — logo, ícones, mascotes e fotos (WebP)

## Tema claro/escuro

O tema segue o sistema da pessoa até ela usar o switch do header (a escolha fica salva no navegador).
Trechos com `data-theme="dark"` (destaque do hero e rodapé) ficam sempre escuros.

## Filtros e busca

Por enquanto a Home filtra pela URL: `/?categoria=raquetes` ou `/?busca=head`.

## Design

- Telas: Figma `NoWBI4PlfowMwgeEBVTAdC` (página "Site · Telas" + "Handoff · Leia-me")
- Design System: Figma `jMptZHOVCoo3SBx0UWV9Cu`
