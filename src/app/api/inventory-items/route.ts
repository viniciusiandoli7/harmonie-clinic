import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

const itemSchema = z.object({
  product: z.string().min(2),
  supplier: z.string().optional().nullable(),
  batch: z.string().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
  quantity: z.number().int().nonnegative(),
  minimumQuantity: z.number().int().nonnegative(),
  unitValue: z.number().nonnegative(),
  notes: z.string().optional().nullable(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const items = await prisma.inventoryItem.findMany({
    orderBy: [{ expiresAt: "asc" }, { product: "asc" }],
    include: { movements: { take: 5, orderBy: { date: "desc" } } },
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const parsed = itemSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const item = await prisma.$transaction(async (tx) => {
    const created = await tx.inventoryItem.create({
      data: {
        ...parsed.data,
        expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
      },
    });

    if (created.quantity > 0) {
      await (tx as any).inventoryMovement.create({
        data: {
          inventoryItemId: created.id,
          type: "IN",
          quantity: created.quantity,
          unitValue: created.unitValue,
          totalValue: created.quantity * created.unitValue,
          reason: "Cadastro inicial do item",
        },
      });
    }

    await (tx as any).auditLog.create({
      data: {
        action: "CREATE",
        entity: "InventoryItem",
        entityId: created.id,
        description: `Item cadastrado no estoque: ${created.product}`,
        userName: "Dra. Mariana",
        afterJson: created as any,
      },
    });

    return created;
  });

  return NextResponse.json(item, { status: 201 });
}
