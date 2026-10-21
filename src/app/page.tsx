import { FaixaOfertas } from "@/components/FaixaOfertas";
import { FiltroCategorias } from "@/components/FiltroCategorias";
import { Footer } from "@/components/Footer";
import { GradeOfertas } from "@/components/GradeOfertas";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { acharCategoria } from "@/lib/categorias";
import { ofertas } from "@/lib/ofertas";

type Props = { searchParams: Promise<{ categoria?: string; busca?: string }> };

export default async function Home({ searchParams }: Props) {
  const { categoria: slug, busca: buscaBruta } = await searchParams;
  const categoria = acharCategoria(slug);
  const busca = buscaBruta?.trim() || undefined;

  const normalizar = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
  const filtradas = ofertas.filter(
    (o) => (!categoria || o.categoria === categoria.slug) && (!busca || normalizar(o.titulo).includes(normalizar(busca))),
  );

  return (
    <>
      <Header categoriaAtiva={categoria?.slug} busca={busca} />
      <main>
        <Hero />
        <FaixaOfertas />
        <FiltroCategorias ativa={categoria?.slug} />
        <GradeOfertas ofertas={filtradas} categoria={categoria} busca={busca} />
      </main>
      <Footer />
    </>
  );
}
