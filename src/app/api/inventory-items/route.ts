import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { createInventoryItemRaw, findInventoryItemsRaw } from "@/lib/inventorySql";

const itemSchema = z.object({
  product: z.string().min(2),
  category: z.string().optional().nullable(),
  linkedProcedure: z.string().optional().nullable(),
  supplier: z.string().optional().nullable(),
  entryQuantity: z.number().int().nonnegative().optional(),
  quantity: z.number().int().nonnegative(),
  entryDate: z.string().optional().nullable(),
  batch: z.string().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
  minimumQuantity: z.number().int().nonnegative(),
  unitValue: z.number().nonnegative(),
  applicationMaterials: z.string().optional().nullable(),
  applicationMaterialsValue: z.number().nonnegative().optional(),
  status: z.string().optional().nullable(),
  patientName: z.string().optional().nullable(),
  exitDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const items = await findInventoryItemsRaw(prisma as any);
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const parsed = itemSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const created = await createInventoryItemRaw(prisma as any, {
      ...parsed.data,
      entryQuantity: parsed.data.entryQuantity ?? parsed.data.quantity,
      status: parsed.data.status || "DISPONIVEL",
    });

    if (created?.quantity > 0) {
      try {
        await (prisma as any).inventoryMovement.create({
          data: {
            inventoryItemId: created.id,
            type: "IN",
            quantity: created.quantity,
            unitValue: created.unitValue,
            totalValue: created.quantity * created.unitValue,
            reason: "Cadastro inicial do item",
          },
        });
      } catch (movementError) {
        console.warn("Item salvo, mas movimento inicial de estoque não foi registrado:", movementError);
      }
    }

    try {
      await (prisma as any).auditLog.create({
        data: {
          action: "CREATE",
          entity: "InventoryItem",
          entityId: created.id,
          description: `Item cadastrado no estoque: ${created.product}`,
          userName: "Dra. Mariana",
          afterJson: created as any,
        },
      });
    } catch (auditError) {
      console.warn("Item salvo, mas auditoria não foi registrada:", auditError);
    }

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/inventory-items error:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao salvar item no estoque." },
      { status: 500 }
    );
  }
}

