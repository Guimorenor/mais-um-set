// Onde o site está rodando. Funciona na Vercel (VERCEL_ENV) e na Netlify (SITE_AMBIENTE=producao,
// definido só no contexto de produção nas variáveis da Netlify).
export const ehProducao = () => process.env.VERCEL_ENV === "production" || process.env.SITE_AMBIENTE === "producao";
