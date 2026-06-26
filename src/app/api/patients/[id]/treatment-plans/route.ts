import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

type Ctx = { params: Promise<{ id: string }> };
const n = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);

function mapStep(step: any, index: number) {
  return {
    treatmentId: step.treatmentId || null,
    title: String(step.title || step.treatmentName || `Etapa ${index + 1}`).trim(),
    priority: Number(step.priority || index + 1),
    estimatedValue: n(step.estimatedValue || step.value),
    status: step.status || "SUGGESTED",
    plannedDate: step.plannedDate ? new Date(step.plannedDate) : null,
    performedDate: step.performedDate ? new Date(step.performedDate) : null,
    notes: step.notes || null,
  };
}

export async function GET(_: NextRequest, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const { id } = await ctx.params;
  const plans = await (prisma as any).treatmentPlan.findMany({
    where: { patientId: id },
    include: { steps: { include: { treatment: true }, orderBy: { priority: "asc" } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(plans);
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const { id } = await ctx.params;
  const body = await req.json();
  const title = String(body.title || "Plano de rejuvenescimento individual").trim();
  const steps = Array.isArray(body.steps) ? body.steps.map(mapStep) : [];
  const totalEstimated = steps.reduce((sum: number, step: any) => sum + Number(step.estimatedValue || 0), 0) || n(body.totalEstimated);

  const plan = await (prisma as any).treatmentPlan.create({
    data: {
      patientId: id,
      title,
      objective: body.objective || null,
      totalEstimated,
      status: body.status || "ACTIVE",
      notes: body.notes || null,
      steps: steps.length ? { create: steps } : undefined,
    },
    include: { steps: { include: { treatment: true }, orderBy: { priority: "asc" } } },
  });

  await createAuditLog({ action: "CREATE", entity: "TreatmentPlan", entityId: plan.id, description: `Plano de tratamento criado: ${title}`, afterJson: plan });
  return NextResponse.json(plan, { status: 201 });
}
