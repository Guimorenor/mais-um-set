import { categorias } from "@/lib/categorias";

// Página provisória: confirma que os tokens do Figma chegaram ao código.
// Será substituída pela Home de verdade.
export default function Home() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-16">
      <h1 className="text-4xl font-bold text-text-brand">Mais um Set</h1>
      <p className="mt-2 text-text-subtle">Base do site no ar. Próximo passo: a Home.</p>
      <ul className="mt-8 flex flex-wrap gap-2">
        {categorias.map((c) => (
          <li
            key={c.slug}
            className="rounded-full px-4 py-2 text-sm font-semibold"
            style={{
              background: `var(--category-${c.slug}-surface)`,
              color: `var(--category-${c.slug}-text)`,
            }}
          >
            {c.nome}
          </li>
        ))}
      </ul>
      <a
        href="#"
        className="mt-8 inline-block rounded-full bg-action-accent-default px-6 py-3 font-semibold text-text-on-accent hover:bg-action-accent-hover"
      >
        Receber ofertas no WhatsApp
      </a>
    </main>
  );
}
