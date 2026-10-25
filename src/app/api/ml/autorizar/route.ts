// Passo 1 do login: manda você para a página oficial do Mercado Livre
// pedir autorização. O "estado" aleatório protege contra links forjados.
import { NextResponse, type NextRequest } from "next/server";
import { auth, DONO_GITHUB_ID } from "@/auth";
import { AUTORIZACAO, COOKIE_ESTADO, provaHabilitada, urlDeRetorno } from "@/lib/ml/prova";
import { painelHabilitado } from "@/lib/painel";

const COOKIE_DESTINO = "ml_destino";

export async function GET(req: NextRequest) {
  const paraPainel = req.nextUrl.searchParams.get("para") === "painel";
  if (paraPainel ? !painelHabilitado() : !provaHabilitada()) return new NextResponse("Não encontrado", { status: 404 });
  // Se o login do painel estiver configurado, só o dono pode conectar a conta do ML
  if (process.env.AUTH_SECRET || paraPainel) {
    const sessao = await auth();
    if (sessao?.user?.githubId !== DONO_GITHUB_ID) return NextResponse.redirect(new URL("/admin/entrar", req.url));
  }
  const clientId = process.env.ML_CLIENT_ID;
  if (!clientId) return new NextResponse("Falta a variável ML_CLIENT_ID na Vercel.", { status: 500 });

  const estado = crypto.randomUUID();
  const destino = new URL(AUTORIZACAO);
  destino.searchParams.set("response_type", "code");
  destino.searchParams.set("client_id", clientId);
  destino.searchParams.set("redirect_uri", urlDeRetorno(req.nextUrl.origin));
  destino.searchParams.set("state", estado);
  // Pede renovação automática (refresh token). Se o app não tiver esse acesso, o ML ignora.
  if (paraPainel) destino.searchParams.set("scope", "offline_access read");

  const res = NextResponse.redirect(destino);
  res.cookies.set(COOKIE_ESTADO, estado, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 600, path: "/" });
  res.cookies.set(COOKIE_DESTINO, paraPainel ? "painel" : "prova", { httpOnly: true, secure: true, sameSite: "lax", maxAge: 600, path: "/" });
  return res;
}
