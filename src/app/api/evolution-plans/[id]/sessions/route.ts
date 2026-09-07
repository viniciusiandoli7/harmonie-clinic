import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { schedulePatientReturn } from "@/services/returnSchedulingService";

type Ctx = {
  params: Promise<{ id: string }>;
};

const VALID_ENTRY_TYPES = new Set(["SESSION", "FOLLOW_UP", "RETURN"]);

function validateImageUrls(value: unknown) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw new Error("Formato de imagens inválido.");

  const urls = value.filter((item): item is string => typeof item === "string" && /^https:\/\//i.test(item));
  if (urls.length !== value.length) {
    throw new Error("As fotos precisam estar armazenadas externamente antes de salvar o prontuário.");
  }
  return urls.slice(0, 20);
}

function nullableText(value: unknown) {
  const text = String(value ?? "").trim();
  return text || null;
}

function normalizeEntryType(value: unknown) {
  const entryType = String(value || "SESSION").trim().toUpperCase();
  return VALID_ENTRY_TYPES.has(entryType) ? entryType : "SESSION";
}

export async function POST(req: Request, ctx: Ctx) {
  const authSession = await getServerSession(authOptions);
  if (!authSession) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const { id } = await ctx.params;
    const body = await req.json().catch(() => ({}));

    const planBefore = await prisma.clinicalEvolutionPlan.findUnique({
      where: { id },
      include: { sessions: { select: { sessionNumber: true, countsTowardSession: true } } },
    });

    if (!planBefore) {
      return NextResponse.json({ error: "Tratamento não encontrado." }, { status: 404 });
    }

    const bodyMeasurements = nullableText(body.bodyMeasurements);
    const clinicalNotes = nullableText(body.clinicalNotes);
    const finalNotes = bodyMeasurements
      ? `MEDIDAS: ${bodyMeasurements}${clinicalNotes ? `\n\nOBSERVAÇÕES: ${clinicalNotes}` : ""}`
      : clinicalNotes;

    const entryType = normalizeEntryType(body.entryType);
    const countsTowardSession = entryType === "SESSION";
    const nextEvolutionNumber = Math.max(0, ...planBefore.sessions.map((item) => item.sessionNumber || 0)) + 1;

    if (countsTowardSession) {
      const completedCount = planBefore.sessions.filter((item) => item.countsTowardSession !== false).length;
      if (completedCount >= planBefore.totalSessions) {
        return NextResponse.json(
          {
            error: "Todas as sessões contratadas já foram registradas. Para fotos de acompanhamento ou retorno, escolha um registro que não consome sessão.",
          },
          { status: 400 }
        );
      }
    }

    const sessionRecord = await prisma.clinicalEvolutionSession.create({
      data: {
        planId: id,
        sessionNumber: nextEvolutionNumber,
        sessionDate: body.sessionDate ? new Date(body.sessionDate) : new Date(),
        performedProcedure: nullableText(body.performedProcedure) || planBefore.treatmentName,
        bodyMeasurements,
        clinicalNotes: finalNotes,
        entryType,
        countsTowardSession,
        patientSignatureName: nullableText(body.patientSignatureName),
        signatureImage: body.signatureImage || null,
        signedAt: body.signatureImage ? new Date() : null,
        imagesJson: validateImageUrls(body.images),
      },
    });

    const countedSessions = await prisma.clinicalEvolutionSession.count({
      where: { planId: id, countsTowardSession: true },
    });

    await prisma.clinicalEvolutionPlan.update({
      where: { id },
      data: {
        completedSessions: countedSessions,
        status:
          planBefore.status === "CANCELED"
            ? "CANCELED"
            : countedSessions >= planBefore.totalSessions
              ? "FINISHED"
              : "ACTIVE",
      },
    });

    if (body.recommendedReturn) {
      await schedulePatientReturn({
        patientId: planBefore.patientId,
        procedureName: nullableText(body.performedProcedure) || planBefore.treatmentName,
        returnDate: body.recommendedReturn,
        returnTime: body.returnTime,
        notes: "Retorno definido ao registrar evolução do prontuário.",
        sourceRef: `clinicalEvolutionSession:${sessionRecord.id}; clinicalEvolutionPlan:${id}`,
      });
    }

    return NextResponse.json(sessionRecord, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar sessão de evolução:", error);
    return NextResponse.json({ error: "Erro ao salvar a evolução." }, { status: 500 });
  }
}
