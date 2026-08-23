import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { ensureProductionSchema } from "@/lib/productionSchemaSql";
import { ensurePatientSchema } from "@/lib/patientSchemaSql";
import { ensureBusinessGoalPeriodColumns } from "@/lib/goalsSql";
import { ensureFinancialTransactionsForSales } from "@/lib/financeRepairSql";

async function requireSession() {
  return getServerSession(authOptions);
}

export async function GET() {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  return NextResponse.json({
    ok: true,
    mode: "manual",
    message: "O reparo de banco não é mais executado durante o uso normal. Use POST somente como recuperação administrativa; em produção prefira as migrations.",
  });
}

export async function POST() {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    await ensureProductionSchema(prisma as any);
    await ensurePatientSchema(prisma as any);
    await ensureBusinessGoalPeriodColumns(prisma as any);
    const financeRepair = await ensureFinancialTransactionsForSales(prisma as any);

    return NextResponse.json({
      ok: true,
      message: "Reparo administrativo concluído.",
      financeRepair,
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
