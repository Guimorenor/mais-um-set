// Passo 1 do login: manda você para a página oficial do Mercado Livre
// pedir autorização. O "estado" aleatório protege contra links forjados.
import { NextResponse, type NextRequest } from "next/server";
import { AUTORIZACAO, COOKIE_ESTADO, provaHabilitada, urlDeRetorno } from "@/lib/ml/prova";

export async function GET(req: NextRequest) {
  if (!provaHabilitada()) return new NextResponse("Não encontrado", { status: 404 });
  const clientId = process.env.ML_CLIENT_ID;
  if (!clientId) return new NextResponse("Falta a variável ML_CLIENT_ID na Vercel.", { status: 500 });

  const estado = crypto.randomUUID();
  const destino = new URL(AUTORIZACAO);
  destino.searchParams.set("response_type", "code");
  destino.searchParams.set("client_id", clientId);
  destino.searchParams.set("redirect_uri", urlDeRetorno(req.nextUrl.origin));
  destino.searchParams.set("state", estado);

  const res = NextResponse.redirect(destino);
  res.cookies.set(COOKIE_ESTADO, estado, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 600, path: "/" });
  return res;
}
