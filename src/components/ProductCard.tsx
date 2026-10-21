/* eslint-disable @next/next/no-img-element */
import { acharCategoria, imagemMascote, temaCategoria } from "@/lib/categorias";
import { desconto, formatarPreco, type Oferta } from "@/lib/ofertas";
import { Icone } from "./Icone";
import { Tag } from "./Tag";

// Card de oferta. A categoria define as cores da barra (tokens category-*) e o mascote.
// Hover: o card sobe com sombra maior e borda brand, a foto aproxima, o mascote
// se mexe e a seta do botão avança. A barra sobre a foto é Glass (cor da categoria).
export function ProductCard({ oferta }: { oferta: Oferta }) {
  const categoria = acharCategoria(oferta.categoria);
  return (
    <article
      style={temaCategoria(oferta.categoria)}
      className="group relative flex w-full flex-col overflow-hidden rounded-[32px] border border-border-default bg-surface-default shadow-[0_8px_16px_-4px_rgba(17,25,38,0.12),0_4px_8px_-2px_rgba(17,25,38,0.06)] transition-[transform,scale,translate,rotate,box-shadow,border-color] duration-500 ease-suave hover:-translate-y-1.5 hover:border-border-brand hover:shadow-[0_24px_48px_-12px_rgba(17,25,38,0.22),0_8px_16px_-6px_rgba(17,25,38,0.10)]"
    >
      <div className="relative h-[414px] shrink-0 overflow-hidden bg-surface-default">
        <img
          src={oferta.imagem}
          alt={oferta.titulo}
          loading="lazy"
          className="absolute inset-0 size-full object-cover transition-transform duration-700 ease-suave group-hover:scale-[1.04]"
        />
        <div className="absolute inset-x-0 bottom-0 bg-linear-to-b from-transparent to-black/40">
          <div
            className="vidro flex items-center justify-between gap-2 p-4 [--vidro-desfoque:8px] [--vidro-fundo:color-mix(in_srgb,var(--cat-surface)_72%,transparent)]"
          >
            <div className="relative flex min-w-0 items-center pl-20">
              <img
                src={imagemMascote(oferta.categoria)}
                alt=""
                className="pointer-events-none absolute top-[-53px] left-[-14px] h-[82px] w-24 origin-bottom object-cover transition-transform duration-500 ease-suave group-hover:-translate-y-1 group-hover:-rotate-6"
              />
              <span className="text-200 leading-300 font-semibold text-(--cat-text)">{categoria?.nome}</span>
            </div>
            <span className="rounded-full bg-action-subtle-default px-2 py-1 text-100 leading-200 font-semibold whitespace-nowrap text-text-subtle">
              {oferta.loja}
            </span>
          </div>
        </div>
      </div>
      <div className="flex flex-1 flex-col items-start gap-8 p-6">
        <div className="flex w-full flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h3 className="text-400 leading-500 font-semibold text-text-brand">{oferta.titulo}</h3>
            {oferta.observacao && <p className="text-300 leading-400 text-text-subtle">{oferta.observacao}</p>}
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-500 leading-500 font-semibold tracking-snug text-text-subtle">{formatarPreco(oferta.precoDe)}</p>
            <div className="flex items-center gap-2">
              <p className="text-800 leading-800 font-bold tracking-tight whitespace-nowrap text-text-brand">
                {formatarPreco(oferta.precoPor)}
              </p>
              <Tag>-{desconto(oferta)}%</Tag>
            </div>
          </div>
        </div>
        <a
          href={oferta.link}
          target="_blank"
          rel="sponsored noopener"
          className="mt-auto flex h-10 items-center justify-center gap-2 rounded-full bg-action-primary-default px-4 text-200 leading-300 font-semibold whitespace-nowrap text-text-on-brand transition-[background-color,transform,scale,translate,rotate] duration-300 ease-suave origin-left group-hover:-translate-y-0.5 group-hover:scale-105 group-hover:bg-action-primary-hover active:scale-95 after:absolute after:inset-0 after:content-['']"
        >
          Ver oferta na loja
          <Icone
            nome="link-externo"
            tamanho={20}
           
          />
        </a>
      </div>
    </article>
  );
}
