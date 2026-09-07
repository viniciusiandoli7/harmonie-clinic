import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

type Ctx = {
  params: Promise<{ id: string }>;
};

function validateImageUrls(value: unknown) {
  if (!Array.isArray(value)) throw new Error("Formato de imagens inválido.");
  const urls = value.filter((item): item is string => typeof item === "string" && /^https:\/\//i.test(item));
  if (urls.length !== value.length) {
    throw new Error("As fotos precisam estar armazenadas externamente antes de salvar o prontuário.");
  }
  return urls.slice(0, 20);
}

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
        ...(body.entryType !== undefined && {
          entryType: ["SESSION", "FOLLOW_UP", "RETURN"].includes(String(body.entryType).toUpperCase())
            ? String(body.entryType).toUpperCase()
            : "FOLLOW_UP",
          countsTowardSession: String(body.entryType).toUpperCase() === "SESSION",
        }),
        ...(body.patientSignatureName !== undefined && { 
          patientSignatureName: String(body.patientSignatureName || "").trim() || null 
        }),
        ...(body.signatureImage !== undefined && { 
          signatureImage: body.signatureImage || null 
        }),
        ...(body.images !== undefined && { 
          imagesJson: validateImageUrls(body.images) 
        }),
      }
    });

    if (body.entryType !== undefined) {
      const plan = await prisma.clinicalEvolutionPlan.findUnique({ where: { id: updatedSession.planId } });
      if (plan) {
        const completedSessionsCount = await prisma.clinicalEvolutionSession.count({
          where: { planId: plan.id, countsTowardSession: true },
        });
        await prisma.clinicalEvolutionPlan.update({
          where: { id: plan.id },
          data: {
            completedSessions: completedSessionsCount,
            status:
              plan.status === "CANCELED"
                ? "CANCELED"
                : completedSessionsCount >= plan.totalSessions
                  ? "FINISHED"
                  : "ACTIVE",
          },
        });
      }
    }

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

    if (evolutionSession.signedAt || evolutionSession.signatureImage) {
      return NextResponse.json(
        { error: "Esta evolução possui ciência da paciente e foi preservada no prontuário. Registros assinados não podem ser excluídos." },
        { status: 409 }
      );
    }

    /**
     * Refinamento: Usamos uma Transaction para garantir integridade.
     * Deletamos a sessão e atualizamos o plano em uma única operação.
     */
    await prisma.$transaction(async (tx) => {
      // A. Remove retornos automáticos vinculados a essa sessão para não sobrar item na timeline/agenda
      await tx.appointment.deleteMany({
        where: {
          status: "RETURN",
          notes: { contains: `clinicalEvolutionSession:${id}` },
        },
      });

      // B. Deleta a sessão
      await tx.clinicalEvolutionSession.delete({
        where: { id: id },
      });

      // C. Busca o plano para ver quantas sessões RESTARAM
      const plan = await tx.clinicalEvolutionPlan.findUnique({
        where: { id: evolutionSession.planId },
      });

      if (plan) {
        const completedSessionsCount = await tx.clinicalEvolutionSession.count({
          where: { planId: plan.id, countsTowardSession: true },
        });

        await tx.clinicalEvolutionPlan.update({
          where: { id: plan.id },
          data: {
            completedSessions: completedSessionsCount,
            status:
              plan.status === "CANCELED"
                ? "CANCELED"
                : completedSessionsCount >= plan.totalSessions
                  ? "FINISHED"
                  : "ACTIVE",
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