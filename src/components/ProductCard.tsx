/* eslint-disable @next/next/no-img-element */
import { acharCategoria, imagemMascote, temaCategoria } from "@/lib/categorias";
import { desconto, formatarPreco, verificadoEm, type Oferta } from "@/lib/ofertas";
import { Icone } from "./Icone";
import { Tag } from "./Tag";

// Card de oferta. A categoria define as cores da barra (tokens category-*) e o mascote.
// Hover: o card sobe com sombra maior e borda brand, a foto aproxima, o mascote
// se mexe e a seta do botão avança. A barra sobre a foto é Glass (cor da categoria).
export function ProductCard({ oferta }: { oferta: Oferta }) {
  const categoria = acharCategoria(oferta.categoria);
  const pct = desconto(oferta);
  const inteira = (oferta.enquadramento ?? "inteira") === "inteira";
  return (
    <article
      style={temaCategoria(oferta.categoria)}
      className="group relative flex w-full flex-col overflow-hidden rounded-[32px] max-sm:rounded-3xl border border-border-default bg-surface-default shadow-[0_8px_16px_-4px_rgba(17,25,38,0.12),0_4px_8px_-2px_rgba(17,25,38,0.06)] transition-[transform,scale,translate,rotate,box-shadow,border-color] duration-500 ease-suave hover:-translate-y-1.5 hover:border-border-brand hover:shadow-[0_24px_48px_-12px_rgba(17,25,38,0.22),0_8px_16px_-6px_rgba(17,25,38,0.10)]"
    >
      <div
        className="relative h-[414px] shrink-0 overflow-hidden bg-surface-default max-sm:aspect-square max-sm:h-auto"
        style={inteira ? { backgroundColor: oferta.fundoImagem ?? "#ffffff" } : undefined}
      >
        {/* Foto com cenário preenche; produto em fundo liso aparece inteiro, acima da faixa da categoria */}
        <img
          src={oferta.imagem}
          alt={oferta.titulo}
          loading="lazy"
          className={`absolute inset-0 size-full transition-transform duration-700 ease-suave group-hover:scale-[1.04] ${
            inteira ? "object-contain px-8 pt-8 pb-24 max-sm:px-3 max-sm:pt-3 max-sm:pb-12" : "object-cover"
          }`}
        />
        <div className="absolute inset-x-0 bottom-0 bg-linear-to-b from-transparent to-black/40">
          <div
            className="vidro flex items-center justify-between gap-2 p-4 max-sm:px-2 max-sm:py-1.5 [--vidro-desfoque:8px] [--vidro-fundo:color-mix(in_srgb,var(--cat-surface)_72%,transparent)]"
          >
            <div className="relative flex min-w-0 items-center pl-20 max-sm:pl-10">
              <img
                src={imagemMascote(oferta.categoria)}
                alt=""
                className="pointer-events-none absolute top-[-53px] left-[-14px] h-[82px] w-24 origin-bottom max-sm:top-[-30px] max-sm:left-[-8px] max-sm:h-[44px] max-sm:w-[52px] object-cover transition-transform duration-500 ease-suave group-hover:-translate-y-1 group-hover:-rotate-6"
              />
              <span className="text-200 leading-300 font-semibold text-(--cat-text) max-sm:truncate max-sm:text-100 max-sm:leading-200">{categoria?.nome}</span>
            </div>
            <span className="rounded-full bg-action-subtle-default px-2 py-1 text-100 leading-200 font-semibold whitespace-nowrap text-text-subtle max-sm:hidden">
              {oferta.loja}
            </span>
          </div>
        </div>
      </div>
      <div className="flex flex-1 flex-col items-start gap-8 p-6 max-sm:gap-3 max-sm:p-3">
        <div className="flex w-full flex-col gap-4 max-sm:gap-2">
          <div className="flex flex-col gap-1">
            <p className="text-100 leading-200 font-semibold text-text-subtlest sm:hidden">{oferta.loja}</p>
            <h3 className="text-400 leading-500 font-semibold text-text-brand max-sm:line-clamp-3 max-sm:text-200 max-sm:leading-300">{oferta.titulo}</h3>
            {oferta.observacao && <p className="text-300 leading-400 text-text-subtle max-sm:hidden">{oferta.observacao}</p>}
          </div>
          <div className="flex flex-col gap-1">
            {oferta.precoDe && pct && (
              <p className="text-500 leading-500 font-semibold tracking-snug text-text-subtle line-through max-sm:text-150 max-sm:leading-150 max-sm:tracking-none">{formatarPreco(oferta.precoDe)}</p>
            )}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <p className="text-800 leading-800 font-bold tracking-tight whitespace-nowrap text-text-brand max-sm:text-600 max-sm:leading-600 max-sm:tracking-snug">
                {formatarPreco(oferta.precoPor)}
              </p>
              {pct && <Tag>-{pct}%</Tag>}
            </div>
            <p className="text-100 leading-200 text-text-subtlest">Preço verificado {verificadoEm(oferta.verificadoEm)}</p>
          </div>
        </div>
        <a
          href={oferta.link}
          target="_blank"
          rel="sponsored noopener"
          className="mt-auto flex h-10 items-center justify-center gap-2 rounded-full bg-action-primary-default px-4 text-200 leading-300 max-sm:h-9 max-sm:w-full max-sm:gap-1.5 max-sm:px-3 font-semibold whitespace-nowrap text-text-on-brand transition-[background-color,transform,scale,translate,rotate] duration-300 ease-suave origin-left group-hover:-translate-y-0.5 group-hover:scale-105 group-hover:bg-action-primary-hover active:scale-95 after:absolute after:inset-0 after:content-['']"
        >
          <span className="sm:hidden">Ver oferta</span>
          <span className="max-sm:hidden">Ver oferta na loja</span>
          <Icone nome="link-externo" tamanho={20} className="max-sm:size-4!" />
        </a>
      </div>
    </article>
  );
}
