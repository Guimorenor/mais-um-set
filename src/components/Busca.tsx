import { Icone } from "./Icone";

// Campo de busca. Envia para a Home com ?busca=..., que filtra a grade de achados.
export function Busca({ placeholder, tamanho = "lg", valor }: { placeholder: string; tamanho?: "md" | "lg"; valor?: string }) {
  return (
    <form action="/" className="min-w-0 flex-1" role="search">
      <label
        className={`flex w-full items-center gap-2 rounded-lg border border-border-input bg-surface-default text-icon-subtle focus-within:border-border-focus focus-within:outline focus-within:outline-1 focus-within:outline-border-focus ${
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
