import { NextResponse } from "next/server";
import { handlers } from "@/auth";

const fechado = () => new NextResponse("Não encontrado", { status: 404 });
// O login só existe onde o painel existe (teste sempre; site oficial só com PAINEL_EM_PRODUCAO=1)
const fechadoAqui = process.env.VERCEL_ENV === "production" && process.env.PAINEL_EM_PRODUCAO !== "1";
export const GET = fechadoAqui ? fechado : handlers.GET;
export const POST = fechadoAqui ? fechado : handlers.POST;
