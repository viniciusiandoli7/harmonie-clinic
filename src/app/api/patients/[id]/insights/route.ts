import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

type Ctx = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { id } = await context.params;

    const [patient, totalVisits, lastVisit] = await Promise.all([
      prisma.patient.findUnique({
        where: { id },
        select: { id: true, notes: true },
      }),
      prisma.appointment.count({
        where: { patientId: id, status: "COMPLETED" },
      }),
      prisma.appointment.findFirst({
        where: { patientId: id, status: "COMPLETED" },
        orderBy: { date: "desc" },
        select: { procedureName: true },
      }),
    ]);

    if (!patient) {
      return NextResponse.json({ error: "Paciente não encontrado" }, { status: 404 });
    }

    let loyaltyScore = "BAIXO";
    if (totalVisits > 5) loyaltyScore = "ALTO";
    else if (totalVisits >= 2) loyaltyScore = "MÉDIO";

    return NextResponse.json({
      totalVisits,
      lastProcedure: lastVisit?.procedureName || "---",
      loyaltyScore,
      criticalObservation: patient.notes || "Nenhuma observação crítica.",
      status: totalVisits > 0 ? "Ativo" : "Novo",
    });
  } catch (error) {
    console.error("Erro na rota insights:", error);
    return NextResponse.json({ error: "Erro interno ao gerar insights" }, { status: 500 });
  }
}
