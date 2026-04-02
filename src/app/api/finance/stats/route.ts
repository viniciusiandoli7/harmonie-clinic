import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const now = new Date();
    const firstDayMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1. Lucro Líquido (Entradas - Saídas do mês)
    const transactions = await prisma.financialTransaction.findMany({
      where: { date: { gte: firstDayMonth } }
    });

    const income = transactions.filter(t => t.type === "INCOME").reduce((acc, t) => acc + t.amount, 0);
    const expense = transactions.filter(t => t.type === "EXPENSE").reduce((acc, t) => acc + t.amount, 0);
    const netProfit = income - expense;

    // 2. Disponível em Caixa (Total acumulado de todas as transações)
    const allTransactions = await prisma.financialTransaction.findMany();
    const totalBalance = allTransactions.reduce((acc, t) => 
      t.type === "INCOME" ? acc + t.amount : acc - t.amount, 0
    );

    // 3. Previsão de Recebíveis (Agendamentos pendentes de pagamento)
    const pendingAppointments = await prisma.appointment.aggregate({
      where: { paymentStatus: "PENDING" },
      _sum: { price: true }
    });

    // 4. Movimentações Recentes
    const recentMovements = await prisma.financialTransaction.findMany({
      take: 5,
      orderBy: { date: 'desc' }
    });

    return NextResponse.json({
      netProfit,
      totalBalance,
      receivables: pendingAppointments._sum.price || 0,
      recentMovements,
      healthScore: netProfit > 0 ? "EXCELENTE" : "ATENÇÃO"
    });
  } catch (error) {
    return NextResponse.json({ error: "Erro financeiro" }, { status: 500 });
  }
}