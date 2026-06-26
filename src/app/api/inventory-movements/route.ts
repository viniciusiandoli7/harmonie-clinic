import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { roundMoney } from "@/lib/money";

const movementSchema = z.object({
  inventoryItemId: z.string().uuid(),
  type: z.enum(["IN", "OUT", "ADJUSTMENT", "LOSS", "EXPIRED", "PROCEDURE_USE"]),
  quantity: z.number().int().positive(),
  unitValue: z.number().nonnegative().optional().nullable(),
  reason: z.string().optional().nullable(),
  procedureName: z.string().optional().nullable(),
  patientId: z.string().uuid().optional().nullable(),
  date: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const url = new URL(req.url);
  const inventoryItemId = url.searchParams.get("inventoryItemId");
  const patientId = url.searchParams.get("patientId");

  const movements = await (prisma as any).inventoryMovement.findMany({
    where: {
      ...(inventoryItemId ? { inventoryItemId } : {}),
      ...(patientId ? { patientId } : {}),
    },
    include: {
      inventoryItem: true,
      patient: { select: { id: true, name: true, phone: true } },
    },
    orderBy: { date: "desc" },
    take: 500,
  });

  return NextResponse.json(movements);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const parsed = movementSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data = parsed.data;
  const result = await prisma.$transaction(async (tx) => {
    const item = await tx.inventoryItem.findUnique({ where: { id: data.inventoryItemId } });
    if (!item) throw new Error("Item de estoque não encontrado.");

    const signedQuantity = ["OUT", "LOSS", "EXPIRED", "PROCEDURE_USE"].includes(data.type) ? -data.quantity : data.quantity;
    const nextQuantity = data.type === "ADJUSTMENT" ? data.quantity : item.quantity + signedQuantity;
    if (nextQuantity < 0) throw new Error("Quantidade insuficiente no estoque.");

    const unitValue = data.unitValue ?? item.unitValue ?? 0;
    const movement = await (tx as any).inventoryMovement.create({
      data: {
        inventoryItemId: data.inventoryItemId,
        type: data.type,
        quantity: data.quantity,
        unitValue,
        totalValue: roundMoney(unitValue * data.quantity),
        reason: data.reason || null,
        procedureName: data.procedureName || null,
        patientId: data.patientId || null,
        date: data.date ? new Date(data.date) : new Date(),
      },
    });

    const updatedItem = await tx.inventoryItem.update({
      where: { id: data.inventoryItemId },
      data: { quantity: nextQuantity, ...(data.unitValue !== undefined && data.type === "IN" ? { unitValue } : {}) },
    });

    await (tx as any).auditLog.create({
      data: {
        action: "CREATE",
        entity: "InventoryMovement",
        entityId: movement.id,
        description: `Movimentação de estoque: ${data.type} • ${item.product}`,
        userName: "Dra. Mariana",
        beforeJson: item as any,
        afterJson: updatedItem as any,
        contextJson: movement as any,
      },
    });

    return { movement, item: updatedItem };
  });

  return NextResponse.json(result, { status: 201 });
}
