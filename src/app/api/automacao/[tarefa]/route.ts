// Porta do relógio da Vercel (Cron) para as automações. Só responde com a senha CRON_SECRET,
// que a própria Vercel envia; sem ela, nada roda. Frequência: vercel.json.
import { NextResponse, type NextRequest } from "next/server";
import { rodarConferencia, rodarGarimpo } from "@/lib/garimpo/servidor";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ tarefa: string }> }) {
  const segredo = process.env.CRON_SECRET;
  if (!segredo || req.headers.get("authorization") !== `Bearer ${segredo}`) {
    return new NextResponse("Não autorizado", { status: 401 });
  }
  const { tarefa } = await params;
  if (tarefa === "garimpo") return NextResponse.json({ resultado: await rodarGarimpo() });
  if (tarefa === "conferencia") return NextResponse.json({ resultado: await rodarConferencia() });
  return new NextResponse("Não encontrado", { status: 404 });
}
