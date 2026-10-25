// Entrega a foto recortada (PNG sem fundo) de uma ficha.
//  - público: só se você aprovou o recorte (usar_recorte) e ele é da foto atual;
//  - prévia no painel (?previa=1): só para o dono logado.
import { NextResponse, type NextRequest } from "next/server";
import { auth, DONO_GITHUB_ID } from "@/auth";
import { comBanco, variavelDoBanco } from "@/lib/db/conexao";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const naoTem = () => new NextResponse("Não encontrado", { status: 404 });
  if (!/^[0-9a-f-]{36}$/i.test(id) || !variavelDoBanco()) return naoTem();

  const previa = req.nextUrl.searchParams.get("previa") === "1";
  if (previa) {
    if (process.env.VERCEL_ENV === "production") return naoTem();
    const sessao = await auth();
    if (sessao?.user?.githubId !== DONO_GITHUB_ID) return naoTem();
  }

  const linha = await comBanco(async (pool) => {
    const { rows } = await pool.query(
      `SELECT r.png, f.usar_recorte, (r.imagem_origem = f.imagem) AS atual
         FROM recortes r JOIN fichas f ON f.id = r.ficha_id WHERE r.ficha_id = $1`,
      [id],
    );
    return rows[0] as { png: Buffer; usar_recorte: boolean; atual: boolean } | undefined;
  }).catch(() => undefined);
  if (!linha || (!previa && !(linha.usar_recorte && linha.atual))) return naoTem();

  return new NextResponse(new Uint8Array(linha.png), {
    headers: {
      "Content-Type": "image/png",
      // a URL muda quando o recorte muda (?v=…), então pode guardar por bastante tempo
      "Cache-Control": previa ? "private, no-store" : "public, max-age=86400, s-maxage=86400",
    },
  });
}
