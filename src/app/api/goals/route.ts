import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

const n = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const currentMonth = () => new Date().toISOString().slice(0, 7);

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const month = new URL(req.url).searchParams.get("month") || currentMonth();
  const goal = await (prisma as any).businessGoal.upsert({
    where: { month },
    create: { month, revenueGoal: n(process.env.MONTHLY_REVENUE_GOAL) || 30000, patientGoal: 25, evaluationGoal: 15, conversionGoal: 60, averageTicketGoal: 1200 },
    update: {},
  });
  return NextResponse.json(goal);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const body = await req.json();
  const month = body.month || currentMonth();
  const goal = await (prisma as any).businessGoal.upsert({
    where: { month },
    create: {
      month,
      revenueGoal: n(body.revenueGoal),
      patientGoal: Number(body.patientGoal || 0),
      evaluationGoal: Number(body.evaluationGoal || 0),
      conversionGoal: n(body.conversionGoal),
      averageTicketGoal: n(body.averageTicketGoal),
      notes: body.notes || null,
    },
    update: {
      revenueGoal: n(body.revenueGoal),
      patientGoal: Number(body.patientGoal || 0),
      evaluationGoal: Number(body.evaluationGoal || 0),
      conversionGoal: n(body.conversionGoal),
      averageTicketGoal: n(body.averageTicketGoal),
      notes: body.notes || null,
    },
  });
  await createAuditLog({ action: "UPSERT", entity: "BusinessGoal", entityId: goal.id, description: `Metas atualizadas: ${month}`, afterJson: goal });
  return NextResponse.json(goal);
}
