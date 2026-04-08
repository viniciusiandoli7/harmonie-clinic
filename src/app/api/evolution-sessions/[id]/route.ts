import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

type Ctx = {
  params: Promise<{ id: string }>;
};

// ==========================================
// 1. EDITA A SESSÃO (PATCH)
// ==========================================
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { id } = await ctx.params;
    const body = await req.json();

    // Refinamento: Construção dinâmica do objeto de update para não sobrescrever com null por erro
    const updatedSession = await prisma.clinicalEvolutionSession.update({
      where: { id: id },
      data: {
        ...(body.sessionNumber !== undefined && { sessionNumber: Number(body.sessionNumber) }),
        ...(body.sessionDate !== undefined && { sessionDate: new Date(body.sessionDate) }),
        ...(body.performedProcedure !== undefined && { 
          performedProcedure: String(body.performedProcedure || "").trim() || null 
        }),
        // O campo abaixo agora está liberado pelo Schema!
        ...(body.bodyMeasurements !== undefined && { 
          bodyMeasurements: String(body.bodyMeasurements || "").trim() || null 
        }),
        ...(body.clinicalNotes !== undefined && { 
          clinicalNotes: String(body.clinicalNotes || "").trim() || null 
        }),
        ...(body.patientSignatureName !== undefined && { 
          patientSignatureName: String(body.patientSignatureName || "").trim() || null 
        }),
        ...(body.signatureImage !== undefined && { 
          signatureImage: body.signatureImage || null 
        }),
        ...(body.images !== undefined && { 
          imagesJson: Array.isArray(body.images) ? body.images : [] 
        }),
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
// 2. DELETA A SESSÃO (DELETE)
// ==========================================
export async function DELETE(req: NextRequest, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { id } = await ctx.params;

    // Busca a sessão para identificar o Plano pai
    const evolutionSession = await prisma.clinicalEvolutionSession.findUnique({
      where: { id: id }
    });

    if (!evolutionSession) {
      return NextResponse.json({ error: "Sessão não encontrada." }, { status: 404 });
    }

    /**
     * Refinamento: Usamos uma Transaction para garantir integridade.
     * Deletamos a sessão e atualizamos o plano em uma única operação.
     */
    await prisma.$transaction(async (tx) => {
      // A. Deleta a sessão
      await tx.clinicalEvolutionSession.delete({
        where: { id: id },
      });

      // B. Busca o plano para ver quantas sessões RESTARAM
      const plan = await tx.clinicalEvolutionPlan.findUnique({
        where: { id: evolutionSession.planId },
        include: { sessions: true }
      });

      if (plan) {
        // O contador real é o número de sessões que restaram no banco para esse plano
        const completedSessionsCount = plan.sessions.length;
        
        await tx.clinicalEvolutionPlan.update({
          where: { id: plan.id },
          data: {
            completedSessions: completedSessionsCount,
            // Se o plano estava FINALIZADO mas deletamos uma sessão, ele volta para ATIVO
            status: completedSessionsCount < plan.totalSessions ? "ACTIVE" : plan.status
          }
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar sessão:", error);
    return NextResponse.json(
      { error: "Erro ao excluir a sessão." }, 
      { status: 500 }
    );
  }
}