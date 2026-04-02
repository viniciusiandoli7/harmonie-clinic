import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        appointments: {
          // Aqui deve ser COMPLETED conforme seu Enum no Schema
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

    // Lógica de Score
    let loyaltyScore = "BAIXO";
    if (totalVisits > 5) loyaltyScore = "ALTO";
    else if (totalVisits >= 2) loyaltyScore = "MÉDIO";

    return NextResponse.json({
      totalVisits,
      lastProcedure,
      loyaltyScore,
      // No seu Schema o campo é 'notes'
      criticalObservation: patient.notes || "Nenhuma observação crítica.",
      status: totalVisits > 0 ? "Ativo" : "Novo",
    });
  } catch (error) {
    console.error("Erro na rota insights:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}