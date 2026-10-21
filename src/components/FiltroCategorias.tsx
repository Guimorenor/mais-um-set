/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { categorias, imagemMascote, temaCategoria, type CategoriaSlug } from "@/lib/categorias";
import { RolagemLateral } from "./RolagemLateral";

// "Qual é a desculpa de hoje?" — os mascotes funcionam como filtro de categoria.
// Hover: fundo na cor da categoria (category-<slug>-surface) e o mascote dá um pulinho.
export function FiltroCategorias({ ativa }: { ativa?: CategoriaSlug }) {
  return (
    <section className="flex flex-col gap-4 pt-8 pb-4 md:gap-6 md:px-6 md:pt-12 md:pb-6 lg:gap-8 lg:px-20 lg:pt-16 lg:pb-0">
      <div className="flex flex-col gap-1 px-4 md:gap-2 md:px-0 lg:flex-row lg:items-center lg:justify-between">
        <h2 className="font-serif text-700 tracking-snug text-text-brand md:text-900 lg:text-1050">
          Qual é a desculpa de hoje?
        </h2>
        <p className="text-250 font-semibold text-text-subtle md:text-400 lg:text-600 lg:tracking-snug">
          Escolha uma categoria para ver os achados.
        </p>
      </div>
      <RolagemLateral
        elemento="nav"
        rotulo="Filtrar por categoria"
        posicaoSetas={{ esquerda: "left-2 md:left-3", direita: "right-2 md:right-3" }}
        className="flex snap-x scroll-px-4 gap-1 px-4 md:scroll-px-6 md:gap-2 md:rounded-2xl md:bg-surface-sunken md:p-6 lg:scroll-px-8 lg:p-8"
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
              className={`group flex h-[136px] shrink-0 snap-start flex-col items-center justify-center gap-0.5 rounded-3xl p-2 transition-[background-color,opacity,transform] duration-300 ease-suave active:scale-[0.97] md:h-[247px] md:min-w-[197px] md:gap-1 md:p-4 lg:flex-1 ${
                selecionado ? "bg-(--cat-accent)" : "hover:bg-(--cat-surface)"
              } ${esmaecido ? "opacity-50 hover:opacity-100" : ""}`}
            >
              <img
                src={imagemMascote(c.slug)}
                alt=""
                className="h-[87px] w-[91px] object-cover object-top transition-transform duration-500 ease-suave group-hover:-translate-y-2 group-hover:-rotate-3 group-hover:scale-105 md:h-[159px] md:w-[165px]"
              />
              <span className="flex flex-col items-center whitespace-nowrap">
                <span
                  className={`text-200 leading-300 font-semibold tracking-snug md:text-600 md:leading-600 ${
                    selecionado ? "text-(--cat-on-accent)" : "text-text-brand group-hover:text-(--cat-text)"
                  }`}
                >
                  {c.mascote}
                </span>
                <span
                  className={`text-50 md:text-200 md:leading-300 ${
                    selecionado ? "text-(--cat-on-accent)" : "text-text-subtle group-hover:text-(--cat-text)"
                  }`}
                >
                  {c.nome}
                </span>
              </span>
            </Link>
          );
        })}
      </RolagemLateral>
    </section>
  );
}
