import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
  deleteFinancialTransaction,
  getFinancialTransactionById,
  updateFinancialTransaction,
} from "@/services/financialService";

const updateSchema = z.object({
  date: z.string().optional(),
  description: z.string().min(2).optional(),
  category: z.string().min(2).optional(),
  amount: z.number().positive().optional(),
  type: z.enum(["INCOME", "EXPENSE"]).optional(),
  status: z.enum(["PENDING", "PAID", "CANCELED", "COMPLETED"]).optional(),
  paymentMethod: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  patientId: z.string().uuid().optional().nullable(),
  attachmentsJson: z.unknown().optional(),
  grossAmount: z.number().nonnegative().optional().nullable(),
  feeAmount: z.number().nonnegative().optional().nullable(),
  netAmount: z.number().nonnegative().optional().nullable(),
  cardFeePercent: z.number().nonnegative().max(100).optional().nullable(),
  commissionAmount: z.number().nonnegative().optional().nullable(),
  totalInstallments: z.number().int().min(1).max(48).optional().nullable(),
  firstDueDate: z.string().optional().nullable(),
  installments: z.array(z.object({
    amount: z.number().positive().optional(),
    dueDate: z.string().optional(),
    status: z.enum(["PENDING", "PAID", "CANCELED", "COMPLETED"]).optional(),
    paymentMethod: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
  })).optional(),
  paidAt: z.string().optional().nullable(),
  canceledAt: z.string().optional().nullable(),
});

type Context = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, context: Context) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const { id } = await context.params;
    const item = await getFinancialTransactionById(id);

    if (!item) return NextResponse.json({ error: "Transação não encontrada." }, { status: 404 });
    return NextResponse.json(item);
  } catch (error) {
    console.error("GET /api/financial-transactions/[id] error:", error);
    return NextResponse.json({ error: "Erro ao buscar transação." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, context: Context) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const { id } = await context.params;
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const data = { ...parsed.data } as any;
    if (parsed.data.status === "PAID") {
      data.paidAt = parsed.data.paidAt ?? new Date().toISOString();
      data.canceledAt = null;
    }
    if (parsed.data.status === "PENDING") {
      data.paidAt = null;
      data.canceledAt = null;
    }
    if (parsed.data.status === "CANCELED") {
      data.canceledAt = parsed.data.canceledAt ?? new Date().toISOString();
    }

    const updated = await updateFinancialTransaction(id, data);
    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/financial-transactions/[id] error:", error);
    return NextResponse.json({ error: "Erro ao atualizar transação." }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, context: Context) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const { id } = await context.params;
    await deleteFinancialTransaction(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/financial-transactions/[id] error:", error);
    return NextResponse.json({ error: "Erro ao excluir transação." }, { status: 500 });
  }
}
