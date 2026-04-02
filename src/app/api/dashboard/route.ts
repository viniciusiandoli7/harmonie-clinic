import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function startOfYear(date: Date) {
  return new Date(date.getFullYear(), 0, 1, 0, 0, 0, 0);
}

function endOfYear(date: Date) {
  return new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
}

export async function GET() {
  // BLOQUEIO DE SEGURANÇA
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const now = new Date();

    const [
      monthTransactions,
      yearTransactions,
      yearAppointments,
      totalPatients,
    ] = await Promise.all([
      prisma.financialTransaction.findMany({
        where: {
          date: {
            gte: startOfMonth(now),
            lte: endOfMonth(now),
          },
        },
        orderBy: { date: "asc" },
      }),

      prisma.financialTransaction.findMany({
        where: {
          date: {
            gte: startOfYear(now),
            lte: endOfYear(now),
          },
        },
        orderBy: { date: "asc" },
      }),

      prisma.appointment.findMany({
        where: {
          date: {
            gte: startOfYear(now),
            lte: endOfYear(now),
          },
        },
        include: {
          patient: true,
        },
        orderBy: { date: "asc" },
      }),

      prisma.patient.count(),
    ]);

    const totalIncomeMonth = monthTransactions
      .filter((item) => item.type === "INCOME")
      .reduce((acc, item) => acc + item.amount, 0);

    const totalExpenseMonth = monthTransactions
      .filter((item) => item.type === "EXPENSE")
      .reduce((acc, item) => acc + item.amount, 0);

    const balanceMonth = totalIncomeMonth - totalExpenseMonth;

    const monthlyRevenueMap = new Map<number, number>();
    const monthlyExpenseMap = new Map<number, number>();
    const monthlyConsultationsMap = new Map<number, number>();
    const procedureMap = new Map<string, number>();

    for (let i = 0; i < 12; i++) {
      monthlyRevenueMap.set(i, 0);
      monthlyExpenseMap.set(i, 0);
      monthlyConsultationsMap.set(i, 0);
    }

    for (const transaction of yearTransactions) {
      const month = new Date(transaction.date).getMonth();

      if (transaction.type === "INCOME") {
        monthlyRevenueMap.set(month, (monthlyRevenueMap.get(month) ?? 0) + transaction.amount);
      } else {
        monthlyExpenseMap.set(month, (monthlyExpenseMap.get(month) ?? 0) + transaction.amount);
      }
    }

    for (const appointment of yearAppointments) {
      const month = new Date(appointment.date).getMonth();

      if (appointment.status !== "CANCELED") {
        monthlyConsultationsMap.set(
          month,
          (monthlyConsultationsMap.get(month) ?? 0) + 1
        );
      }

      const procedure = appointment.procedureName?.trim();
      if (procedure) {
        procedureMap.set(procedure, (procedureMap.get(procedure) ?? 0) + 1);
      }
    }

    const monthlyRevenue = MONTHS.map((month, index) => ({
      month,
      value: monthlyRevenueMap.get(index) ?? 0,
    }));

    const monthlyExpenses = MONTHS.map((month, index) => ({
      month,
      value: monthlyExpenseMap.get(index) ?? 0,
    }));

    const monthlyConsultations = MONTHS.map((month, index) => ({
      month,
      value: monthlyConsultationsMap.get(index) ?? 0,
    }));

    const topProcedures = Array.from(procedureMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return NextResponse.json({
      cards: {
        totalIncomeMonth,
        totalExpenseMonth,
        balanceMonth,
        totalPatients,
      },
      charts: {
        monthlyRevenue,
        monthlyExpenses,
        monthlyConsultations,
        topProcedures,
      },
    });
  } catch (error) {
    console.error("GET /api/dashboard/summary error:", error);

    return NextResponse.json(
      { error: "Erro ao carregar resumo do dashboard." },
      { status: 500 }
    );
  }
}