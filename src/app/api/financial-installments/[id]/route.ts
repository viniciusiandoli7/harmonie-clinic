import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { roundMoney } from "@/lib/money";

const updateSchema = z.object({
  description: z.string().min(2).optional(),
  amount: z.number().positive().optional(),
  feeAmount: z.number().nonnegative().optional(),
  netAmount: z.number().nonnegative().optional().nullable(),
  dueDate: z.string().optional(),
  status: z.enum(["PENDING", "PAID", "CANCELED", "COMPLETED"]).optional(),
  paymentMethod: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

type Context = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, context: Context) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await context.params;
  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const before = await (prisma as any).financialInstallment.findUnique({ where: { id } });
  if (!before) return NextResponse.json({ error: "Parcela não encontrada." }, { status: 404 });

  const amount = Number(parsed.data.amount ?? before.amount);
  const feeAmount = Number(parsed.data.feeAmount ?? before.feeAmount ?? 0);
  const status = parsed.data.status;

  const updated = await (prisma as any).financialInstallment.update({
    where: { id },
    data: {
      ...(parsed.data.description !== undefined ? { description: parsed.data.description } : {}),
      ...(parsed.data.amount !== undefined ? { amount } : {}),
      ...(parsed.data.feeAmount !== undefined ? { feeAmount } : {}),
      ...(parsed.data.netAmount !== undefined || parsed.data.amount !== undefined || parsed.data.feeAmount !== undefined ? { netAmount: parsed.data.netAmount ?? roundMoney(amount - feeAmount) } : {}),
      ...(parsed.data.dueDate !== undefined ? { dueDate: new Date(parsed.data.dueDate) } : {}),
      ...(parsed.data.paymentMethod !== undefined ? { paymentMethod: parsed.data.paymentMethod || null } : {}),
      ...(parsed.data.notes !== undefined ? { notes: parsed.data.notes || null } : {}),
      ...(status !== undefined ? { status } : {}),
      ...(status === "PAID" || status === "COMPLETED" ? { paidAt: new Date(), canceledAt: null } : {}),
      ...(status === "PENDING" ? { paidAt: null, canceledAt: null } : {}),
      ...(status === "CANCELED" ? { canceledAt: new Date() } : {}),
    },
  });

  await createAuditLog({
    action: "UPDATE",
    entity: "FinancialInstallment",
    entityId: id,
    description: `Parcela atualizada: ${updated.description}`,
    beforeJson: before,
    afterJson: updated,
  });

  return NextResponse.json(updated);
}

export async function DELETE(_: NextRequest, context: Context) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await context.params;
  const before = await (prisma as any).financialInstallment.findUnique({ where: { id } });
  await (prisma as any).financialInstallment.delete({ where: { id } });
  await createAuditLog({ action: "DELETE", entity: "FinancialInstallment", entityId: id, description: "Parcela excluída.", beforeJson: before });
  return NextResponse.json({ success: true });
}
