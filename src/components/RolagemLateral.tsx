"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Icone } from "./Icone";

type Props = {
  children: React.ReactNode;
  /** classes do trilho que rola (padding, gap, fundo…) */
  className?: string;
  rotulo: string;
  elemento?: "nav" | "div";
  /** distância das setas até a borda (classes Tailwind de left/right) */
  posicaoSetas?: { esquerda: string; direita: string };
};

// Trilho com rolagem lateral. No toque e no trackpad rola com o dedo; com mouse,
// aparecem setas Glass nas pontas sempre que há conteúdo escondido daquele lado.
export function RolagemLateral({
  children,
  className = "",
  rotulo,
  elemento = "div",
  posicaoSetas = { esquerda: "left-2", direita: "right-2" },
}: Props) {
  const trilho = useRef<HTMLDivElement & HTMLElement>(null);
  const [lados, setLados] = useState({ esquerda: false, direita: false });

  const medir = useCallback(() => {
    const el = trilho.current;
    if (!el) return;
    setLados({
      esquerda: el.scrollLeft > 4,
      direita: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
    });
  }, []);

  useEffect(() => {
    const el = trilho.current;
    if (!el) return;
    medir();
    el.addEventListener("scroll", medir, { passive: true });
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", medir);
      ro.disconnect();
    };
  }, [medir]);

  const rolar = (direcao: 1 | -1) => {
    const el = trilho.current;
    if (!el) return;
    el.scrollBy({ left: direcao * el.clientWidth * 0.8, behavior: "smooth" });
  };

  const Trilho = elemento;
  const seta = (direcao: 1 | -1, visivel: boolean) => (
    <button
      type="button"
      onClick={() => rolar(direcao)}
      aria-label={direcao === 1 ? "Ver mais à direita" : "Ver mais à esquerda"}
      tabIndex={visivel ? 0 : -1}
      className={`vidro absolute top-1/2 z-10 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full text-icon-default transition-[opacity,transform,scale] duration-300 ease-suave hover:scale-110 active:scale-95 pointer-fine:flex ${
        direcao === 1 ? posicaoSetas.direita : posicaoSetas.esquerda
      } ${visivel ? "opacity-100" : "pointer-events-none scale-75 opacity-0"}`}
    >
      <Icone nome="seta" tamanho={20} className={direcao === -1 ? "rotate-180" : ""} />
    </button>
  );

  return (
    <div className="relative min-w-0">
      <Trilho ref={trilho} aria-label={rotulo} className={`overflow-x-auto overscroll-x-contain scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`}>
        {children}
      </Trilho>
      {seta(-1, lados.esquerda)}
      {seta(1, lados.direita)}
    </div>
  );
}
