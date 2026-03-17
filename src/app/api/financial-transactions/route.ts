import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  createFinancialTransaction,
  listFinancialTransactions,
} from "@/services/financialService";

const createSchema = z.object({
  date: z.string().min(1, "Data obrigatória"),
  description: z.string().min(2, "Descrição obrigatória"),
  category: z.string().min(2, "Categoria obrigatória"),
  amount: z.number().positive("Valor deve ser maior que zero"),
  type: z.enum(["INCOME", "EXPENSE"]),
  notes: z.string().nullable().optional(),
});

export async function GET() {
  try {
    const items = await listFinancialTransactions();
    return NextResponse.json(items);
  } catch {
    return NextResponse.json(
      { error: "Erro ao listar transações." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const created = await createFinancialTransaction(parsed.data);
    return NextResponse.json(created, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Erro ao criar transação." },
      { status: 500 }
    );
  }
}