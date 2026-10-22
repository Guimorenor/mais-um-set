"use client";

import Link from "next/link";
import { useState } from "react";
import { imagemMascote, temaCategoria, type Categoria } from "@/lib/categorias";
import type { Oferta } from "@/lib/ofertas";
import { ProductCard } from "./ProductCard";

const POR_VEZ_MOBILE = 6; // múltiplo de 2: as linhas de 2 cards fecham certinho

// "Achados para o próximo set": grade de ofertas (filtrada por categoria ou busca).
export function GradeOfertas({ ofertas, categoria, busca }: { ofertas: Oferta[]; categoria?: Categoria; busca?: string }) {
  const [visiveisMobile, setVisiveisMobile] = useState(POR_VEZ_MOBILE);
  const titulo = busca ? `Resultados para “${busca}”` : categoria ? `Achados em ${categoria.nome}` : "Achados para o próximo set";
  const n = ofertas.length;

  return (
    <section id="achados" className="scroll-mt-24 px-4 pt-4 pb-10 md:px-6 md:pt-8 md:pb-12 lg:px-20 lg:pb-16">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
          <h2 className="text-300 font-semibold text-text-brand md:text-600 md:tracking-snug">{titulo}</h2>
          {categoria && <FiltroAtivo categoria={categoria} />}
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <p className="text-200 font-semibold text-text-subtlest md:text-600 md:tracking-snug">
            {n} {n === 1 ? "oferta" : "ofertas"}
            {categoria ? (
              <> em {categoria.nome}</>
            ) : (
              !busca && <span className="hidden md:inline"> {n === 1 ? "disponível" : "disponíveis"}</span>
            )}
          </p>
          {(categoria || busca) && (
            <Link
              href="/#achados"
              scroll={false}
              className="flex h-10 items-center justify-center rounded-full border border-border-default bg-action-secondary-default px-4 text-200 leading-300 font-semibold whitespace-nowrap text-text-default transition-[background-color,scale,translate] duration-300 ease-suave hover:-translate-y-0.5 hover:scale-105 hover:bg-action-secondary-hover active:scale-95 md:h-12 md:px-5 md:text-300 md:leading-400"
            >
              Ver todos os produtos
            </Link>
          )}
        </div>
      </div>

      {n === 0 ? (
        <p className="mt-8 text-400 text-text-subtle">Nenhum achado por aqui ainda. Tente outra busca ou categoria.</p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 md:mt-6 md:gap-y-6 lg:gap-x-6 lg:gap-y-8 xl:grid-cols-3 2xl:grid-cols-4">
          {ofertas.map((o, i) => (
            <div key={o.id} className={`surgir flex ${i >= visiveisMobile ? "max-lg:hidden" : ""}`}>
              <ProductCard oferta={o} />
            </div>
          ))}
        </div>
      )}

      {n > visiveisMobile && (
        <button
          type="button"
          onClick={() => setVisiveisMobile((v) => v + POR_VEZ_MOBILE)}
          className="mt-4 flex w-full items-center md:mx-auto md:mt-6 md:w-fit justify-center rounded-full border border-border-default bg-action-secondary-default px-5 py-3 text-300 leading-400 font-semibold text-text-subtle transition-[background-color,scale,translate] duration-300 ease-suave hover:-translate-y-0.5 hover:scale-105 hover:bg-action-secondary-hover active:scale-95 lg:hidden"
        >
          Carregar mais achados
        </button>
      )}
    </section>
  );
}

/** Tag do filtro ativo: mini mascote + nome, na cor da categoria (Atalho de categoria · Selecionado). */
function FiltroAtivo({ categoria }: { categoria: Categoria }) {
  return (
    <span
      style={temaCategoria(categoria.slug)}
      className="flex shrink-0 items-center gap-2 rounded-full bg-(--cat-accent) py-1.5 pr-4 pl-1.5 text-200 font-semibold whitespace-nowrap text-(--cat-on-accent)"
    >
      <span className="size-8 shrink-0 overflow-hidden rounded-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imagemMascote(categoria.slug)} alt="" width={32} height={33} className="size-full object-cover object-top" />
      </span>
      {categoria.nome}
    </span>
  );
}
