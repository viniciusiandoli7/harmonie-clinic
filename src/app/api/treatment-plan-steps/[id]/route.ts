import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { ensureProductionSchema } from "@/lib/productionSchemaSql";
import { createAuditLog } from "@/lib/audit";

type Ctx = { params: Promise<{ id: string }> };
const n = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  await ensureProductionSchema(prisma as any);
  const { id } = await ctx.params;
  const body = await req.json();
  const before = await (prisma as any).treatmentPlanStep.findUnique({ where: { id } });
  if (!before) return NextResponse.json({ error: "Etapa não encontrada." }, { status: 404 });
  const step = await (prisma as any).treatmentPlanStep.update({
    where: { id },
    data: {
      ...(body.title !== undefined ? { title: String(body.title).trim() } : {}),
      ...(body.status !== undefined ? { status: body.status } : {}),
      ...(body.estimatedValue !== undefined ? { estimatedValue: n(body.estimatedValue) } : {}),
      ...(body.priority !== undefined ? { priority: Number(body.priority || 1) } : {}),
      ...(body.plannedDate !== undefined ? { plannedDate: body.plannedDate ? new Date(body.plannedDate) : null } : {}),
      ...(body.performedDate !== undefined ? { performedDate: body.performedDate ? new Date(body.performedDate) : null } : {}),
      ...(body.notes !== undefined ? { notes: body.notes || null } : {}),
    },
  });
  await createAuditLog({ action: "UPDATE", entity: "TreatmentPlanStep", entityId: id, description: `Etapa do plano atualizada: ${step.title}`, beforeJson: before, afterJson: step });
  return NextResponse.json(step);
}

export async function DELETE(_: NextRequest, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  await ensureProductionSchema(prisma as any);
  const { id } = await ctx.params;
  const before = await (prisma as any).treatmentPlanStep.findUnique({ where: { id } });
  if (!before) return NextResponse.json({ error: "Etapa não encontrada." }, { status: 404 });
  await (prisma as any).treatmentPlanStep.delete({ where: { id } });
  await createAuditLog({ action: "DELETE", entity: "TreatmentPlanStep", entityId: id, description: `Etapa do plano excluída: ${before.title}`, beforeJson: before });
  return NextResponse.json({ ok: true });
}
