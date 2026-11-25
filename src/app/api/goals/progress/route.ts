import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getActiveGoalPeriodMetrics } from "@/lib/goalPeriodMetrics";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const summary = await getActiveGoalPeriodMetrics(new Date());
    return NextResponse.json(summary, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("Erro ao calcular progresso da meta:", error);
    return NextResponse.json({ error: "Não foi possível calcular o progresso da meta." }, { status: 500 });
  }
}
