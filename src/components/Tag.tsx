// Tag do DS (Label/S). "destaque" = fundo lima; "contorno" = só borda.
type Props = { children: React.ReactNode; variante?: "destaque" | "contorno"; tamanho?: "sm" | "md" | "lg"; className?: string };

const tamanhos = {
  sm: "px-2 py-1 text-xs leading-4",
  md: "px-2 py-1.5 text-xs leading-4",
  lg: "px-3 py-1.5 text-2xl leading-8 tracking-[-1px]",
};

export function Tag({ children, variante = "destaque", tamanho = "md", className = "" }: Props) {
  const cor =
    variante === "destaque"
      ? "bg-action-accent-default text-text-on-accent"
      : "border border-border-brand text-text-brand";
  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold whitespace-nowrap ${tamanhos[tamanho]} ${cor} ${className}`}>
      {children}
    </span>
  );
}
