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
    <div aria-hidden={oculto} className="flex shrink-0 items-center gap-4 pr-4 lg:gap-8 lg:pr-8">
      {frases.map((f) => (
        <span key={f} className="flex items-center gap-4 lg:gap-8">
          <span className="text-200 font-bold tracking-slight whitespace-nowrap uppercase lg:text-550 lg:tracking-slight">{f}</span>
          <Icone nome="bolinha" tamanho={12} className="max-lg:size-2!" />
        </span>
      ))}
    </div>
  );
  return (
    <div className="flex h-11 items-center overflow-hidden bg-action-accent-default text-text-on-accent lg:h-[72px]">
      <div className="faixa-anima flex">
        {sequencia(false)}
        {sequencia(true)}
      </div>
    </div>
  );
}
