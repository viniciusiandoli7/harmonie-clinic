import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = {
  params: Promise<{ planId: string }>;
};

export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const { planId } = await ctx.params;
    const body = await req.json();

    const sessionNumber = Number(body.sessionNumber || 1);
    const sessionDate = body.sessionDate ? new Date(body.sessionDate) : new Date();
    const performedProcedure = String(body.performedProcedure || "").trim() || null;
    const bodyMeasurements = String(body.bodyMeasurements || "").trim() || null;
    const clinicalNotes = String(body.clinicalNotes || "").trim() || null;
    const patientSignatureName =
      String(body.patientSignatureName || "").trim() || null;

    const images = Array.isArray(body.images)
      ? body.images
          .map((value) => String(value || "").trim())
          .filter(Boolean)
      : [];

    const session = await prisma.clinicalEvolutionSession.create({
      data: {
        planId,
        sessionNumber,
        sessionDate,
        performedProcedure,
        bodyMeasurements,
        clinicalNotes,
        patientSignatureName,
        signedAt: patientSignatureName ? new Date() : null,
        imagesJson: images,
      },
    });

    const plan = await prisma.clinicalEvolutionPlan.findUnique({
      where: { id: planId },
      include: { sessions: true },
    });

    if (plan) {
      const completedSessions = plan.sessions.length;
      await prisma.clinicalEvolutionPlan.update({
        where: { id: planId },
        data: {
          completedSessions,
          status:
            completedSessions >= plan.totalSessions ? "FINISHED" : plan.status,
        },
      });
    }

    return NextResponse.json(session, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Erro ao criar sessão de evolução." },
      { status: 500 }
    );
  }
}