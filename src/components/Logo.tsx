/* eslint-disable @next/next/no-img-element */
// Logo oficial. Color no modo claro, Negative no escuro (troca sozinha pelo tema).
type Props = { tipo?: "horizontal" | "simbolo"; className?: string; altura?: number };

export function Logo({ tipo = "horizontal", className = "", altura = 56 }: Props) {
  const arquivo = tipo === "horizontal" ? "mais-um-set" : "simbolo";
  const largura = Math.round(altura * (tipo === "horizontal" ? 113 / 56 : 46 / 56));
  return (
    <span className={`relative inline-block shrink-0 ${className}`} style={{ width: largura, height: altura }}>
      <img src={`/logo/${arquivo}-color.svg`} alt="Mais um Set" width={largura} height={altura} className="block size-full dark:hidden" />
      <img src={`/logo/${arquivo}-negative.svg`} alt="Mais um Set" width={largura} height={altura} className="hidden size-full dark:block" />
    </span>
  );
}
