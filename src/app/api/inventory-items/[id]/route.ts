import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

const itemSchema = z.object({
  product: z.string().min(2).optional(),
  supplier: z.string().optional().nullable(),
  batch: z.string().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
  quantity: z.number().int().nonnegative().optional(),
  minimumQuantity: z.number().int().nonnegative().optional(),
  unitValue: z.number().nonnegative().optional(),
  notes: z.string().optional().nullable(),
});

type Context = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, context: Context) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await context.params;
  const parsed = itemSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const before = await prisma.inventoryItem.findUnique({ where: { id } });
  const data = { ...parsed.data, expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : parsed.data.expiresAt === null ? null : undefined };
  const item = await prisma.inventoryItem.update({ where: { id }, data });
  await createAuditLog({ action: "UPDATE", entity: "InventoryItem", entityId: id, description: `Item de estoque atualizado: ${item.product}`, beforeJson: before, afterJson: item });
  return NextResponse.json(item);
}

export async function DELETE(_: NextRequest, context: Context) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await context.params;
  const before = await prisma.inventoryItem.findUnique({ where: { id } });
  await prisma.inventoryItem.delete({ where: { id } });
  await createAuditLog({ action: "DELETE", entity: "InventoryItem", entityId: id, description: `Item de estoque excluído: ${before?.product || id}`, beforeJson: before });
  return NextResponse.json({ success: true });
}
