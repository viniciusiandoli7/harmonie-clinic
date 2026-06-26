import { prisma } from "@/lib/prisma";
import { monthBounds, roundMoney } from "@/lib/money";

export function isPaid(status?: string | null) {
  return status === "PAID" || status === "COMPLETED";
}

export async function calculateMonthlyClosing(month?: string | null) {
  const bounds = monthBounds(month);
  const [transactions, sales] = await Promise.all([
    (prisma as any).financialTransaction.findMany({
      where: { date: { gte: bounds.startDate, lte: bounds.endDate }, status: { in: ["PAID", "COMPLETED"] } },
      include: { patient: { select: { id: true, name: true } } },
    }),
    (prisma as any).sale.findMany({
      where: { createdAt: { gte: bounds.startDate, lte: bounds.endDate } },
      include: { service: true, saleItems: true },
    }),
  ]);

  const incomeTransactions = transactions.filter((t: any) => t.type === "INCOME");
  const expenseTransactions = transactions.filter((t: any) => t.type === "EXPENSE");

  const grossIncome = roundMoney(incomeTransactions.reduce((acc: number, t: any) => acc + Number(t.grossAmount ?? t.amount ?? 0), 0));
  const fees = roundMoney(incomeTransactions.reduce((acc: number, t: any) => acc + Number(t.feeAmount ?? 0), 0));
  const commissions = roundMoney(incomeTransactions.reduce((acc: number, t: any) => acc + Number(t.commissionAmount ?? t.professionalValue ?? 0), 0));
  const netIncome = roundMoney(incomeTransactions.reduce((acc: number, t: any) => acc + Number(t.netAmount ?? t.amount ?? 0), 0));
  const expenses = roundMoney(expenseTransactions.reduce((acc: number, t: any) => acc + Number(t.amount ?? 0), 0));
  const netProfit = roundMoney(netIncome - expenses);
  const availableBalance = netProfit;
  const averageTicket = incomeTransactions.length ? roundMoney(grossIncome / incomeTransactions.length) : 0;

  const procedureCounts = new Map<string, number>();
  for (const sale of sales) {
    const saleItems = sale.saleItems || [];
    if (saleItems.length) {
      for (const item of saleItems) {
        const name = item.productName || "Procedimento";
        procedureCounts.set(name, (procedureCounts.get(name) || 0) + Number(item.quantity || 1));
      }
    } else {
      const name = sale.service?.name || "Procedimento";
      procedureCounts.set(name, (procedureCounts.get(name) || 0) + 1);
    }
  }
  const topProcedure = Array.from(procedureCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  return {
    month: bounds.month,
    startDate: bounds.startDate,
    endDate: bounds.endDate,
    grossIncome,
    expenses,
    fees,
    commissions,
    netProfit,
    availableBalance,
    averageTicket,
    topProcedure,
  };
}
