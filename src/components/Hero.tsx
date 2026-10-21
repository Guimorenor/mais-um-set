/* eslint-disable @next/next/no-img-element */
import { acharCategoria } from "@/lib/categorias";
import { achadoDaVez, desconto, destaquesSecundarios, formatarPreco, type Oferta } from "@/lib/ofertas";
import { FundoRecortado } from "./CardRecortado";
import { Icone } from "./Icone";
import { Tag } from "./Tag";

export function Hero() {
  return (
    <section className="flex flex-col gap-4 px-4 py-6 lg:gap-8 lg:px-20 lg:py-16 2xl:flex-row">
      <div className="flex min-w-0 flex-1 flex-col gap-4 lg:gap-8">
        <div className="flex flex-col gap-4 lg:gap-2">
          <h1 className="font-serif text-900  tracking-snug text-text-brand lg:text-1200 lg:tracking-snug">
            <span className="block">Jogue mais.</span>
            <span className="-mt-[8.8px] block lg:-mt-4">
              Gaste <span className="text-text-subtlest">menos.</span>
            </span>
          </h1>
          <p className="text-250 text-text-subtle lg:text-400 lg:leading-500 lg:text-text-default">
            Achados de tênis selecionados para você economizar dentro e fora da quadra.
          </p>
        </div>

        {/* Mobile: o destaque principal vem logo após o título */}
        <div className="lg:hidden">
          <AchadoDaVez />
        </div>

        <div className="hidden gap-2 lg:flex">
          {destaquesSecundarios.map((o) => (
            <DestaqueSecundarioDesktop key={o.id} oferta={o} />
          ))}
        </div>
      </div>

      <div className="hidden min-w-0 flex-1 lg:block">
        <AchadoDaVez />
      </div>

      {/* Mobile: carrossel dos destaques secundários */}
      <div className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] lg:hidden">
        {destaquesSecundarios.map((o) => (
          <DestaqueSecundarioMobile key={o.id} oferta={o} />
        ))}
      </div>
    </section>
  );
}

function rotuloCategoria(o: Oferta) {
  return acharCategoria(o.categoria)?.nome ?? "";
}

function DePor({ oferta, className = "" }: { oferta: Oferta; className?: string }) {
  return (
    <p className={className}>
      De <span className="line-through">{formatarPreco(oferta.precoDe)}</span>
    </p>
  );
}

function DestaqueSecundarioDesktop({ oferta }: { oferta: Oferta }) {
  return (
    <article className="relative h-[314px] min-w-0 flex-1 overflow-hidden">
      <FundoRecortado raio={64} raioRecorte={24} larguraRecorte={125.44} alturaRecorte={97.7} />
      <img
        src={oferta.imagem}
        alt=""
        className="pointer-events-none absolute top-7 right-[18px] h-[167px] w-[135px] object-contain"
      />
      <div className="absolute top-[37px] left-6 flex w-[237px] flex-col items-start gap-3">
        <Tag tamanho="sm">{rotuloCategoria(oferta)}</Tag>
        <h3 className="text-800 leading-800 font-bold tracking-tight text-text-brand">{oferta.titulo}</h3>
      </div>
      <div className="absolute bottom-6 left-6 flex flex-col gap-4 text-text-subtlest">
        <DePor oferta={oferta} className="text-300 leading-400 font-semibold tracking-snug [&>span]:text-400 [&>span]:leading-500" />
        <div className="flex items-center gap-1">
          <p className="text-900 leading-900 font-bold tracking-tighter whitespace-nowrap text-text-brand">
            {formatarPreco(oferta.precoPor)}
          </p>
          <Tag>- {desconto(oferta)}%</Tag>
        </div>
      </div>
      <a
        href={oferta.link}
        target="_blank"
        rel="sponsored noopener"
        aria-label={`Ver oferta: ${oferta.titulo}`}
        className="absolute right-0 bottom-0 flex h-[90px] w-[117px] items-center justify-center rounded-3xl bg-action-primary-default text-text-on-brand transition-colors hover:bg-action-primary-hover"
      >
        <Icone nome="link-externo" tamanho={40} />
      </a>
    </article>
  );
}

