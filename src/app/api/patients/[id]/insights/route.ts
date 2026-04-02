import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

type Ctx = {
  params: Promise<{ id: string }>;
};

export async function GET(req: Request, context: Ctx) {
  // BLOQUEIO DE SEGURANÇA
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    // No Next.js 15/16, precisamos dar await no params
    const { id } = await context.params;

    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        appointments: {
          // Filtra apenas agendamentos concluídos para gerar insights reais
          where: { status: "COMPLETED" }, 
          orderBy: { date: "desc" },
        },
      },
    });

    if (!patient) {
      return NextResponse.json({ error: "Paciente não encontrado" }, { status: 404 });
    }

    const totalVisits = patient.appointments.length;
    const lastProcedure = patient.appointments[0]?.procedureName || "---";

    // Lógica de Inteligência (Score de Fidelidade)
    let loyaltyScore = "BAIXO";
    if (totalVisits > 5) loyaltyScore = "ALTO";
    else if (totalVisits >= 2) loyaltyScore = "MÉDIO";

    return NextResponse.json({
      totalVisits,
      lastProcedure,
      loyaltyScore,
      criticalObservation: patient.notes || "Nenhuma observação crítica.",
      status: totalVisits > 0 ? "Ativo" : "Novo",
    });
  } catch (error) {
    console.error("Erro na rota insights:", error);
    return NextResponse.json({ error: "Erro interno ao gerar insights" }, { status: 500 });
  }
}