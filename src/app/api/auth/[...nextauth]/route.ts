import { NextResponse } from "next/server";
import { handlers } from "@/auth";
import { ehProducao } from "@/lib/ambiente";

const fechado = () => new NextResponse("Não encontrado", { status: 404 });
// O login só existe onde o painel existe (teste sempre; site oficial só com PAINEL_EM_PRODUCAO=1)
const fechadoAqui = ehProducao() && process.env.PAINEL_EM_PRODUCAO !== "1";
export const GET = fechadoAqui ? fechado : handlers.GET;
export const POST = fechadoAqui ? fechado : handlers.POST;
