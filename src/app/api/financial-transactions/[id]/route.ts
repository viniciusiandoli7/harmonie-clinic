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
  notes: z.string().nullable().optional(),
});

type Context = {
  params: Promise<{ id: string }>;
};

export async function GET(_: NextRequest, context: Context) {
  // BLOQUEIO DE SEGURANÇA
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const item = await getFinancialTransactionById(id);

    if (!item) {
      return NextResponse.json(
        { error: "Transação não encontrada." },
        { status: 404 }
      );
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error("GET /api/financial-transactions/[id] error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar transação." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, context: Context) {
  // BLOQUEIO DE SEGURANÇA
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updated = await updateFinancialTransaction(id, parsed.data);
    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/financial-transactions/[id] error:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar transação." },
      { status: 500 }
    );
  }
}

export async function DELETE(_: NextRequest, context: Context) {
  // BLOQUEIO DE SEGURANÇA
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    await deleteFinancialTransaction(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/financial-transactions/[id] error:", error);
    return NextResponse.json(
      { error: "Erro ao excluir transação." },
      { status: 500 }
    );
  }
}