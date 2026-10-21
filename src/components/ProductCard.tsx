/* eslint-disable @next/next/no-img-element */
import { acharCategoria, imagemMascote, temaCategoria } from "@/lib/categorias";
import { desconto, formatarPreco, type Oferta } from "@/lib/ofertas";
import { Icone } from "./Icone";
import { Tag } from "./Tag";

// Card de oferta. A categoria define as cores da barra (tokens category-*) e o mascote.
export function ProductCard({ oferta }: { oferta: Oferta }) {
  const categoria = acharCategoria(oferta.categoria);
  return (
    <article
      style={temaCategoria(oferta.categoria)}
      className="group flex w-full flex-col overflow-hidden rounded-2xl bg-surface-default shadow-[0_8px_16px_-4px_rgba(17,25,38,0.12),0_4px_8px_-2px_rgba(17,25,38,0.06)] outline outline-1 outline-transparent transition-[outline-color,box-shadow] duration-200 hover:shadow-[0_12px_24px_-6px_rgba(17,25,38,0.18),0_6px_12px_-3px_rgba(17,25,38,0.08)] hover:outline-border-brand"
    >
      <div className="relative h-[414px] shrink-0 overflow-hidden bg-surface-default">
        <img src={oferta.imagem} alt={oferta.titulo} className="absolute inset-0 size-full object-cover" loading="lazy" />
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-(--cat-surface) p-4">
          <div className="relative flex items-center pl-20">
            <img
              src={imagemMascote(oferta.categoria)}
              alt=""
              className="pointer-events-none absolute top-[-53px] left-[-14px] h-[82px] w-24 object-cover"
            />
            <span className="text-sm leading-5 font-semibold whitespace-nowrap text-(--cat-text)">{categoria?.nome}</span>
          </div>
          <span className="rounded-full bg-action-subtle-default px-2 py-1 text-xs leading-4 font-semibold whitespace-nowrap text-text-subtle">
            {oferta.loja}
          </span>
        </div>
      </div>
      <div className="flex flex-1 flex-col items-start gap-8 p-6">
        <div className="flex w-full flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h3 className="text-lg leading-7 font-semibold text-text-brand">{oferta.titulo}</h3>
            {oferta.observacao && <p className="text-base leading-6 text-text-subtle">{oferta.observacao}</p>}
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-xl leading-7 font-semibold tracking-[-1px] text-text-subtle">{formatarPreco(oferta.precoDe)}</p>
            <div className="flex items-center gap-2">
              <p className="text-4xl leading-[44px] font-bold tracking-[-1.5px] whitespace-nowrap text-text-brand">
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
          className="mt-auto flex h-10 items-center justify-center gap-2 rounded-lg bg-action-primary-default px-4 text-sm leading-5 font-semibold whitespace-nowrap text-text-on-brand transition-colors hover:bg-action-primary-hover group-hover:bg-action-primary-hover"
        >
          Ver oferta na loja
          <Icone nome="link-externo" tamanho={20} />
        </a>
      </div>
    </article>
  );
}
