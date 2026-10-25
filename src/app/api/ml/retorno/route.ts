// Passo 2 do login: o Mercado Livre devolve você para cá com um "código" de uso único.
// Trocamos esse código por um passe de acesso (access token) de ~6 h, direto entre
// servidores. O passe fica num cookie protegido (o JavaScript da página não consegue lê-lo)
// e some sozinho quando expira. Nesta prova NÃO guardamos o token de renovação.
import { NextResponse, type NextRequest } from "next/server";
import { auth, DONO_GITHUB_ID } from "@/auth";
import { API, COOKIE_ESTADO, COOKIE_TOKEN, provaHabilitada, urlDeRetorno } from "@/lib/ml/prova";
import { salvarConexaoML, type RespostaToken } from "@/lib/ml/servidor";
import { painelHabilitado } from "@/lib/painel";

const COOKIE_DESTINO = "ml_destino";

function voltar(req: NextRequest, erro?: string) {
  const painel = req.cookies.get(COOKIE_DESTINO)?.value === "painel";
  const url = new URL(painel ? "/admin" : "/admin/prova-ml", req.nextUrl.origin);
  if (erro) url.searchParams.set("erro", erro);
  return NextResponse.redirect(url);
}

export async function GET(req: NextRequest) {
  const paraPainel = req.cookies.get(COOKIE_DESTINO)?.value === "painel";
  if (paraPainel ? !painelHabilitado() : !provaHabilitada()) return new NextResponse("Não encontrado", { status: 404 });
  if (paraPainel) {
    const sessao = await auth();
    if (sessao?.user?.githubId !== DONO_GITHUB_ID) return NextResponse.redirect(new URL("/admin/entrar", req.url));
  }

  const codigo = req.nextUrl.searchParams.get("code");
  const estado = req.nextUrl.searchParams.get("state");
  const esperado = req.cookies.get(COOKIE_ESTADO)?.value;
  if (!codigo) return voltar(req, "O Mercado Livre não devolveu o código de autorização.");
  if (!estado || estado !== esperado) return voltar(req, "Verificação de segurança falhou (estado diferente). Tente conectar de novo.");

  const corpo = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: process.env.ML_CLIENT_ID ?? "",
    client_secret: process.env.ML_CLIENT_SECRET ?? "",
    code: codigo,
    redirect_uri: urlDeRetorno(req.nextUrl.origin),
  });

  let dados: RespostaToken & { message?: string; error?: string };
  try {
    const r = await fetch(`${API}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: corpo,
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    dados = await r.json();
    if (!r.ok || !dados.access_token) {
      return voltar(req, `O Mercado Livre recusou a troca do código (HTTP ${r.status}: ${dados.message ?? dados.error ?? "sem detalhe"}).`);
    }
  } catch (e) {
    return voltar(req, `Não consegui falar com o Mercado Livre: ${e instanceof Error ? e.message : e}`);
  }

  // No painel: guarda a conexão no banco (tokens cifrados), para consultar o catálogo depois
  if (paraPainel) {
    try {
      await salvarConexaoML(dados);
    } catch (e) {
      return voltar(req, `Conectou, mas não consegui guardar a conexão: ${e instanceof Error ? e.message : e}`);
    }
  }

  const res = voltar(req);
  res.cookies.delete(COOKIE_ESTADO);
  res.cookies.delete(COOKIE_DESTINO);
  res.cookies.set(COOKIE_TOKEN, dados.access_token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: Math.min(dados.expires_in ?? 3600, 6 * 3600),
    path: "/",
  });
  return res;
}
