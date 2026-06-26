import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { addMonths, calculateNetAmount, roundMoney } from "@/lib/money";

type TransactionStatus = "PENDING" | "PAID" | "CANCELED" | "COMPLETED";

type InstallmentInput = {
  amount?: number;
  dueDate?: string | Date;
  status?: TransactionStatus;
  paymentMethod?: string | null;
  notes?: string | null;
};

export type CreateFinancialTransactionInput = {
  date: string | Date;
  description: string;
  category: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  status?: TransactionStatus;
  paymentMethod?: string | null;
  notes?: string | null;
  patientId?: string | null;
  attachmentsJson?: unknown;
  grossAmount?: number | null;
  feeAmount?: number | null;
  netAmount?: number | null;
  cardFeePercent?: number | null;
  commissionAmount?: number | null;
  totalInstallments?: number | null;
  firstDueDate?: string | Date | null;
  installments?: InstallmentInput[];
};

export type UpdateFinancialTransactionInput = Partial<CreateFinancialTransactionInput> & {
  paidAt?: string | Date | null;
  canceledAt?: string | Date | null;
};

function toDate(value: string | Date) {
  return value instanceof Date ? value : new Date(value);
}

function toOptionalDate(value?: string | Date | null) {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  return toDate(value);
}

function isPaidStatus(status?: TransactionStatus | string | null) {
  return status === "PAID" || status === "COMPLETED";
}

function buildInstallments(data: CreateFinancialTransactionInput, transactionId: string, saleId?: string | null) {
  if (data.type !== "INCOME") return [];

  const explicitInstallments = data.installments?.filter(Boolean) || [];
  const totalInstallments = Math.max(1, Number(data.totalInstallments || explicitInstallments.length || 1));
  if (totalInstallments <= 1 && explicitInstallments.length === 0) return [];

  const baseDate = data.firstDueDate ? toDate(data.firstDueDate) : toDate(data.date);
  const grossAmount = Number(data.grossAmount ?? data.amount ?? 0);
  const defaultAmount = roundMoney(grossAmount / totalInstallments);

  return Array.from({ length: totalInstallments }).map((_, index) => {
    const explicit = explicitInstallments[index];
    const amount = explicit?.amount !== undefined ? Number(explicit.amount) : index === totalInstallments - 1
      ? roundMoney(grossAmount - defaultAmount * (totalInstallments - 1))
      : defaultAmount;
    const feeAmount = data.feeAmount ? roundMoney(Number(data.feeAmount) / totalInstallments) : 0;
    return {
      transactionId,
      saleId: saleId || null,
      patientId: data.patientId || null,
      description: `${data.description} (${index + 1}/${totalInstallments})`,
      installmentNumber: index + 1,
      totalInstallments,
      amount,
      feeAmount,
      netAmount: roundMoney(amount - feeAmount),
      dueDate: explicit?.dueDate ? toDate(explicit.dueDate) : addMonths(baseDate, index),
      paidAt: isPaidStatus(explicit?.status || data.status) ? new Date() : null,
      canceledAt: (explicit?.status || data.status) === "CANCELED" ? new Date() : null,
      status: explicit?.status || data.status || "PENDING",
      paymentMethod: explicit?.paymentMethod || data.paymentMethod || null,
      notes: explicit?.notes || null,
    };
  });
}

export async function listFinancialTransactions() {
  return prisma.financialTransaction.findMany({
    orderBy: { date: "desc" },
    include: {
      patient: { select: { id: true, name: true, phone: true } },
      installments: { orderBy: { dueDate: "asc" } },
    },
  });
}

export async function getFinancialTransactionById(id: string) {
  return prisma.financialTransaction.findUnique({
    where: { id },
    include: {
      patient: { select: { id: true, name: true, phone: true } },
      installments: { orderBy: { dueDate: "asc" } },
    },
  });
}

