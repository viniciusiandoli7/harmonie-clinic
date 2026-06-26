import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { roundMoney } from "@/lib/money";

const createSchema = z.object({
  transactionId: z.string().uuid().optional().nullable(),
  saleId: z.string().uuid().optional().nullable(),
  patientId: z.string().uuid().optional().nullable(),
  description: z.string().min(2),
  installmentNumber: z.number().int().min(1).default(1),
  totalInstallments: z.number().int().min(1).default(1),
  amount: z.number().positive(),
  feeAmount: z.number().nonnegative().optional().default(0),
  netAmount: z.number().nonnegative().optional().nullable(),
  dueDate: z.string().min(1),
  status: z.enum(["PENDING", "PAID", "CANCELED", "COMPLETED"]).optional().default("PENDING"),
  paymentMethod: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const url = new URL(req.url);
  const patientId = url.searchParams.get("patientId");
  const status = url.searchParams.get("status");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  const installments = await (prisma as any).financialInstallment.findMany({
    where: {
      ...(patientId ? { patientId } : {}),
      ...(status ? { status } : {}),
      ...(from || to ? { dueDate: { ...(from ? { gte: new Date(`${from}T00:00:00`) } : {}), ...(to ? { lte: new Date(`${to}T23:59:59`) } : {}) } } : {}),
    },
    include: {
      patient: { select: { id: true, name: true, phone: true } },
      transaction: { select: { id: true, description: true, category: true } },
    },
    orderBy: [{ dueDate: "asc" }, { installmentNumber: "asc" }],
  });

  return NextResponse.json(installments);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data = parsed.data;
  const installment = await (prisma as any).financialInstallment.create({
    data: {
      ...data,
      dueDate: new Date(data.dueDate),
      paidAt: data.status === "PAID" || data.status === "COMPLETED" ? new Date() : null,
      canceledAt: data.status === "CANCELED" ? new Date() : null,
      netAmount: data.netAmount ?? roundMoney(data.amount - data.feeAmount),
    },
  });

  await createAuditLog({
    action: "CREATE",
    entity: "FinancialInstallment",
    entityId: installment.id,
    description: `Parcela criada: ${installment.description}`,
    afterJson: installment,
  });

  return NextResponse.json(installment, { status: 201 });
}
