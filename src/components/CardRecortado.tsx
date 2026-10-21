// Fundo do card com o "recorte" no canto inferior direito onde encaixa o botão
// (mesma forma do vetor "Rectangle 2" do Figma), feito em CSS para esticar na largura
// sem deformar os cantos e seguir o token de cor no modo escuro.
type Medidas = { raio: number; raioRecorte: number; larguraRecorte: number; alturaRecorte: number };

export function FundoRecortado({ raio, raioRecorte, larguraRecorte, alturaRecorte }: Medidas) {
  const r = `${raioRecorte}px`;
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {/* faixa de cima, largura total */}
      <div
        className="absolute inset-x-0 top-0 bg-surface-subtle"
        style={{ bottom: alturaRecorte, borderRadius: `${raio}px ${raio}px ${r} 0` }}
      />
      {/* coluna da esquerda, altura total */}
      <div
        className="absolute inset-y-0 left-0 bg-surface-subtle"
        style={{ right: larguraRecorte, borderRadius: `${raio}px 0 ${r} ${raio}px` }}
      />
      {/* canto côncavo do recorte */}
      <div
        className="absolute"
        style={{
          right: larguraRecorte - raioRecorte,
          bottom: alturaRecorte - raioRecorte,
          width: raioRecorte,
          height: raioRecorte,
          background: `radial-gradient(circle at 100% 100%, transparent ${raioRecorte}px, var(--surface-subtle) ${raioRecorte + 0.5}px)`,
        }}
      />
    </div>
  );
}
