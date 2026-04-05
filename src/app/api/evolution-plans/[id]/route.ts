import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

type Ctx = {
  params: Promise<{ id: string }>;
};

// ==========================================
// 1. EDITA A SESSÃO (Botão de Lápis / Salvar Alterações)
// ==========================================
export async function PATCH(req: NextRequest, ctx: Ctx) {
  // BLOQUEIO DE SEGURANÇA
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { id } = await ctx.params;
    const body = await req.json();

    // Atualiza os dados da sessão
    const updatedSession = await prisma.clinicalEvolutionSession.update({
      where: { id: id },
      data: {
        sessionNumber: Number(body.sessionNumber),
        sessionDate: body.sessionDate ? new Date(body.sessionDate) : new Date(),
        performedProcedure: String(body.performedProcedure || "").trim() || null,
        bodyMeasurements: String(body.bodyMeasurements || "").trim() || null,
        clinicalNotes: String(body.clinicalNotes || "").trim() || null,
        patientSignatureName: String(body.patientSignatureName || "").trim() || null,
        imagesJson: Array.isArray(body.images) ? body.images : [],
      }
    });

    return NextResponse.json(updatedSession);
  } catch (error) {
    console.error("Erro ao editar sessão:", error);
    return NextResponse.json(
      { error: "Erro ao salvar as edições da sessão." }, 
      { status: 500 }
    );
  }
}

// ==========================================
// 2. DELETA A SESSÃO (Botão Excluir Sessão)
// ==========================================
export async function DELETE(req: NextRequest, ctx: Ctx) {
  // BLOQUEIO DE SEGURANÇA
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { id } = await ctx.params;

    // A. Busca a sessão para saber a qual Plano ela pertence antes de apagar
    const evolutionSession = await prisma.clinicalEvolutionSession.findUnique({
      where: { id: id }
    });

    if (evolutionSession) {
      // B. Deleta a sessão do banco de dados
      await prisma.clinicalEvolutionSession.delete({
        where: { id: id },
      });

      // C. Recalcula as sessões concluídas no Plano
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
            // Se o número de sessões realizadas ficou menor que o total, o plano volta a ficar ACTIVE
            status: completedSessions < plan.totalSessions ? "ACTIVE" : plan.status
          }
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar sessão:", error);
    return NextResponse.json(
      { error: "Erro ao excluir a sessão." }, 
      { status: 500 }
    );
  }
}