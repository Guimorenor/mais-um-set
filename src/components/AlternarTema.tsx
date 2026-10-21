"use client";

import { useEffect, useState } from "react";
import { Icone } from "./Icone";

type Tema = "light" | "dark";

// Switch claro/escuro. Começa pela preferência do sistema; a escolha fica salva no navegador.
export function AlternarTema() {
  const [tema, setTema] = useState<Tema | null>(null);

  useEffect(() => {
    setTema(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
  }, []);

  function escolher(novo: Tema) {
    document.documentElement.dataset.theme = novo;
    try {
      localStorage.setItem("tema", novo);
    } catch {}
    setTema(novo);
  }

  const opcao = (valor: Tema, icone: string, rotulo: string) => {
    const ativo = tema === valor;
    return (
      <button
        type="button"
        onClick={() => escolher(valor)}
        aria-pressed={ativo}
        aria-label={rotulo}
        className={`flex rounded-full p-2 transition-colors duration-200 ${
          ativo ? "bg-surface-default text-icon-brand shadow-[0_1px_3px_rgba(0,0,0,0.12)]" : "text-icon-subtle hover:text-icon-default"
        }`}
      >
        <Icone nome={icone} />
      </button>
    );
  };

  return (
    <div className="flex shrink-0 items-center gap-1 rounded-full border border-border-subtle bg-surface-subtle p-1">
      {opcao("light", "sun", "Modo claro")}
      {opcao("dark", "moon", "Modo escuro")}
    </div>
  );
}
