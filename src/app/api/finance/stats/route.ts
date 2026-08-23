import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { isPaid } from "@/lib/finance-utils";
import { roundMoney } from "@/lib/money";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const now = new Date();
    const firstDayMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const monthlyGoal = Number(process.env.MONTHLY_REVENUE_GOAL || 30000);

    const [monthTransactions, balanceByType, recentMovements, sales, patients, overdueInstallments, pendingInstallments, savedClosing] = await Promise.all([
      prisma.financialTransaction.findMany({
        where: { date: { gte: firstDayMonth, lt: firstDayNextMonth } },
        select: {
          type: true,
          status: true,
          amount: true,
          grossAmount: true,
          feeAmount: true,
          netAmount: true,
          commissionAmount: true,
          professionalValue: true,
        },
      }),
      prisma.financialTransaction.groupBy({
        by: ["type"],
        where: { status: { in: ["PAID", "PARTIAL", "COMPLETED"] } },
        _sum: { amount: true },
      }),
      prisma.financialTransaction.findMany({
        take: 250,
        orderBy: { date: "desc" },
        include: { patient: { select: { id: true, name: true, phone: true } }, installments: true },
      }),
      prisma.sale.findMany({
        where: { createdAt: { gte: firstDayMonth, lt: firstDayNextMonth } },
        include: { service: true, saleItems: true },
      }),
      prisma.patient.findMany({
        where: { createdAt: { gte: firstDayMonth, lt: firstDayNextMonth } },
        select: { id: true, crmSource: true, crmStatus: true },
      }),
      (prisma as any).financialInstallment.findMany({
        where: { status: "PENDING", dueDate: { lt: now } },
        include: { patient: { select: { id: true, name: true, phone: true } } },
        orderBy: { dueDate: "asc" },
        take: 15,
      }),
      (prisma as any).financialInstallment.findMany({
        where: { status: "PENDING", dueDate: { gte: firstDayMonth, lt: firstDayNextMonth } },
        include: { patient: { select: { id: true, name: true, phone: true } } },
        orderBy: { dueDate: "asc" },
        take: 50,
      }),
      (prisma as any).monthlyClosing.findUnique({ where: { month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}` } }).catch(() => null),
    ]);

    const paidMonthTransactions = monthTransactions.filter((t) => isPaid(t.status));
    const incomeTransactions = paidMonthTransactions.filter((t) => t.type === "INCOME");
    const expenseTransactions = paidMonthTransactions.filter((t) => t.type === "EXPENSE");

    const grossIncome = roundMoney(incomeTransactions.reduce((acc, t: any) => acc + Number(t.grossAmount ?? t.amount ?? 0), 0));
    const fees = roundMoney(incomeTransactions.reduce((acc, t: any) => acc + Number(t.feeAmount ?? 0), 0));
    const commissions = roundMoney(incomeTransactions.reduce((acc, t: any) => acc + Number(t.commissionAmount ?? t.professionalValue ?? 0), 0));
    const income = roundMoney(incomeTransactions.reduce((acc, t: any) => acc + Number(t.amount ?? t.netAmount ?? 0), 0));
    const expense = roundMoney(expenseTransactions.reduce((acc, t) => acc + Number(t.amount ?? 0), 0));
    const salesNetProfit = roundMoney(incomeTransactions.reduce((acc, t: any) => acc + Number(t.netAmount ?? t.amount ?? 0), 0));
    const netProfit = roundMoney(salesNetProfit - expense);
    const totalBalance = roundMoney(balanceByType.reduce((acc, row) => {
      const amount = Number(row._sum.amount || 0);
      return row.type === "INCOME" ? acc + amount : acc - amount;
    }, 0));

    const paidIncomeCount = incomeTransactions.length;
    const averageTicket = paidIncomeCount ? roundMoney(grossIncome / paidIncomeCount) : 0;

    const procedureCounts: Record<string, number> = {};
    for (const sale of sales as any[]) {
      if (sale.saleItems?.length) {
        for (const item of sale.saleItems) {
          const name = item.productName || "Procedimento";
          procedureCounts[name] = (procedureCounts[name] || 0) + Number(item.quantity || 1);
        }
      } else {
        const name = sale.service?.name || "Procedimento";
        procedureCounts[name] = (procedureCounts[name] || 0) + 1;
      }
    }

    const topProcedure = Object.entries(procedureCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "Sem vendas no mês";


    const closingPreview = {
      month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
      startDate: firstDayMonth,
      endDate: new Date(firstDayNextMonth.getTime() - 1),
      grossIncome,
      expenses: expense,
      fees,
      commissions,
      netProfit,
      availableBalance: netProfit,
      averageTicket,
      topProcedure: topProcedure === "Sem vendas no mês" ? null : topProcedure,
    };

    const patientOrigins: Record<string, number> = {};
    const crmStatus: Record<string, number> = {};
    for (const patient of patients as any[]) {
      const source = patient.crmSource || "Outros";
      patientOrigins[source] = (patientOrigins[source] || 0) + 1;

      const status = patient.crmStatus || "Novo Lead";
      crmStatus[status] = (crmStatus[status] || 0) + 1;
    }

    return NextResponse.json({
      month: {
        start: firstDayMonth.toISOString(),
        end: new Date(firstDayNextMonth.getTime() - 1).toISOString(),
        isClosed: savedClosing?.status === "CLOSED",
      },
      grossIncome,
      income,
      expense,
      fees,
      commissions,
      netProfit,
      totalBalance,
      monthlyGoal,
      goalPercentage: monthlyGoal ? Math.min(100, Math.round((grossIncome / monthlyGoal) * 100)) : 0,
      averageTicket,
      topProcedure,
      patientOrigins,
      crmStatus,
      newPatients: patients.length,
      recentMovements,
      overdueInstallments,
      pendingInstallments,
      closingPreview,
      savedClosing,
      healthScore: netProfit > 0 ? "EXCELENTE" : grossIncome > 0 ? "EM AJUSTE" : "ATENÇÃO",
    }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("Erro ao buscar estatísticas financeiras:", error);
    return NextResponse.json({ error: "Erro financeiro" }, { status: 500 });
  }
}
