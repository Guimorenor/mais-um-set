/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { categorias, imagemMascote, temaCategoria, type CategoriaSlug } from "@/lib/categorias";

// "Qual é a desculpa de hoje?" — os mascotes funcionam como filtro de categoria.
export function FiltroCategorias({ ativa }: { ativa?: CategoriaSlug }) {
  return (
    <section className="flex flex-col gap-4 pt-8 pb-4 lg:gap-8 lg:px-20 lg:pt-16 lg:pb-0">
      <div className="flex flex-col gap-1 px-4 lg:flex-row lg:items-center lg:justify-between lg:px-0">
        <h2 className="font-serif text-[29.44px] leading-[1.2] tracking-[-0.46px] text-text-brand lg:text-[64px] lg:tracking-[-1px]">
          Qual é a desculpa de hoje?
        </h2>
        <p className="text-[15px] font-semibold text-text-subtle lg:text-2xl lg:leading-8 lg:tracking-[-1px]">
          Escolha uma categoria para ver os achados.
        </p>
      </div>
      <nav
        aria-label="Filtrar por categoria"
        className="flex snap-x scroll-px-4 gap-1 overflow-x-auto px-4 lg:scroll-px-8 [scrollbar-width:none] lg:gap-2 lg:rounded-2xl lg:bg-surface-sunken lg:p-8"
      >
        {categorias.map((c) => {
          const selecionado = c.slug === ativa;
          const esmaecido = ativa && !selecionado;
          return (
            <Link
              key={c.slug}
              href={selecionado ? "/#achados" : `/?categoria=${c.slug}#achados`}
              scroll={false}
              aria-current={selecionado ? "true" : undefined}
              style={temaCategoria(c.slug)}
              className={`flex h-[136px] shrink-0 snap-start flex-col items-center justify-center gap-0.5 rounded-3xl p-2 transition-[background-color,opacity] duration-200 lg:h-[247px] lg:min-w-[197px] lg:flex-1 lg:gap-1 lg:p-4 ${
                selecionado ? "bg-(--cat-accent)" : "hover:bg-surface-subtle"
              } ${esmaecido ? "opacity-50 hover:opacity-100" : ""}`}
            >
              <img
                src={imagemMascote(c.slug)}
                alt=""
                className="h-[87px] w-[91px] object-cover object-top lg:h-[159px] lg:w-[165px]"
              />
              <span className="flex flex-col items-center whitespace-nowrap">
                <span
                  className={`text-[13.2px] leading-[17.6px] font-semibold tracking-[-0.5px] lg:text-2xl lg:leading-8 lg:tracking-[-1px] ${
                    selecionado ? "text-(--cat-on-accent)" : "text-text-brand"
                  }`}
                >
                  {c.mascote}
                </span>
                <span className={`text-[11px] leading-4 lg:text-sm lg:leading-5 ${selecionado ? "text-(--cat-on-accent)" : "text-text-subtle"}`}>
                  {c.nome}
                </span>
              </span>
            </Link>
          );
        })}
      </nav>
    </section>
  );
}
