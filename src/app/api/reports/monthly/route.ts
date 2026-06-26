import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

function monthRange(month: string) {
  const [year, monthIndex] = month.split("-").map(Number);
  const start = new Date(year, monthIndex - 1, 1, 0, 0, 0, 0);
  const end = new Date(year, monthIndex, 0, 23, 59, 59, 999);
  return { start, end };
}
const n = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const url = new URL(req.url);
  const month = url.searchParams.get("month") || new Date().toISOString().slice(0, 7);
  const { start, end } = monthRange(month);

  const [transactions, patients, appointments, conversions, inventoryItems, goal, sales] = await Promise.all([
    prisma.financialTransaction.findMany({ where: { date: { gte: start, lte: end }, status: { not: "CANCELED" } }, include: { patient: true }, orderBy: { date: "desc" } }),
    prisma.patient.findMany({ where: { createdAt: { gte: start, lte: end } }, orderBy: { createdAt: "desc" } }),
    prisma.appointment.findMany({ where: { date: { gte: start, lte: end } }, include: { patient: true }, orderBy: { date: "desc" } }),
    (prisma as any).evaluationConversion.findMany({ where: { evaluationDate: { gte: start, lte: end } }, include: { patient: true }, orderBy: { evaluationDate: "desc" } }),
    prisma.inventoryItem.findMany({ orderBy: { expiresAt: "asc" }, take: 100 }),
    (prisma as any).businessGoal.findUnique({ where: { month } }),
    prisma.sale.findMany({ where: { createdAt: { gte: start, lte: end } }, include: { service: true, patient: true }, orderBy: { createdAt: "desc" } }),
  ]);

  const income = transactions.filter(t => t.type === "INCOME").reduce((sum, t) => sum + n(t.amount), 0);
  const expense = transactions.filter(t => t.type === "EXPENSE").reduce((sum, t) => sum + n(t.amount), 0);
  const fees = transactions.reduce((sum, t: any) => sum + n(t.feeAmount), 0);
  const commissions = transactions.reduce((sum, t: any) => sum + n(t.commissionAmount), 0);
  const netProfit = income - expense - fees - commissions;
  const completedAppointments = appointments.filter((a: any) => a.status === "COMPLETED");
  const noShows = appointments.filter((a: any) => a.status === "NO_SHOW");
  const canceled = appointments.filter((a: any) => a.status === "CANCELED");
  const closedConversions = conversions.filter((c: any) => ["CLOSED_SAME_DAY", "CLOSED_LATER"].includes(c.status));
  const conversionRate = conversions.length ? Math.round((closedConversions.length / conversions.length) * 100) : 0;
  const averageTicket = closedConversions.length ? closedConversions.reduce((sum: number, c: any) => sum + n(c.closedValue), 0) / closedConversions.length : (completedAppointments.length ? income / completedAppointments.length : 0);

  const byProcedure = new Map<string, { count: number; revenue: number }>();
  for (const sale of sales as any[]) {
    const name = sale.service?.name || "Venda";
    const current = byProcedure.get(name) || { count: 0, revenue: 0 };
    current.count += 1;
    current.revenue += n(sale.finalPrice || sale.price);
    byProcedure.set(name, current);
  }

  const byOrigin = new Map<string, { patients: number; closedValue: number }>();
  for (const patient of patients as any[]) {
    const key = patient.crmSource || "Sem origem";
    const current = byOrigin.get(key) || { patients: 0, closedValue: 0 };
    current.patients += 1;
    byOrigin.set(key, current);
  }
  for (const conversion of conversions as any[]) {
    const key = conversion.patient?.crmSource || "Sem origem";
    const current = byOrigin.get(key) || { patients: 0, closedValue: 0 };
    current.closedValue += n(conversion.closedValue);
    byOrigin.set(key, current);
  }

  const lowStock = inventoryItems.filter((i: any) => i.quantity <= i.minimumQuantity).slice(0, 10);
  const expiringSoon = inventoryItems.filter((i: any) => i.expiresAt && new Date(i.expiresAt) <= new Date(Date.now() + 60 * 86400000)).slice(0, 10);

  return NextResponse.json({
    month,
    period: { start, end },
    financial: { income, expense, fees, commissions, netProfit, averageTicket, goal: goal?.revenueGoal || n(process.env.MONTHLY_REVENUE_GOAL) || 30000, goalPercentage: Math.round((income / (goal?.revenueGoal || n(process.env.MONTHLY_REVENUE_GOAL) || 30000)) * 100) },
    goals: goal,
    patients: { newPatients: patients.length, byOrigin: Array.from(byOrigin.entries()).map(([origin, data]) => ({ origin, ...data })) },
    appointments: { total: appointments.length, completed: completedAppointments.length, noShows: noShows.length, canceled: canceled.length, attendanceRate: appointments.length ? Math.round((completedAppointments.length / appointments.length) * 100) : 0 },
    conversions: { total: conversions.length, closed: closedConversions.length, conversionRate, followUps: conversions.filter((c: any) => c.status === "FOLLOW_UP").length, lost: conversions.filter((c: any) => String(c.status).startsWith("LOST")).length },
    procedures: Array.from(byProcedure.entries()).map(([procedure, data]) => ({ procedure, ...data })).sort((a, b) => b.revenue - a.revenue),
    stock: { lowStock, expiringSoon },
    generatedAt: new Date().toISOString(),
  });
}
