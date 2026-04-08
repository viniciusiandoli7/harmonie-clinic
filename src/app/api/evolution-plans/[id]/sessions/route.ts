import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = {
  params: Promise<{ id: string }>;
};

export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const body = await req.json();

    // Junta bodyMeasurements nas clinicalNotes, pois a tabela não tem a coluna separada
    let finalNotes = body.clinicalNotes || "";
    if (body.bodyMeasurements) {
      finalNotes = `MEDIDAS: ${body.bodyMeasurements}\n\nOBSERVAÇÕES: ${finalNotes}`;
    }

    const session = await prisma.clinicalEvolutionSession.create({
      data: {
        planId: id, // Aqui usamos 'id' que vem da URL
        sessionNumber: Number(body.sessionNumber || 1),
        sessionDate: body.sessionDate ? new Date(body.sessionDate) : new Date(),
        performedProcedure: String(body.performedProcedure || "").trim() || null,
        clinicalNotes: finalNotes, 
        patientSignatureName: String(body.patientSignatureName || "").trim() || null,
        signatureImage: body.signatureImage || null, // 👈 A ASSINATURA SENDO SALVA AQUI!
        imagesJson: Array.isArray(body.images) ? body.images : [],
      },
    });

    // Atualiza a contagem do plano
    const plan = await prisma.clinicalEvolutionPlan.findUnique({
      where: { id: id },
      include: { sessions: true },
    });

    if (plan) {
      await prisma.clinicalEvolutionPlan.update({
        where: { id: id },
        data: {
          completedSessions: plan.sessions.length,
          status: plan.sessions.length >= plan.totalSessions ? "FINISHED" : plan.status,
        },
      });
    }

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar sessão de evolução:", error);
    return NextResponse.json({ error: "Erro ao salvar a sessão." }, { status: 500 });
  }
}