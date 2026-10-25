/* eslint-disable @next/next/no-img-element */
import { acharCategoria } from "@/lib/categorias";
import { desconto, formatarPreco, verificadoEm, type Oferta } from "@/lib/ofertas";
import { FundoRecortado } from "./CardRecortado";
import { Icone } from "./Icone";
import { Tag } from "./Tag";

// Destaques vêm das fichas publicadas com "Achado da vez" / "Destaque secundário" no painel.
export function Hero({ achado, secundarios }: { achado: Oferta | null; secundarios: Oferta[] }) {
  return (
    <section className="flex flex-col gap-4 px-4 py-6 md:gap-6 md:px-6 md:pt-10 lg:gap-8 lg:px-20 lg:py-16 min-[1700px]:flex-row">
      <div className="flex min-w-0 flex-1 flex-col gap-4 md:gap-6 lg:gap-8">
        <div className="flex flex-col gap-4 lg:gap-2">
          <h1 className="font-serif text-900 tracking-snug text-text-brand md:text-1050 lg:text-1200">
            <span className="block">Jogue mais.</span>
            <span className="-mt-[8.8px] block md:-mt-[12.8px] lg:-mt-4">
              Gaste <span className="text-text-subtlest">menos.</span>
            </span>
          </h1>
          <p className="text-250 text-text-subtle md:text-400 md:text-text-default">
            Achados de tênis selecionados para você economizar dentro e fora da quadra.
          </p>
        </div>

        {/* Mobile: o destaque principal vem logo após o título */}
        <div className="lg:hidden">
          <AchadoDaVez o={achado} />
        </div>

        <div className="hidden gap-2 lg:flex">
          {secundarios.map((o) => (
            <DestaqueSecundarioDesktop key={o.id} oferta={o} />
          ))}
        </div>
      </div>

      <div className="hidden min-w-0 flex-1 lg:block">
        <AchadoDaVez o={achado} />
      </div>

      {/* Tablet: os dois destaques secundários lado a lado */}
      <div className="hidden gap-4 md:flex lg:hidden">
        {secundarios.map((o) => (
          <DestaqueSecundarioTablet key={o.id} oferta={o} />
        ))}
      </div>

      {/* Mobile: carrossel dos destaques secundários */}
      <div className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] md:hidden">
        {secundarios.map((o) => (
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
  if (!oferta.precoDe || !desconto(oferta)) return null;
  return (
    <p className={className}>
      De <span className="line-through">{formatarPreco(oferta.precoDe)}</span>
    </p>
  );
}

function Desconto({ oferta, tamanho }: { oferta: Oferta; tamanho?: "lg" }) {
  const pct = desconto(oferta);
  return pct ? <Tag tamanho={tamanho}>- {pct}%</Tag> : null;
}

function DestaqueSecundarioDesktop({ oferta }: { oferta: Oferta }) {
  return (
    <article className="group relative h-[314px] min-w-0 flex-1 overflow-hidden">
      <FundoRecortado raio={64} raioRecorte={24} larguraRecorte={125.44} alturaRecorte={97.7} />
      <img
        src={oferta.imagem}
        alt=""
        className="pointer-events-none absolute top-7 right-[18px] h-[167px] w-[135px] object-contain transition-transform duration-500 ease-suave group-hover:-translate-y-2 group-hover:-rotate-3 group-hover:scale-105"
      />
      <div className="absolute top-[37px] left-6 flex w-[237px] flex-col items-start gap-3">
        <Tag tamanho="sm">{rotuloCategoria(oferta)}</Tag>
        <h3 className="line-clamp-2 text-650 font-bold tracking-snug text-text-brand">{oferta.titulo}</h3>
      </div>
      <div className="absolute bottom-6 left-6 flex flex-col gap-4 text-text-subtlest">
        <DePor oferta={oferta} className="text-300 leading-400 font-semibold tracking-snug [&>span]:text-400 [&>span]:leading-500" />
        <div className="flex items-center gap-1">
          <p className="text-900 leading-900 font-bold tracking-tighter whitespace-nowrap text-text-brand">
            {formatarPreco(oferta.precoPor)}
          </p>
          <Desconto oferta={oferta} />
        </div>
      </div>
      <a
        href={oferta.link}
        target="_blank"
        rel="sponsored noopener"
        aria-label={`Ver oferta: ${oferta.titulo}`}
        className="absolute right-0 bottom-0 flex h-[90px] w-[117px] items-center justify-center rounded-3xl bg-action-primary-default text-text-on-brand transition-[background-color,transform,scale,translate,rotate] duration-300 ease-suave origin-bottom-right group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 group-hover:scale-105 group-hover:bg-action-primary-hover active:scale-95 after:absolute after:-inset-[999px] after:content-['']"
      >
        <Icone nome="link-externo" tamanho={40} />
      </a>
    </article>
  );
}

function DestaqueSecundarioTablet({ oferta }: { oferta: Oferta }) {
  return (
    <article className="group relative flex h-60 min-w-0 flex-1 flex-col gap-5 overflow-hidden p-6">
      <FundoRecortado raio={40} raioRecorte={20} larguraRecorte={96} alturaRecorte={80} />
      <img
        src={oferta.imagem}
        alt=""
        className="pointer-events-none absolute top-4 right-5 h-[140px] w-[130px] object-contain transition-transform duration-500 ease-suave group-hover:-translate-y-2 group-hover:-rotate-3 group-hover:scale-105"
      />
      <div className="relative flex flex-col items-start gap-2 pr-[120px]">
        <Tag tamanho="sm">{rotuloCategoria(oferta)}</Tag>
        <h3 className="line-clamp-2 text-650 font-bold tracking-snug text-text-brand">{oferta.titulo}</h3>
      </div>
      <div className="relative flex flex-col gap-1">
        <DePor oferta={oferta} className="text-200 font-semibold text-text-subtlest" />
        <div className="flex items-center gap-2">
          <p className="text-800 font-bold tracking-tight whitespace-nowrap text-text-brand">{formatarPreco(oferta.precoPor)}</p>
          <Desconto oferta={oferta} />
        </div>
      </div>
      <a
        href={oferta.link}
        target="_blank"
        rel="sponsored noopener"
        aria-label={`Ver oferta: ${oferta.titulo}`}
        className="absolute right-0 bottom-0 flex h-[72px] w-[88px] items-center justify-center rounded-[20px] bg-action-primary-default text-text-on-brand transition-[background-color,transform,scale,translate,rotate] duration-300 ease-suave origin-bottom-right group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 group-hover:scale-105 group-hover:bg-action-primary-hover active:scale-95 after:absolute after:-inset-[999px] after:content-['']"
      >
        <Icone nome="link-externo" tamanho={32} />
      </a>
    </article>
  );
}

function DestaqueSecundarioMobile({ oferta }: { oferta: Oferta }) {
  return (
    <article className="group relative flex h-[175px] w-[300px] shrink-0 snap-start sm:w-auto sm:min-w-[300px] sm:flex-1 flex-col gap-4 overflow-hidden p-4">
      <FundoRecortado raio={32} raioRecorte={20} larguraRecorte={64.44} alturaRecorte={52.7} />
      <img
        src={oferta.imagem}
        alt=""
        className="pointer-events-none absolute top-[3px] right-[22px] h-[114px] w-[105px] object-contain transition-transform duration-500 ease-suave group-hover:-translate-y-2 group-hover:-rotate-3 group-hover:scale-105"
      />
      <div className="relative flex flex-col items-start gap-2 pr-[110px]">
        <Tag tamanho="sm">{rotuloCategoria(oferta)}</Tag>
        <h3 className="line-clamp-3 text-500 font-bold text-text-brand">{oferta.titulo}</h3>
      </div>
      <div className="relative flex flex-col gap-0.5">
        <DePor oferta={oferta} className="text-150 font-semibold text-text-subtlest" />
        <div className="flex items-center gap-2">
          <p className="text-600 font-bold whitespace-nowrap text-text-brand">{formatarPreco(oferta.precoPor)}</p>
          <Desconto oferta={oferta} />
        </div>
      </div>
      <a
        href={oferta.link}
        target="_blank"
        rel="sponsored noopener"
        aria-label={`Ver oferta: ${oferta.titulo}`}
        className="absolute right-0 bottom-0 flex h-12 w-[60px] items-center justify-center rounded-2xl bg-action-primary-default text-text-on-brand transition-[background-color,transform,scale,translate,rotate] duration-300 ease-suave origin-bottom-right group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 group-hover:scale-105 group-hover:bg-action-primary-hover active:scale-95 after:absolute after:-inset-[999px] after:content-['']"
      >
        <Icone nome="link-externo" tamanho={28} />
      </a>
    </article>
  );
}

/** Card grande "Achado da vez": sempre no visual escuro, nos dois temas. Sem achado, um aviso de "em breve". */
function AchadoDaVez({ o }: { o: Oferta | null }) {
  if (!o) {
    return (
      <article
        data-theme="dark"
        className="relative flex flex-col justify-center gap-3 overflow-hidden rounded-[28px] bg-surface-overlay p-6 text-text-default md:rounded-[40px] md:p-10 lg:h-[558px] lg:rounded-[64px] lg:p-[60px]"
      >
        <img src="/home/hero-quadra.webp" alt="" className="pointer-events-none absolute inset-0 size-full object-cover" />
        <div className="relative flex flex-col items-start gap-3 lg:gap-6">
          <Tag variante="contorno">Achado da vez</Tag>
          <h2 className="text-700 font-black md:text-900 md:tracking-tighter lg:text-1000">Novos achados chegando.</h2>
          <p className="text-300 text-text-subtle md:text-400">Estamos garimpando as próximas ofertas. Volte em breve!</p>
        </div>
      </article>
    );
  }
  const pct = desconto(o);
  return (
    <article
      data-theme="dark"
      className="group/achado relative flex flex-col gap-3 overflow-hidden rounded-[28px] bg-surface-overlay px-5 pt-5 pb-6 text-text-default md:flex-row md:items-center md:gap-6 md:rounded-[40px] md:p-10 md:pr-6 lg:h-[558px] lg:rounded-[64px] lg:p-0"
    >
      <img src="/home/hero-quadra.webp" alt="" className="pointer-events-none absolute inset-0 size-full object-cover transition-transform duration-[1200ms] ease-suave group-hover/achado:scale-[1.03]" />

      {/* foto do produto (vem da loja: fica numa moldura clara arredondada) */}
      <div className="pointer-events-none absolute top-[42px] right-3 size-[150px] overflow-hidden rounded-3xl bg-white p-2 sm:size-[180px] md:relative md:top-auto md:right-auto md:order-last md:size-[300px] md:shrink-0 md:rounded-[32px] lg:absolute lg:top-1/2 lg:right-[60px] lg:h-auto lg:w-[min(400px,calc(100%-620px))] lg:aspect-square lg:-translate-y-1/2 lg:rounded-[40px]">
        <img
          src={o.imagem}
          alt=""
          className="size-full object-contain transition-transform duration-700 ease-suave group-hover/achado:-translate-y-1 group-hover/achado:scale-105"
        />
      </div>

      <div className="relative flex flex-col gap-3 md:min-w-0 md:flex-1 md:gap-4 lg:absolute lg:top-1/2 lg:left-[60px] lg:w-[500px] lg:-translate-y-1/2 lg:gap-8">
        <div className="flex flex-col gap-3 lg:gap-2">
          <div className="flex gap-2">
            <Tag>{rotuloCategoria(o)}</Tag>
            <Tag variante="contorno">Achado da vez</Tag>
          </div>
          <h2 className="max-w-[calc(100%-165px)] text-700 font-black sm:max-w-[calc(100%-195px)] line-clamp-4 md:max-w-none md:text-900 md:tracking-tighter lg:line-clamp-3 lg:w-auto lg:text-800">
            {o.titulo}
          </h2>
        </div>
        <div className="flex flex-col gap-0.5 md:gap-1 lg:gap-2">
          {o.precoDe && pct && (
            <>
              <p className="text-200 font-semibold text-text-subtle line-through md:text-400 lg:hidden">De {formatarPreco(o.precoDe)}</p>
              <p className="hidden text-500 leading-500 font-semibold tracking-snug lg:block">
                De <span className="text-700 leading-700 tracking-tight line-through">{formatarPreco(o.precoDe)}</span>
              </p>
            </>
          )}
          <div className="flex items-center gap-2 md:gap-4">
            <p className="text-800 font-black whitespace-nowrap md:text-1000 md:tracking-tighter lg:text-1100">
              {formatarPreco(o.precoPor)}
            </p>
            {pct && (
              <>
                <span className="flex lg:hidden">
                  <Tag>-{pct}%</Tag>
                </span>
                <span className="hidden lg:flex">
                  <Tag tamanho="lg">- {pct}%</Tag>
                </span>
              </>
            )}
          </div>
          <p className="text-100 text-text-subtle md:text-200">Preço verificado {verificadoEm(o.verificadoEm)}</p>
        </div>
        <a
          href={o.link}
          target="_blank"
          rel="sponsored noopener"
          className="group/botao vidro flex h-12 w-full items-center justify-center gap-3 self-start rounded-full px-5 text-300 leading-400 font-semibold text-text-default transition-[background-color,transform,scale,translate,rotate] duration-300 ease-suave [--vidro-fundo:var(--surface-glass-thin)] hover:-translate-y-0.5 hover:scale-105 hover:[--vidro-fundo:var(--surface-glass)] active:scale-95 sm:w-auto"
        >
          Ver oferta na loja
          <Icone nome="link-externo" tamanho={24} />
        </a>
      </div>
    </article>
  );
}
