import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

type Ctx = {
  params: Promise<{ id: string }>;
};

function nullableText(value: unknown) {
  const text = String(value ?? "").trim();
  return text || null;
}

export async function POST(req: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const { id } = await ctx.params;
    const body = await req.json().catch(() => ({}));

    const bodyMeasurements = nullableText(body.bodyMeasurements);
    const clinicalNotes = nullableText(body.clinicalNotes);
    const finalNotes = bodyMeasurements
      ? `MEDIDAS: ${bodyMeasurements}${clinicalNotes ? `\n\nOBSERVAÇÕES: ${clinicalNotes}` : ""}`
      : clinicalNotes;

    const sessionRecord = await prisma.clinicalEvolutionSession.create({
      data: {
        planId: id,
        sessionNumber: Number(body.sessionNumber || 1),
        sessionDate: body.sessionDate ? new Date(body.sessionDate) : new Date(),
        performedProcedure: nullableText(body.performedProcedure),
        bodyMeasurements,
        clinicalNotes: finalNotes,
        patientSignatureName: nullableText(body.patientSignatureName),
        signatureImage: body.signatureImage || null,
        imagesJson: Array.isArray(body.images) ? body.images : [],
      },
    });

    const plan = await prisma.clinicalEvolutionPlan.findUnique({
      where: { id },
      include: { sessions: true },
    });

    if (plan) {
      await prisma.clinicalEvolutionPlan.update({
        where: { id },
        data: {
          completedSessions: plan.sessions.length,
          status: plan.sessions.length >= plan.totalSessions ? "FINISHED" : plan.status,
        },
      });
    }

    return NextResponse.json(sessionRecord, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar sessão de evolução:", error);
    return NextResponse.json({ error: "Erro ao salvar a sessão." }, { status: 500 });
  }
}
