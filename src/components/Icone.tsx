// Ícone colorido pela cor do texto (currentColor): o SVG do Figma vira uma
// máscara, então o mesmo arquivo serve para qualquer token de cor e para o modo escuro.
type Props = { nome: string; tamanho?: number; className?: string };

export function Icone({ nome, tamanho = 20, className = "" }: Props) {
  const url = `url(/icones/${nome}.svg)`;
  return (
    <span
      aria-hidden
      className={`inline-block shrink-0 bg-current ${className}`}
      style={{
        width: tamanho,
        height: tamanho,
        maskImage: url,
        WebkitMaskImage: url,
        maskSize: "contain",
        WebkitMaskSize: "contain",
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskPosition: "center",
      }}
    />
  );
}