function DestaqueSecundarioMobile({ oferta }: { oferta: Oferta }) {
  return (
    <article className="relative flex h-[175px] w-[300px] shrink-0 snap-start flex-col gap-4 overflow-hidden p-4">
      <FundoRecortado raio={32} raioRecorte={20} larguraRecorte={64.44} alturaRecorte={52.7} />
      <img
        src={oferta.imagem}
        alt=""
        className="pointer-events-none absolute top-[3px] right-[22px] h-[114px] w-[105px] object-contain"
      />
      <div className="relative flex flex-col items-start gap-2 pr-[110px]">
        <Tag tamanho="sm">{rotuloCategoria(oferta)}</Tag>
        <h3 className="text-500 font-bold text-text-brand">{oferta.titulo}</h3>
      </div>
      <div className="relative flex flex-col gap-0.5">
        <DePor oferta={oferta} className="text-150 font-semibold text-text-subtlest" />
        <div className="flex items-center gap-2">
          <p className="text-600 font-bold whitespace-nowrap text-text-brand">{formatarPreco(oferta.precoPor)}</p>
          <Tag>- {desconto(oferta)}%</Tag>
        </div>
      </div>
      <a
        href={oferta.link}
        target="_blank"
        rel="sponsored noopener"
        aria-label={`Ver oferta: ${oferta.titulo}`}
        className="absolute right-0 bottom-0 flex h-12 w-[60px] items-center justify-center rounded-2xl bg-action-primary-default text-text-on-brand transition-colors hover:bg-action-primary-hover"
      >
        <Icone nome="link-externo" tamanho={28} />
      </a>
    </article>
  );
}

/** Card grande "Achado da vez": sempre no visual escuro, nos dois temas. */
function AchadoDaVez() {
  const o = achadoDaVez;
  return (
    <article
      data-theme="dark"
      className="relative flex flex-col gap-3 overflow-hidden rounded-[28px] bg-surface-overlay px-5 pt-5 pb-6 text-text-default lg:h-[558px] lg:rounded-[64px] lg:p-0"
    >
      <img src="/home/hero-quadra.webp" alt="" className="pointer-events-none absolute inset-0 size-full object-cover" />

      {/* raquete (espelhada, como no Figma) */}
      <div className="pointer-events-none absolute top-[42px] left-[122px] h-[267px] w-[228px] -scale-x-100 overflow-hidden lg:top-8 lg:left-[462px] lg:h-[477px] lg:w-[406px]">
        <img src={o.imagem} alt="" className="absolute top-[-4.58%] left-[-14.14%] h-[107.74%] w-[126.6%] max-w-none" />
      </div>

      <div className="relative flex flex-col gap-3 lg:absolute lg:top-1/2 lg:left-[60px] lg:w-[466px] lg:-translate-y-1/2 lg:gap-12">
        <div className="flex flex-col gap-3 lg:gap-2">
          <div className="flex gap-2">
            <Tag>{o.rotulo}</Tag>
            <Tag variante="contorno">Achado da vez</Tag>
          </div>
          <h2 className="w-[190px] text-700 font-black lg:w-auto lg:text-1000 lg:leading-1000 lg:tracking-tighter">
            {o.titulo}
          </h2>
        </div>
        <div className="flex flex-col gap-0.5 lg:gap-2">
          <p className="text-200 font-semibold text-text-subtle line-through lg:hidden">De {formatarPreco(o.precoDe)}</p>
          <p className="hidden text-500 leading-500 font-semibold tracking-snug lg:block">
            De <span className="text-700 leading-700 tracking-tight line-through">{formatarPreco(o.precoDe)}</span>
          </p>
          <div className="flex items-center gap-2 lg:gap-4">
            <p className="text-800 font-black whitespace-nowrap lg:text-1100 lg:leading-1100 lg:tracking-tighter">
              {formatarPreco(o.precoPor)}
            </p>
            <span className="flex lg:hidden">
              <Tag>-{desconto(o)}%</Tag>
            </span>
            <span className="hidden lg:flex">
              <Tag tamanho="lg">- {desconto(o)}%</Tag>
            </span>
          </div>
        </div>
        <a
          href={o.link}
          target="_blank"
          rel="sponsored noopener"
          className="flex h-12 w-full items-center justify-center gap-3 self-start rounded-lg border border-border-default bg-action-secondary-default px-5 text-300 leading-400 font-semibold text-text-subtle transition-colors hover:bg-action-secondary-hover lg:w-auto"
        >
          Ver oferta na loja
          <Icone nome="link-externo" tamanho={24} />
        </a>
      </div>

      {o.video && (
        <a
          href={o.link}
          target="_blank"
          rel="sponsored noopener"
          className="absolute right-9 bottom-[31px] hidden h-[167px] w-[268px] overflow-hidden rounded-[32px] bg-text-default p-2 lg:block"
        >
          <span className="relative block h-[200px] overflow-hidden rounded-[28px]">
            <img src={o.video.thumb} alt="" className="absolute top-[-30.9%] left-0 h-[241.5%] w-full max-w-none" />
            <span className="absolute inset-0 bg-surface-scrim" />
          </span>
          <span className="absolute inset-x-0 bottom-0 flex items-center justify-center rounded-b-[32px] bg-action-accent-default p-2 text-400 leading-500 font-semibold text-text-on-accent">
            {o.video.chamada}
          </span>
          <span className="absolute top-[calc(50%-0.5px)] left-1/2 flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-surface-scrim text-white">
            <Icone nome="play" tamanho={19} />
          </span>
        </a>
      )}
    </article>
  );
}
