import { prisma } from "@/lib/prisma";
import { getActiveBusinessGoalRaw, getBusinessGoalByMonthRaw } from "@/lib/goalsSql";
import { roundMoney } from "@/lib/money";

export type GoalLike = {
  id?: string;
  month?: string;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  revenueGoal?: number | null;
  patientGoal?: number | null;
  evaluationGoal?: number | null;
  conversionGoal?: number | null;
  averageTicketGoal?: number | null;
  notes?: string | null;
};

function utcDay(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return new Date();
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0));
}

function addUtcDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

export function goalPeriodBounds(goal: GoalLike) {
  const start = utcDay(goal.startDate || new Date());
  const endDay = utcDay(goal.endDate || goal.startDate || new Date());
  const endExclusive = addUtcDays(endDay, 1);
  return { start, endDay, endExclusive };
}

function validFinancialStatus(status?: string | null) {
  return status === "PAID" || status === "PARTIAL" || status === "COMPLETED";
}

export async function getGoalForMonth(month: string) {
  return getBusinessGoalByMonthRaw(prisma as any, month);
}

export async function getActiveGoal(date: Date = new Date()) {
  return getActiveBusinessGoalRaw(prisma as any, date);
}

export function salesRevenueTotal(sales: Array<{ finalPrice?: number | null; price?: number | null }>) {
  return roundMoney(sales.reduce((sum, sale) => {
    const final = Number(sale.finalPrice || 0);
    const fallback = Number(sale.price || 0);
    return sum + (final > 0 ? final : fallback);
  }, 0));
}

export async function calculateGoalPeriodMetrics(goal: GoalLike) {
  const { start, endDay, endExclusive } = goalPeriodBounds(goal);

  const [sales, transactions, patients, appointments, conversions] = await Promise.all([
    prisma.sale.findMany({
      where: { createdAt: { gte: start, lt: endExclusive } },
      select: {
        id: true,
        patientId: true,
        price: true,
        finalPrice: true,
        createdAt: true,
        service: { select: { name: true } },
        saleItems: { select: { productName: true, quantity: true, totalPrice: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.financialTransaction.findMany({
      where: { date: { gte: start, lt: endExclusive }, status: { in: ["PAID", "PARTIAL", "COMPLETED"] } },
      select: {
        id: true,
        type: true,
        status: true,
        amount: true,
        netAmount: true,
        feeAmount: true,
        commissionAmount: true,
        professionalValue: true,
        profit: true,
        clinicProfit: true,
        date: true,
        saleId: true,
      },
    }),
    prisma.patient.findMany({
      where: { createdAt: { gte: start, lt: endExclusive } },
      select: { id: true, crmSource: true, crmStatus: true, createdAt: true },
    }),
    prisma.appointment.findMany({
      where: { date: { gte: start, lt: endExclusive } },
      select: { id: true, patientId: true, status: true, date: true },
    }),
    (prisma as any).evaluationConversion.findMany({
      where: { evaluationDate: { gte: start, lt: endExclusive } },
      select: { id: true, patientId: true, status: true, closedValue: true, evaluationDate: true },
    }).catch(() => []),
  ]);

  // Fonte única da meta de faturamento: valor FINAL das vendas fechadas no período.
  // Isso evita subtotal antes de desconto, duplicidade de movimentações e saldo de outros períodos.
  const revenue = salesRevenueTotal(sales);

  const incomeTransactions = transactions.filter((t) => t.type === "INCOME" && validFinancialStatus(t.status));
  const expenseTransactions = transactions.filter((t) => t.type === "EXPENSE" && validFinancialStatus(t.status));
  const cashIncome = roundMoney(incomeTransactions.reduce((sum, t) => sum + Number(t.amount || 0), 0));
  const expense = roundMoney(expenseTransactions.reduce((sum, t) => sum + Number(t.amount || 0), 0));
  const netFinancialIncome = roundMoney(incomeTransactions.reduce((sum, t: any) => sum + Number(t.profit ?? t.clinicProfit ?? t.netAmount ?? t.amount ?? 0), 0));
  const profit = roundMoney(netFinancialIncome - expense);
  const averageTicket = sales.length ? roundMoney(revenue / sales.length) : 0;

  const completedAppointments = appointments.filter((a) => a.status === "COMPLETED").length;
  const noShows = appointments.filter((a) => a.status === "NO_SHOW").length;
  const canceledAppointments = appointments.filter((a) => a.status === "CANCELED").length;
  const validAppointments = appointments.filter((a) => a.status !== "CANCELED").length;
  const closedConversions = conversions.filter((c: any) => ["CLOSED_SAME_DAY", "CLOSED_LATER"].includes(c.status)).length;
  const conversionRate = conversions.length ? Math.round((closedConversions / conversions.length) * 100) : 0;

  const revenueGoal = Number(goal.revenueGoal || 0);
  const revenuePercentage = revenueGoal ? Math.min(100, Math.round((revenue / revenueGoal) * 100)) : 0;

  return {
    goal,
    period: {
      start: start.toISOString(),
      end: endDay.toISOString(),
    },
    revenue,
    revenueGoal,
    revenuePercentage,
    revenueRemaining: Math.max(0, roundMoney(revenueGoal - revenue)),
    saleCount: sales.length,
    averageTicket,
    cashIncome,
    expense,
    profit,
    patients: patients.length,
    appointments: {
      total: appointments.length,
      valid: validAppointments,
      completed: completedAppointments,
      noShows,
      canceled: canceledAppointments,
      attendanceRate: validAppointments ? Math.round((completedAppointments / validAppointments) * 100) : 0,
    },
    conversions: {
      total: conversions.length,
      closed: closedConversions,
      conversionRate,
    },
    sales,
  };
}

export async function getActiveGoalPeriodMetrics(date: Date = new Date()) {
  const goal = await getActiveGoal(date);
  return goal ? calculateGoalPeriodMetrics(goal) : null;
}
