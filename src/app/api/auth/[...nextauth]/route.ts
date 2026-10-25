import { NextResponse } from "next/server";
import { handlers } from "@/auth";

const fechado = () => new NextResponse("Não encontrado", { status: 404 });
const naProducao = process.env.VERCEL_ENV === "production";

// O login só existe nas versões de teste, por enquanto
export const GET = naProducao ? fechado : handlers.GET;
export const POST = naProducao ? fechado : handlers.POST;
