import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const body = await req.json();

    const updatedSession = await prisma.clinicalEvolutionSession.update({
      where: { id: id },
      data: {
        sessionNumber: Number(body.sessionNumber),
        sessionDate: body.sessionDate ? new Date(body.sessionDate) : new Date(),
        performedProcedure: String(body.performedProcedure || "").trim() || null,
        // Mantemos notes aqui. O frontend já junta, ou joga apenas nas anotações gerais
        clinicalNotes: String(body.clinicalNotes || "").trim() || null,
        patientSignatureName: String(body.patientSignatureName || "").trim() || null,
        imagesJson: Array.isArray(body.images) ? body.images : [],
      }
    });

    return NextResponse.json(updatedSession);
  } catch (error) {
    console.error("Erro ao editar sessão:", error);
    return NextResponse.json({ error: "Erro ao salvar as edições da sessão." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;

    // Busca a sessão antes de deletar
    const evolutionSession = await prisma.clinicalEvolutionSession.findUnique({
      where: { id: id }
    });

    if (evolutionSession) {
      await prisma.clinicalEvolutionSession.delete({
        where: { id: id },
      });

      // Recalcula o plano
      const plan = await prisma.clinicalEvolutionPlan.findUnique({
        where: { id: evolutionSession.planId },
        include: { sessions: true }
      });

      if (plan) {
        const completedSessions = Math.max(0, plan.completedSessions - 1);
        await prisma.clinicalEvolutionPlan.update({
          where: { id: plan.id },
          data: {
            completedSessions: completedSessions,
            status: completedSessions < plan.totalSessions ? "ACTIVE" : plan.status
          }
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar sessão:", error);
    return NextResponse.json({ error: "Erro ao excluir a sessão." }, { status: 500 });
  }
}