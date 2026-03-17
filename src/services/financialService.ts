import { prisma } from "@/lib/prisma";

export type CreateFinancialTransactionInput = {
  date: string | Date;
  description: string;
  category: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  notes?: string | null;
};

export type UpdateFinancialTransactionInput =
  Partial<CreateFinancialTransactionInput>;

function toDate(value: string | Date) {
  return value instanceof Date ? value : new Date(value);
}

export async function listFinancialTransactions() {
  return prisma.financialTransaction.findMany({
    orderBy: {
      date: "desc",
    },
  });
}

export async function getFinancialTransactionById(id: string) {
  return prisma.financialTransaction.findUnique({
    where: { id },
  });
}

export async function createFinancialTransaction(
  data: CreateFinancialTransactionInput
) {
  return prisma.financialTransaction.create({
    data: {
      date: toDate(data.date),
      description: data.description,
      category: data.category,
      amount: Number(data.amount),
      type: data.type,
      notes: data.notes ?? null,
    },
  });
}

export async function updateFinancialTransaction(
  id: string,
  data: UpdateFinancialTransactionInput
) {
  return prisma.financialTransaction.update({
    where: { id },
    data: {
      ...(data.date !== undefined ? { date: toDate(data.date) } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.category !== undefined ? { category: data.category } : {}),
      ...(data.amount !== undefined ? { amount: Number(data.amount) } : {}),
      ...(data.type !== undefined ? { type: data.type } : {}),
      ...(data.notes !== undefined ? { notes: data.notes } : {}),
    },
  });
}

export async function deleteFinancialTransaction(id: string) {
  return prisma.financialTransaction.delete({
    where: { id },
  });
}

export async function getFinancialSummary() {
  const transactions = await prisma.financialTransaction.findMany();

  const totalIncome = transactions
    .filter((item) => item.type === "INCOME")
    .reduce((acc, item) => acc + item.amount, 0);

  const totalExpense = transactions
    .filter((item) => item.type === "EXPENSE")
    .reduce((acc, item) => acc + item.amount, 0);

  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
  };
}