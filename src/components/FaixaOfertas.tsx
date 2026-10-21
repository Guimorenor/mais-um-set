import { Icone } from "./Icone";

const frases = [
  "Jogue mais, gaste menos",
  "Promoção boa é igual ace: passa rápido",
  "Até 30% off em raquetes",
  "Achados novos todo dia",
  "Deuce no preço? Aqui não",
  "Bola dentro no seu bolso",
];

// Divisor de seção: faixa lima com frases que correm de lado.
export function FaixaOfertas() {
  const sequencia = (oculto: boolean) => (
    <div aria-hidden={oculto} className="flex shrink-0 items-center gap-4 pr-4 md:gap-6 md:pr-6 lg:gap-8 lg:pr-8">
      {frases.map((f) => (
        <span key={f} className="flex items-center gap-4 md:gap-6 lg:gap-8">
          <span className="text-200 font-bold tracking-slight whitespace-nowrap uppercase md:text-400 lg:text-550">{f}</span>
          <Icone nome="bolinha" tamanho={12} className="max-md:size-2! md:max-lg:size-2.5!" />
        </span>
      ))}
    </div>
  );
  return (
    <div className="flex h-11 items-center overflow-hidden bg-action-accent-default text-text-on-accent md:h-14 lg:h-[72px]">
      <div className="faixa-anima flex">
        {sequencia(false)}
        {sequencia(true)}
      </div>
    </div>
  );
}
