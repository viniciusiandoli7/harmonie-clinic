import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

function numberOrZero(value: unknown) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n : 0;
}

function mapCostItem(item: any) {
  const quantity = numberOrZero(item.quantity || 1) || 1;
  const unitCost = numberOrZero(item.unitCost);
  return {
    name: String(item.name || "Item").trim(),
    type: String(item.type || "Produto").trim(),
    quantity,
    unitCost,
    totalCost: numberOrZero(item.totalCost) || quantity * unitCost,
    notes: item.notes || null,
  };
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const url = new URL(req.url);
  const includeInactive = url.searchParams.get("includeInactive") === "true";

  const treatments = await prisma.treatment.findMany({
    where: includeInactive ? {} : { isActive: true },
    include: { costItems: { orderBy: { createdAt: "asc" } }, sales: true },
    orderBy: { name: "asc" },
  });

  const enriched = treatments.map((t: any) => {
    const calculatedCost = (t.costItems || []).reduce((sum: number, item: any) => sum + Number(item.totalCost || 0), 0);
    const averageCost = calculatedCost || Number(t.averageCost || 0);
    const margin = Number(t.standardPrice || 0) - averageCost;
    const marginPercent = t.standardPrice ? Math.round((margin / Number(t.standardPrice)) * 100) : 0;
    return { ...t, calculatedCost: averageCost, margin, marginPercent, salesCount: t.sales?.length || 0 };
  });

  return NextResponse.json(enriched);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const name = String(body.name || "").trim();
  if (!name) return NextResponse.json({ error: "Nome do procedimento é obrigatório." }, { status: 400 });

  const costItems = Array.isArray(body.costItems) ? body.costItems.map(mapCostItem).filter((i: any) => i.name) : [];
  const averageCost = costItems.reduce((sum: number, item: any) => sum + Number(item.totalCost || 0), 0) || numberOrZero(body.averageCost);

  const treatment = await prisma.treatment.create({
    data: {
      name,
      template: body.template || `Termo de consentimento para ${name}`,
      standardPrice: numberOrZero(body.standardPrice),
      averageCost,
      averageDurationMinutes: Number(body.averageDurationMinutes || 60),
      defaultReturnDays: body.defaultReturnDays ? Number(body.defaultReturnDays) : null,
      requiresTerm: body.requiresTerm ?? true,
      requiresPhotos: Boolean(body.requiresPhotos),
      requiresBatch: Boolean(body.requiresBatch),
      postCareInstructions: body.postCareInstructions || null,
      defaultWhatsAppMessage: body.defaultWhatsAppMessage || null,
      isActive: body.isActive ?? true,
      costItems: costItems.length ? { create: costItems } : undefined,
    },
    include: { costItems: true },
  });

  await createAuditLog({ action: "CREATE", entity: "Treatment", entityId: treatment.id, description: `Procedimento cadastrado: ${treatment.name}`, afterJson: treatment });
  return NextResponse.json(treatment, { status: 201 });
}
