import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import {
  createBusinessGoalRaw,
  getBusinessGoalByMonthRaw,
  updateBusinessGoalRaw,
  upsertBusinessGoalRaw,
} from "@/lib/goalsSql";

const n = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const currentMonth = () => new Date().toISOString().slice(0, 7);

function monthRange(month: string) {
  const [year, monthIndex] = month.split("-").map(Number);
  const start = new Date(year, monthIndex - 1, 1, 0, 0, 0, 0);
  const end = new Date(year, monthIndex, 0, 23, 59, 59, 999);
  return { start, end };
}

function asDate(value: unknown, fallback: Date) {
  if (!value) return fallback;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? fallback : date;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const month = new URL(req.url).searchParams.get("month") || currentMonth();
    const { start, end } = monthRange(month);

    const existing = await getBusinessGoalByMonthRaw(prisma as any, month);

    if (existing) {
      if (!existing.startDate || !existing.endDate) {
        const updated = await updateBusinessGoalRaw(prisma as any, month, {
          startDate: existing.startDate || start,
          endDate: existing.endDate || end,
        });
        return NextResponse.json(updated);
      }

      return NextResponse.json(existing);
    }

    const goal = await createBusinessGoalRaw(prisma as any, {
      month,
      startDate: start,
      endDate: end,
      revenueGoal: n(process.env.MONTHLY_REVENUE_GOAL) || 30000,
      patientGoal: 25,
      evaluationGoal: 15,
      conversionGoal: 60,
      averageTicketGoal: 1200,
      notes: null,
    });

    return NextResponse.json(goal);
  } catch (error) {
    console.error("Erro ao buscar metas:", error);
    return NextResponse.json({ error: "Erro ao buscar metas." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const body = await req.json();
    const month = body.month || currentMonth();
    const { start, end } = monthRange(month);

    const goal = await upsertBusinessGoalRaw(prisma as any, {
      month,
      startDate: asDate(body.startDate, start),
      endDate: asDate(body.endDate, end),
      revenueGoal: n(body.revenueGoal),
      patientGoal: Number(body.patientGoal || 0),
      evaluationGoal: Number(body.evaluationGoal || 0),
      conversionGoal: n(body.conversionGoal),
      averageTicketGoal: n(body.averageTicketGoal),
      notes: body.notes || null,
    });

    try {
      await createAuditLog({
        action: "UPSERT",
        entity: "BusinessGoal",
        entityId: goal.id,
        description: `Metas atualizadas: ${month}`,
        afterJson: goal,
      });
    } catch (auditError) {
      console.warn("Meta salva, mas não foi possível registrar auditoria:", auditError);
    }

    return NextResponse.json(goal);
  } catch (error) {
    console.error("Erro ao salvar metas:", error);
    return NextResponse.json({ error: "Erro ao salvar metas." }, { status: 500 });
  }
}
