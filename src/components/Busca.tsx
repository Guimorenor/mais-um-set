import { Icone } from "./Icone";

// Campo de busca. Envia para a Home com ?busca=..., que filtra a grade de achados.
// variante "vidro": usada dentro da pílula flutuante — fundo Glass translúcido, sem borda.
export function Busca({
  placeholder,
  tamanho = "lg",
  valor,
  variante = "padrao",
}: {
  placeholder: string;
  tamanho?: "md" | "lg";
  valor?: string;
  variante?: "padrao" | "vidro";
}) {
  const visual =
    variante === "vidro"
      ? "bg-surface-glass-thin outline-transparent focus-within:bg-surface-glass focus-within:outline-2 focus-within:outline-border-focus"
      : "border border-border-input bg-surface-default focus-within:border-border-focus focus-within:outline focus-within:outline-1 focus-within:outline-border-focus";
  return (
    <form action="/" className="min-w-0 flex-1" role="search">
      <label
        className={`flex w-full items-center gap-2 rounded-full text-icon-subtle transition-colors duration-300 ease-suave ${visual} ${
          tamanho === "lg" ? "px-4 py-3" : "px-3 py-2"
        }`}
      >
        <Icone nome="search" />
        <span className="sr-only">Buscar</span>
        <input
          type="search"
          name="busca"
          defaultValue={valor}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-300 leading-400 text-text-default outline-none placeholder:text-text-placeholder"
        />
      </label>
    </form>
  );
}
