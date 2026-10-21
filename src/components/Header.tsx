"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useEffect, useState } from "react";
import { categorias, imagemMascote, temaCategoria, type CategoriaSlug } from "@/lib/categorias";
import { site } from "@/lib/site";
import { AlternarTema } from "./AlternarTema";
import { Busca } from "./Busca";
import { Icone } from "./Icone";
import { Logo } from "./Logo";
import { RolagemLateral } from "./RolagemLateral";

const LIMITE_SCROLL = 120; // px rolados até o header virar pílula flutuante

export function Header({ categoriaAtiva, busca }: { categoriaAtiva?: CategoriaSlug; busca?: string }) {
  const [rolou, setRolou] = useState(false);

  useEffect(() => {
    const aoRolar = () => setRolou(window.scrollY > LIMITE_SCROLL);
    aoRolar();
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => window.removeEventListener("scroll", aoRolar);
  }, []);

  return (
    <>
      {/* Estado "Topo" */}
      <header className="flex flex-col gap-3 border-b border-border-subtle bg-surface-default py-3 md:gap-0 md:py-0">
        <div className="flex items-center gap-2 px-4 md:gap-4 md:px-6 md:pt-5 md:pb-3 lg:gap-8 lg:px-20">
          <Link href="/" aria-label="Mais um Set — início" className="shrink-0">
            <span className="flex md:hidden">
              <Logo altura={42} />
            </span>
            <span className="hidden md:flex">
              <Logo altura={56} />
            </span>
          </Link>
          <div className="hidden flex-1 md:flex">
            <Busca placeholder="Buscar produtos ou marcas" valor={busca} />
          </div>
          <span className="flex-1 md:hidden" />
          <AlternarTema />
          <a
            href={site.whatsapp}
            target="_blank"
            rel="noopener"
            className="flex h-12 min-w-12 shrink-0 items-center justify-center gap-3 rounded-full bg-action-primary-default px-3 text-300 leading-400 font-semibold text-text-on-brand transition-[background-color,transform] duration-300 ease-suave hover:bg-action-primary-hover active:scale-95 lg:px-8"
          >
            <span className="hidden lg:inline">Ofertas no WhatsApp</span>
            <span className="sr-only lg:hidden">Ofertas no WhatsApp</span>
            <Icone nome="whatsapp" tamanho={24} />
          </a>
        </div>
        <div className="flex px-4 md:hidden">
          <Busca placeholder="Buscar achados" tamanho="md" valor={busca} />
        </div>
        <RolagemLateral
          elemento="nav"
          rotulo="Categorias"
          posicaoSetas={{ esquerda: "left-2 md:left-4 lg:left-16", direita: "right-2 md:right-4 lg:right-16" }}
          className="flex snap-x scroll-px-4 gap-2 px-4 md:scroll-px-6 md:gap-3 md:px-6 md:pt-1 md:pb-4 lg:scroll-px-20 lg:px-20"
        >
          {categorias.map((c) => (
            <AtalhoCategoria key={c.slug} slug={c.slug} nome={c.nome} ativo={c.slug === categoriaAtiva} />
          ))}
        </RolagemLateral>
      </header>

      {/* Estado "Scroll": pílula flutuante */}
      <div
        aria-hidden={!rolou}
        className={`fixed inset-x-0 top-0 z-50 px-3 py-2 transition-all duration-200 lg:px-20 lg:py-4 ${
          rolou ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-4 opacity-0"
        }`}
      >
        <div className="vidro flex items-center gap-2 rounded-full p-2 [--vidro-sombra:0_6px_18px_rgba(23,64,51,0.14)] lg:gap-4 lg:px-3 lg:py-2.5 lg:[--vidro-sombra:0_8px_24px_rgba(23,64,51,0.12)]">
          <Link href="/" aria-label="Mais um Set — início" tabIndex={rolou ? 0 : -1} className="flex shrink-0 items-center gap-4">
            <span className="flex lg:hidden">
              <Logo tipo="simbolo" altura={40} />
            </span>
            <span className="hidden lg:flex">
              <Logo altura={44} />
            </span>
          </Link>
          <div className="flex min-w-0 flex-1 lg:hidden">
            <Busca placeholder="Buscar achados" tamanho="md" valor={busca} />
          </div>
          <div className="hidden min-w-0 flex-1 lg:flex">
            <Busca placeholder="Buscar produtos ou marcas" valor={busca} />
          </div>
          <div className="hidden lg:block">
            <AlternarTema />
          </div>
          <a
            href={site.whatsapp}
            target="_blank"
            rel="noopener"
            tabIndex={rolou ? 0 : -1}
            className="flex h-12 min-w-12 shrink-0 items-center justify-center gap-3 rounded-full bg-action-accent-default px-3 text-300 leading-400 font-semibold text-text-on-accent transition-[background-color,transform] duration-300 ease-suave hover:bg-action-accent-hover active:scale-95 lg:px-8"
          >
            <span className="hidden lg:inline">Ofertas no WhatsApp</span>
            <span className="sr-only lg:hidden">Ofertas no WhatsApp</span>
            <Icone nome="whatsapp" tamanho={24} />
          </a>
        </div>
      </div>
    </>
  );
}

function AtalhoCategoria({ slug, nome, ativo }: { slug: CategoriaSlug; nome: string; ativo: boolean }) {
  return (
    <Link
      href={ativo ? "/#achados" : `/?categoria=${slug}#achados`}
      aria-current={ativo ? "page" : undefined}
      style={temaCategoria(slug)}
      className={`group flex shrink-0 snap-start items-center gap-2 rounded-full py-1.5 pr-4 pl-1.5 text-200 font-semibold whitespace-nowrap transition-colors duration-300 ease-suave ${
        ativo ? "bg-(--cat-surface) text-(--cat-text)" : "bg-surface-subtle text-text-default hover:bg-(--cat-surface) hover:text-(--cat-text)"
      }`}
    >
      <span className="size-8 shrink-0 overflow-hidden rounded-full">
        <img src={imagemMascote(slug)} alt="" width={32} height={33} className="size-full object-cover object-top transition-transform duration-500 ease-suave group-hover:scale-125 group-hover:-rotate-6" />
      </span>
      {nome}
    </Link>
  );
}