export async function createFinancialTransaction(data: CreateFinancialTransactionInput) {
  const status = data.status ?? "PENDING";
  const money = calculateNetAmount({
    amount: Number(data.amount),
    type: data.type,
    feeAmount: data.feeAmount,
    cardFeePercent: data.cardFeePercent,
    commissionAmount: data.commissionAmount,
    netAmount: data.netAmount,
  });

  const created = await prisma.$transaction(async (tx) => {
    const transaction = await tx.financialTransaction.create({
      data: {
        date: toDate(data.date),
        description: data.description,
        category: data.category,
        amount: money.grossAmount,
        grossAmount: money.grossAmount,
        feeAmount: money.feeAmount,
        netAmount: money.netAmount,
        cardFeePercent: data.cardFeePercent ?? null,
        commissionAmount: money.commissionAmount,
        type: data.type,
        status,
        paymentMethod: data.paymentMethod || null,
        notes: data.notes || null,
        attachmentsJson: data.attachmentsJson === undefined ? undefined : (data.attachmentsJson as any),
        patientId: data.patientId || null,
        paidAt: isPaidStatus(status) ? new Date() : null,
        canceledAt: status === "CANCELED" ? new Date() : null,
      },
    });

    const installments = buildInstallments({ ...data, grossAmount: money.grossAmount, feeAmount: money.feeAmount, status }, transaction.id);
    if (installments.length) {
      await (tx as any).financialInstallment.createMany({ data: installments });
    }

    await (tx as any).auditLog.create({
      data: {
        action: "CREATE",
        entity: "FinancialTransaction",
        entityId: transaction.id,
        description: `Transação criada: ${transaction.description}`,
        userName: "Dra. Mariana",
        afterJson: transaction as any,
        contextJson: { installmentsCreated: installments.length } as any,
      },
    });

    return transaction;
  });

  return getFinancialTransactionById(created.id);
}

export async function updateFinancialTransaction(id: string, data: UpdateFinancialTransactionInput) {
  const before = await prisma.financialTransaction.findUnique({ where: { id } });
  const paidAt = toOptionalDate(data.paidAt);
  const canceledAt = toOptionalDate(data.canceledAt);
  const currentAmount = Number(data.amount ?? before?.amount ?? 0);
  const currentType = data.type ?? (before?.type as any) ?? "INCOME";
  const money = calculateNetAmount({
    amount: currentAmount,
    type: currentType,
    feeAmount: data.feeAmount ?? before?.feeAmount ?? null,
    cardFeePercent: data.cardFeePercent ?? before?.cardFeePercent ?? null,
    commissionAmount: data.commissionAmount ?? before?.commissionAmount ?? null,
    netAmount: data.netAmount ?? undefined,
  });

  const updated = await prisma.financialTransaction.update({
    where: { id },
    data: {
      ...(data.date !== undefined ? { date: toDate(data.date) } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.category !== undefined ? { category: data.category } : {}),
      ...(data.amount !== undefined ? { amount: money.grossAmount, grossAmount: money.grossAmount } : {}),
      ...(data.type !== undefined ? { type: data.type } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.paymentMethod !== undefined ? { paymentMethod: data.paymentMethod || null } : {}),
      ...(data.notes !== undefined ? { notes: data.notes || null } : {}),
      ...(data.patientId !== undefined ? { patientId: data.patientId || null } : {}),
      ...(data.attachmentsJson !== undefined ? { attachmentsJson: data.attachmentsJson as any } : {}),
      ...(data.feeAmount !== undefined || data.amount !== undefined || data.cardFeePercent !== undefined ? { feeAmount: money.feeAmount } : {}),
      ...(data.netAmount !== undefined || data.amount !== undefined || data.feeAmount !== undefined || data.cardFeePercent !== undefined || data.commissionAmount !== undefined ? { netAmount: money.netAmount } : {}),
      ...(data.cardFeePercent !== undefined ? { cardFeePercent: data.cardFeePercent ?? null } : {}),
      ...(data.commissionAmount !== undefined || data.amount !== undefined ? { commissionAmount: money.commissionAmount } : {}),
      ...(paidAt !== undefined ? { paidAt } : {}),
      ...(canceledAt !== undefined ? { canceledAt } : {}),
    },
  });

  await createAuditLog({
    action: "UPDATE",
    entity: "FinancialTransaction",
    entityId: id,
    description: `Transação atualizada: ${updated.description}`,
    beforeJson: before,
    afterJson: updated,
  });

  return getFinancialTransactionById(id);
}

export async function deleteFinancialTransaction(id: string) {
  const before = await getFinancialTransactionById(id);
  const deleted = await prisma.financialTransaction.delete({ where: { id } });
  await createAuditLog({
    action: "DELETE",
    entity: "FinancialTransaction",
    entityId: id,
    description: `Transação excluída: ${before?.description || id}`,
    beforeJson: before,
  });
  return deleted;
}

export async function getFinancialSummary() {
  const transactions = await prisma.financialTransaction.findMany({
    where: { status: { in: ["PAID", "COMPLETED"] } },
  });

  const totalIncome = transactions
    .filter((item) => item.type === "INCOME")
    .reduce((acc, item) => acc + Number(item.netAmount ?? item.amount), 0);

  const totalExpense = transactions
    .filter((item) => item.type === "EXPENSE")
    .reduce((acc, item) => acc + Number(item.amount), 0);

  return {
    totalIncome: roundMoney(totalIncome),
    totalExpense: roundMoney(totalExpense),
    balance: roundMoney(totalIncome - totalExpense),
  };
}
