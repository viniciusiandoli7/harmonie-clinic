import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { getGoalForMonth, goalPeriodBounds, salesRevenueTotal } from "@/lib/goalPeriodMetrics";

function monthRange(month: string) {
  const [year, monthIndex] = month.split("-").map(Number);
  const start = new Date(Date.UTC(year, monthIndex - 1, 1, 0, 0, 0, 0));
  const endExclusive = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0, 0));
  const end = new Date(endExclusive.getTime() - 1);
  return { start, end, endExclusive };
}
const n = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const url = new URL(req.url);
  const month = url.searchParams.get("month") || new Date().toISOString().slice(0, 7);

  // O mês selecionado identifica o ciclo de meta que começa naquele mês.
  // Ex.: meta 18/11–17/12 fica vinculada a 2026-11.
  const configuredGoal = await getGoalForMonth(month).catch(() => null);
  const calendar = monthRange(month);
  const goalBounds = configuredGoal?.startDate && configuredGoal?.endDate ? goalPeriodBounds(configuredGoal) : null;
  const start = goalBounds?.start || calendar.start;
  const endExclusive = goalBounds?.endExclusive || calendar.endExclusive;
  const end = goalBounds?.endDay || calendar.end;

  const [transactions, patients, appointments, conversions, inventoryItems, sales] = await Promise.all([
    prisma.financialTransaction.findMany({
      where: { date: { gte: start, lt: endExclusive }, status: { not: "CANCELED" } },
      include: { patient: true },
      orderBy: { date: "desc" },
    }),
    prisma.patient.findMany({ where: { createdAt: { gte: start, lt: endExclusive } }, orderBy: { createdAt: "desc" } }),
    prisma.appointment.findMany({ where: { date: { gte: start, lt: endExclusive } }, include: { patient: true }, orderBy: { date: "desc" } }),
    (prisma as any).evaluationConversion.findMany({ where: { evaluationDate: { gte: start, lt: endExclusive } }, include: { patient: true }, orderBy: { evaluationDate: "desc" } }).catch(() => []),
    prisma.inventoryItem.findMany({ orderBy: { expiresAt: "asc" }, take: 100 }),
    prisma.sale.findMany({
      where: { createdAt: { gte: start, lt: endExclusive } },
      include: { service: true, patient: true, saleItems: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Faturamento = valor FINAL das vendas fechadas no mesmo período da meta.
  const revenue = salesRevenueTotal(sales);
  const incomeTransactions = transactions.filter((t: any) => t.type === "INCOME" && ["PAID", "PARTIAL", "COMPLETED"].includes(t.status));
  const expenseTransactions = transactions.filter((t: any) => t.type === "EXPENSE" && ["PAID", "PARTIAL", "COMPLETED"].includes(t.status));
  const cashReceived = incomeTransactions.reduce((sum, t: any) => sum + n(t.amount), 0);
  const expense = expenseTransactions.reduce((sum, t: any) => sum + n(t.amount), 0);
  const fees = incomeTransactions.reduce((sum, t: any) => sum + n(t.feeAmount), 0);
  const commissions = incomeTransactions.reduce((sum, t: any) => sum + n(t.commissionAmount), 0);
  const netFinancialIncome = incomeTransactions.reduce((sum, t: any) => sum + n(t.profit ?? t.clinicProfit ?? t.netAmount ?? t.amount), 0);
  const netProfit = netFinancialIncome - expense;

  const completedAppointments = appointments.filter((a: any) => a.status === "COMPLETED");
  const noShows = appointments.filter((a: any) => a.status === "NO_SHOW");
  const canceled = appointments.filter((a: any) => a.status === "CANCELED");
  const closedConversions = conversions.filter((c: any) => ["CLOSED_SAME_DAY", "CLOSED_LATER"].includes(c.status));
  const conversionRate = conversions.length ? Math.round((closedConversions.length / conversions.length) * 100) : 0;
  const averageTicket = sales.length ? revenue / sales.length : 0;

  const byProcedure = new Map<string, { count: number; revenue: number }>();
  for (const sale of sales as any[]) {
    const items = Array.isArray(sale.saleItems) && sale.saleItems.length ? sale.saleItems : null;
    if (items) {
      const saleTotal = n(sale.finalPrice || sale.price);
      const itemBase = items.reduce((sum: number, item: any) => sum + n(item.totalPrice), 0) || 1;
      for (const item of items) {
        const name = item.productName || "Procedimento";
        const current = byProcedure.get(name) || { count: 0, revenue: 0 };
        current.count += Number(item.quantity || 1);
        current.revenue += saleTotal * (n(item.totalPrice) / itemBase);
        byProcedure.set(name, current);
      }
    } else {
      const name = sale.service?.name || "Venda";
      const current = byProcedure.get(name) || { count: 0, revenue: 0 };
      current.count += 1;
      current.revenue += n(sale.finalPrice || sale.price);
      byProcedure.set(name, current);
    }
  }

  const byOrigin = new Map<string, { patients: number; closedValue: number }>();
  for (const patient of patients as any[]) {
    const key = patient.crmSource || "Sem origem";
    const current = byOrigin.get(key) || { patients: 0, closedValue: 0 };
    current.patients += 1;
    byOrigin.set(key, current);
  }
  for (const sale of sales as any[]) {
    const key = sale.patient?.crmSource || "Sem origem";
    const current = byOrigin.get(key) || { patients: 0, closedValue: 0 };
    current.closedValue += n(sale.finalPrice || sale.price);
    byOrigin.set(key, current);
  }

  const lowStock = inventoryItems.filter((i: any) => i.quantity <= i.minimumQuantity).slice(0, 10);
  const expiringSoon = inventoryItems.filter((i: any) => i.expiresAt && new Date(i.expiresAt) <= new Date(Date.now() + 60 * 86400000)).slice(0, 10);

  const revenueGoal = n(configuredGoal?.revenueGoal) || n(process.env.MONTHLY_REVENUE_GOAL) || 30000;
  const goalPercentage = revenueGoal ? Math.min(100, Math.round((revenue / revenueGoal) * 100)) : 0;

  return NextResponse.json({
    month,
    period: { start, end, configuredByGoal: Boolean(goalBounds) },
    financial: {
      income: revenue,
      revenue,
      cashReceived,
      expense,
      fees,
      commissions,
      netProfit,
      averageTicket,
      goal: revenueGoal,
      goalPercentage,
    },
    goals: configuredGoal,
    patients: { newPatients: patients.length, byOrigin: Array.from(byOrigin.entries()).map(([origin, data]) => ({ origin, ...data })) },
    appointments: {
      total: appointments.length,
      completed: completedAppointments.length,
      noShows: noShows.length,
      canceled: canceled.length,
      attendanceRate: appointments.filter((a: any) => a.status !== "CANCELED").length
        ? Math.round((completedAppointments.length / appointments.filter((a: any) => a.status !== "CANCELED").length) * 100)
        : 0,
    },
    conversions: {
      total: conversions.length,
      closed: closedConversions.length,
      conversionRate,
      followUps: conversions.filter((c: any) => c.status === "FOLLOW_UP").length,
      lost: conversions.filter((c: any) => String(c.status).startsWith("LOST")).length,
    },
    procedures: Array.from(byProcedure.entries()).map(([procedure, data]) => ({ procedure, ...data })).sort((a, b) => b.revenue - a.revenue),
    stock: { lowStock, expiringSoon },
    generatedAt: new Date().toISOString(),
  });
}
