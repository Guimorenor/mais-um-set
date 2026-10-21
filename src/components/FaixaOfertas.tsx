// Divisor de seção: faixa lima com a marca e o slogan passando bem devagar.
// Para quando o mouse está em cima e fica parada para quem pede menos movimento.
const frases = ["Mais um Set", "Jogue mais, gaste menos"];

export function FaixaOfertas() {
  const sequencia = (oculto: boolean) => (
    <div aria-hidden={oculto} className="flex shrink-0 items-center">
      {Array.from({ length: 4 }, (_, i) =>
        frases.map((f) => (
          <span
            key={`${i}-${f}`}
            className="px-8 text-200 font-bold tracking-slight whitespace-nowrap uppercase md:px-12 md:text-400 lg:px-16 lg:text-550"
          >
            {f}
          </span>
        )),
      )}
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
