import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

type Ctx = { params: Promise<{ id: string }> };
const n = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);

function mapCostItem(item: any) {
  const quantity = n(item.quantity || 1) || 1;
  const unitCost = n(item.unitCost);
  return {
    name: String(item.name || "Item").trim(),
    type: String(item.type || "Produto").trim(),
    quantity,
    unitCost,
    totalCost: n(item.totalCost) || quantity * unitCost,
    notes: item.notes || null,
  };
}

export async function GET(_: NextRequest, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const { id } = await ctx.params;
  const treatment = await prisma.treatment.findUnique({ where: { id }, include: { costItems: true, sales: true } });
  if (!treatment) return NextResponse.json({ error: "Procedimento não encontrado." }, { status: 404 });
  return NextResponse.json(treatment);
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const { id } = await ctx.params;
  const body = await req.json();
  const before = await prisma.treatment.findUnique({ where: { id }, include: { costItems: true } });
  if (!before) return NextResponse.json({ error: "Procedimento não encontrado." }, { status: 404 });

  const costItems = Array.isArray(body.costItems) ? body.costItems.map(mapCostItem).filter((i: any) => i.name) : null;
  const averageCost = costItems ? costItems.reduce((sum: number, item: any) => sum + Number(item.totalCost || 0), 0) : (body.averageCost !== undefined ? n(body.averageCost) : undefined);

  const treatment = await prisma.$transaction(async (tx) => {
    if (costItems) {
      await (tx as any).treatmentCostItem.deleteMany({ where: { treatmentId: id } });
    }
    return tx.treatment.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: String(body.name).trim() } : {}),
        ...(body.template !== undefined ? { template: body.template || "" } : {}),
        ...(body.standardPrice !== undefined ? { standardPrice: n(body.standardPrice) } : {}),
        ...(averageCost !== undefined ? { averageCost } : {}),
        ...(body.averageDurationMinutes !== undefined ? { averageDurationMinutes: Number(body.averageDurationMinutes || 60) } : {}),
        ...(body.defaultReturnDays !== undefined ? { defaultReturnDays: body.defaultReturnDays ? Number(body.defaultReturnDays) : null } : {}),
        ...(body.requiresTerm !== undefined ? { requiresTerm: Boolean(body.requiresTerm) } : {}),
        ...(body.requiresPhotos !== undefined ? { requiresPhotos: Boolean(body.requiresPhotos) } : {}),
        ...(body.requiresBatch !== undefined ? { requiresBatch: Boolean(body.requiresBatch) } : {}),
        ...(body.postCareInstructions !== undefined ? { postCareInstructions: body.postCareInstructions || null } : {}),
        ...(body.defaultWhatsAppMessage !== undefined ? { defaultWhatsAppMessage: body.defaultWhatsAppMessage || null } : {}),
        ...(body.isActive !== undefined ? { isActive: Boolean(body.isActive) } : {}),
        ...(costItems ? { costItems: { create: costItems } } : {}),
      },
      include: { costItems: true },
    });
  });

  await createAuditLog({ action: "UPDATE", entity: "Treatment", entityId: id, description: `Procedimento atualizado: ${treatment.name}`, beforeJson: before, afterJson: treatment });
  return NextResponse.json(treatment);
}

export async function DELETE(_: NextRequest, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const { id } = await ctx.params;
  const before = await prisma.treatment.findUnique({ where: { id } });
  if (!before) return NextResponse.json({ error: "Procedimento não encontrado." }, { status: 404 });
  await prisma.treatment.update({ where: { id }, data: { isActive: false } });
  await createAuditLog({ action: "DEACTIVATE", entity: "Treatment", entityId: id, description: `Procedimento desativado: ${before.name}`, beforeJson: before });
  return NextResponse.json({ ok: true });
}
