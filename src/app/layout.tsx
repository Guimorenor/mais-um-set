import type { Metadata } from "next";
import "@fontsource-variable/inter";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mais um Set — achados de tênis",
  description: "As melhores promoções de tênis, garimpadas todo dia.",
};

// Define o tema antes da página aparecer (evita "piscar" claro → escuro):
// escolha salva no switch > preferência do sistema.
const scriptTema = `(function(){try{var t=localStorage.getItem('tema');if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.dataset.theme=t}catch(e){}})()`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: scriptTema }} />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
