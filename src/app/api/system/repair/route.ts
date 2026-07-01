import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { ensureProductionSchema } from "@/lib/productionSchemaSql";
import { ensurePatientSchema } from "@/lib/patientSchemaSql";
import { ensureBusinessGoalPeriodColumns } from "@/lib/goalsSql";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    await ensureProductionSchema(prisma as any);
    await ensurePatientSchema(prisma as any);
    await ensureBusinessGoalPeriodColumns(prisma as any);

    return NextResponse.json({
      ok: true,
      message: "Estrutura do banco verificada e corrigida.",
      checkedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Erro ao reparar banco:", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Erro ao reparar banco." },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET();
}
