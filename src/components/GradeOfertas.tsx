"use client";

import Link from "next/link";
import { useState } from "react";
import type { Categoria } from "@/lib/categorias";
import type { Oferta } from "@/lib/ofertas";
import { ProductCard } from "./ProductCard";

const POR_VEZ_MOBILE = 4;

// "Achados para o próximo set": grade de ofertas (filtrada por categoria ou busca).
export function GradeOfertas({ ofertas, categoria, busca }: { ofertas: Oferta[]; categoria?: Categoria; busca?: string }) {
  const [visiveisMobile, setVisiveisMobile] = useState(POR_VEZ_MOBILE);
  const titulo = busca ? `Resultados para “${busca}”` : categoria ? categoria.nome : "Achados para o próximo set";
  const n = ofertas.length;

  return (
    <section id="achados" className="scroll-mt-24 px-4 pt-4 pb-10 md:px-6 md:pt-8 md:pb-12 lg:px-20 lg:pb-16">
      <div className="flex items-center justify-between gap-4 text-300 font-semibold md:text-600 md:tracking-snug">
        <h2 className="text-text-brand">{titulo}</h2>
        <p className="shrink-0 text-200 text-text-subtlest md:text-600">
          {n} {n === 1 ? "oferta" : "ofertas"}
          <span className="hidden md:inline"> {n === 1 ? "disponível" : "disponíveis"}</span>
        </p>
      </div>

      {(categoria || busca) && (
        <Link href="/#achados" scroll={false} className="mt-2 inline-block text-200 font-semibold text-text-link underline hover:text-text-link-hover">
          Ver todos os achados
        </Link>
      )}

      {n === 0 ? (
        <p className="mt-8 text-400 text-text-subtle">Nenhum achado por aqui ainda. Tente outra busca ou categoria.</p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:mt-6 md:gap-y-6 lg:gap-x-6 lg:gap-y-8 xl:grid-cols-3 2xl:grid-cols-4">
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
          className="mt-4 flex w-full items-center md:mx-auto md:mt-6 md:w-fit justify-center rounded-full border border-border-default bg-action-secondary-default px-5 py-3 text-300 leading-400 font-semibold text-text-subtle transition-colors hover:bg-action-secondary-hover lg:hidden"
        >
          Carregar mais achados
        </button>
      )}
    </section>
  );
}
