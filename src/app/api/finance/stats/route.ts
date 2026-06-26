import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { calculateMonthlyClosing, isPaid } from "@/lib/finance-utils";
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

    const [monthTransactions, allTransactions, recentMovements, sales, patients, overdueInstallments, pendingInstallments, closingPreview, savedClosing] = await Promise.all([
      prisma.financialTransaction.findMany({
        where: { date: { gte: firstDayMonth, lt: firstDayNextMonth } },
        include: { patient: { select: { id: true, name: true, phone: true } }, installments: true },
      }),
      prisma.financialTransaction.findMany(),
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
      calculateMonthlyClosing(),
      (prisma as any).monthlyClosing.findUnique({ where: { month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}` } }),
    ]);

    const paidMonthTransactions = monthTransactions.filter((t) => isPaid(t.status));
    const incomeTransactions = paidMonthTransactions.filter((t) => t.type === "INCOME");
    const expenseTransactions = paidMonthTransactions.filter((t) => t.type === "EXPENSE");

    const grossIncome = roundMoney(incomeTransactions.reduce((acc, t: any) => acc + Number(t.grossAmount ?? t.amount ?? 0), 0));
    const fees = roundMoney(incomeTransactions.reduce((acc, t: any) => acc + Number(t.feeAmount ?? 0), 0));
    const commissions = roundMoney(incomeTransactions.reduce((acc, t: any) => acc + Number(t.commissionAmount ?? t.professionalValue ?? 0), 0));
    const income = roundMoney(incomeTransactions.reduce((acc, t: any) => acc + Number(t.netAmount ?? t.amount ?? 0), 0));
    const expense = roundMoney(expenseTransactions.reduce((acc, t) => acc + Number(t.amount ?? 0), 0));
    const netProfit = roundMoney(income - expense);
    const totalBalance = roundMoney(allTransactions
      .filter((t) => isPaid(t.status))
      .reduce((acc, t: any) => (t.type === "INCOME" ? acc + Number(t.netAmount ?? t.amount) : acc - Number(t.amount)), 0));

    const paidIncomeCount = incomeTransactions.length;
    const averageTicket = paidIncomeCount ? roundMoney(grossIncome / paidIncomeCount) : 0;
    const procedureCounts = sales.reduce<Record<string, number>>((acc, sale: any) => {
      if (sale.saleItems?.length) {
        for (const item of sale.saleItems) acc[item.productName || "Procedimento"] = (acc[item.productName || "Procedimento"] || 0) + Number(item.quantity || 1);
      } else {
        const name = sale.service?.name || "Procedimento";
        acc[name] = (acc[name] || 0) + 1;
      }
      return acc;
    }, {});
    const topProcedure = (Object.entries(procedureCounts) as [string, number][]).sort((a, b) => b[1] - a[1])[0]?.[0] || "Sem vendas no mês";
    const patientOrigins = patients.reduce<Record<string, number>>((acc, patient) => {
      const source = patient.crmSource || "Outros";
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {});
    const crmStatus = patients.reduce<Record<string, number>>((acc, patient) => {
      const status = patient.crmStatus || "Novo Lead";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

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
    });
  } catch (error) {
    console.error("Erro ao buscar estatísticas financeiras:", error);
    return NextResponse.json({ error: "Erro financeiro" }, { status: 500 });
  }
}
