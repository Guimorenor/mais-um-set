// Links gerais do site. Troque pelos endereços reais.
export const site = {
  whatsapp: "#", // link do canal/grupo de ofertas no WhatsApp
  instagram: "#",
  contato: "#",
};

/** Link preenchido de verdade? Enquanto estiver "#", o botão não aparece no site. */
export const temLink = (href: string) => Boolean(href) && href !== "#";
