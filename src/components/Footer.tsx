/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { categorias } from "@/lib/categorias";
import { site } from "@/lib/site";
import { Icone } from "./Icone";

const link = (slug: string) => `/?categoria=${slug}#achados`;

// Rodapé: sempre no visual escuro, nos dois temas.
export function Footer() {
  const colunas = [
    { titulo: "Categorias", itens: categorias.slice(0, 4).map((c) => ({ nome: c.nome, href: link(c.slug) })) },
    { titulo: "Mais", itens: categorias.slice(4).map((c) => ({ nome: c.nome, href: link(c.slug) })) },
    {
      titulo: "Mais um Set",
      itens: [
        { nome: "Como funciona", href: "#" },
        { nome: "Ofertas no WhatsApp", href: site.whatsapp },
        { nome: "Instagram", href: site.instagram },
        { nome: "Contato", href: site.contato },
      ],
    },
  ];

  return (
    <footer data-theme="dark" className="flex flex-col gap-8 bg-surface-default px-4 pt-10 pb-8 text-text-default lg:gap-14 lg:px-20 lg:pt-20 lg:pb-10">
      <div className="flex flex-col gap-0 rounded-[28px] bg-surface-subtle px-5 py-6 lg:flex-row lg:items-center lg:justify-between lg:gap-8 lg:rounded-[40px] lg:px-14 lg:py-12">
        <div className="flex flex-col gap-3">
          <p className="text-sm font-bold tracking-[0.84px] text-text-brand">GRUPO DE OFERTAS · GRÁTIS</p>
          <p className="text-[26px] leading-tight font-bold lg:max-w-[900px] lg:text-[44px]">Receba os achados antes de todo mundo.</p>
          <p className="text-[15px] leading-6 text-text-subtle lg:max-w-[760px] lg:text-lg lg:leading-normal">
            Entre no nosso canal do WhatsApp: as melhores promoções de raquete, bolinha e tênis chegam direto no seu celular.
            Sem spam, só oferta boa.
          </p>
        </div>
        <a
          href={site.whatsapp}
          target="_blank"
          rel="noopener"
          className="mt-6 flex shrink-0 items-center justify-center gap-3 rounded-lg bg-action-accent-default px-8 py-[18px] text-lg leading-6 font-semibold whitespace-nowrap text-text-on-accent transition-colors hover:bg-action-accent-hover lg:mt-0"
        >
          Entrar no grupo de ofertas
          <Icone nome="whatsapp" tamanho={24} />
        </a>
      </div>

      <div className="flex flex-col gap-0 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col gap-4 lg:w-[380px]">
          <img src="/logo/mais-um-set-negative.svg" alt="Mais um Set" width={113} height={56} />
          <p className="text-base text-text-subtle">
            Os melhores achados do tênis, num só lugar. A gente garimpa, você só escolhe.
          </p>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-x-8 gap-y-6 lg:mt-0 lg:flex lg:gap-20">
          {colunas.map((col) => (
            <div key={col.titulo} className="flex flex-col gap-3 whitespace-nowrap">
              <p className="text-[13px] font-bold tracking-[0.78px] text-text-subtlest uppercase">{col.titulo}</p>
              {col.itens.map((i) => (
                <Link key={i.nome} href={i.href} className="text-base font-semibold hover:text-text-brand">
                  {i.nome}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="h-px bg-border-subtle" />

      <div className="flex flex-col gap-0 text-[13px] text-text-subtlest lg:flex-row lg:items-start lg:justify-between lg:gap-8">
        <p className="lg:max-w-[1100px]">
          O Mais um Set não é uma loja. Usamos links de afiliado: se você comprar por eles, podemos receber uma comissão, sem
          custo extra pra você. Preços e estoque são das lojas e podem mudar a qualquer momento.
        </p>
        <p className="whitespace-nowrap">© {new Date().getFullYear()} Mais um Set</p>
      </div>
    </footer>
  );
}
