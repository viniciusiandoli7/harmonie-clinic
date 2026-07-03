import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { ensureProductionSchema } from "@/lib/productionSchemaSql";
import { ensureFinancialTransactionsForSales } from "@/lib/financeRepairSql";

export const dynamic = "force-dynamic";
export const revalidate = 0;
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
  status: z.enum(["PENDING", "PARTIAL", "PAID", "CANCELED", "COMPLETED"]).optional(),
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
    status: z.enum(["PENDING", "PARTIAL", "PAID", "CANCELED", "COMPLETED"]).optional(),
    paymentMethod: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
  })).optional(),
});


async function listFinancialTransactionsRaw() {
  const rows = await (prisma as any).$queryRawUnsafe(`
    SELECT
      ft.*,
      json_build_object('id', p."id", 'name', p."name", 'phone', p."phone") AS "patient"
    FROM "FinancialTransaction" ft
    LEFT JOIN "Patient" p ON p."id" = ft."patientId"
    ORDER BY ft."date" DESC
    LIMIT 500
  `);

  return Array.isArray(rows) ? rows : [];
}


export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    await ensureProductionSchema(prisma as any);
    await ensureFinancialTransactionsForSales(prisma as any);
    const items = await listFinancialTransactions();
    return NextResponse.json(items, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.warn("GET /api/financial-transactions via Prisma falhou; usando consulta segura:", error);
    try {
      return NextResponse.json(await listFinancialTransactionsRaw(), { headers: { "Cache-Control": "no-store, max-age=0" } });
    } catch (rawError) {
      console.error("GET /api/financial-transactions error:", rawError);
      return NextResponse.json({ error: "Erro ao listar transações." }, { status: 500 });
    }
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    await ensureProductionSchema(prisma as any);
    const body = await req.json();
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const created = await createFinancialTransaction(parsed.data);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("POST /api/financial-transactions error:", error);
    return NextResponse.json({ error: "Erro ao criar transação." }, { status: 500 });
  }
}
