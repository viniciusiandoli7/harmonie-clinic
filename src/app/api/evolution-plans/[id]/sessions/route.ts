import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { schedulePatientReturn } from "@/services/returnSchedulingService";

type Ctx = {
  params: Promise<{ id: string }>;
};

type EntryType = "SESSION" | "FOLLOW_UP" | "RETURN";
const VALID_ENTRY_TYPES = new Set<EntryType>(["SESSION", "FOLLOW_UP", "RETURN"]);
const ENTRY_TYPE_MARKER = "__HARMONIE_ENTRY_TYPE__:";

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

function normalizeEntryType(value: unknown): EntryType {
  const normalized = String(value || "SESSION").trim().toUpperCase() as EntryType;
  return VALID_ENTRY_TYPES.has(normalized) ? normalized : "SESSION";
}

function encodeEntryMetadata(entryType: EntryType, bodyMeasurements: string | null) {
  const suffix = bodyMeasurements ? `\n${bodyMeasurements}` : "";
  return `${ENTRY_TYPE_MARKER}${entryType}${suffix}`;
}

export async function POST(req: Request, ctx: Ctx) {
  const authSession = await getServerSession(authOptions);
  if (!authSession) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const { id } = await ctx.params;
    const body = await req.json().catch(() => ({}));

    const plan = await prisma.clinicalEvolutionPlan.findUnique({
      where: { id },
      include: { sessions: { select: { sessionNumber: true } } },
    });

    if (!plan) return NextResponse.json({ error: "Tratamento não encontrado." }, { status: 404 });

    const entryType = normalizeEntryType(body.entryType);
    const countsTowardSession = entryType === "SESSION";

    if (countsTowardSession && plan.completedSessions >= plan.totalSessions) {
      return NextResponse.json(
        {
          error:
            "Todas as sessões contratadas já foram registradas. Para fotos de acompanhamento ou retorno, escolha uma opção que não consome sessão.",
        },
        { status: 400 },
      );
    }

    const bodyMeasurements = nullableText(body.bodyMeasurements);
    const clinicalNotes = nullableText(body.clinicalNotes);
    const nextEvolutionNumber = Math.max(0, ...plan.sessions.map((item) => Number(item.sessionNumber || 0))) + 1;

    const sessionRecord = await prisma.clinicalEvolutionSession.create({
      data: {
        planId: id,
        sessionNumber: nextEvolutionNumber,
        sessionDate: body.sessionDate ? new Date(body.sessionDate) : new Date(),
        performedProcedure: nullableText(body.performedProcedure) || plan.treatmentName,
        // O tipo do registro é armazenado em um marcador retrocompatível dentro de
        // bodyMeasurements. Assim NÃO criamos novas colunas e não colocamos os
        // prontuários antigos em risco por divergência de migration/schema.
        bodyMeasurements: encodeEntryMetadata(entryType, bodyMeasurements),
        clinicalNotes,
        patientSignatureName: nullableText(body.patientSignatureName),
        signatureImage: body.signatureImage || null,
        signedAt: body.signatureImage ? new Date() : null,
        imagesJson: validateImageUrls(body.images),
      },
    });

    const nextCompletedSessions = countsTowardSession
      ? Math.min(plan.totalSessions, plan.completedSessions + 1)
      : plan.completedSessions;

    await prisma.clinicalEvolutionPlan.update({
      where: { id },
      data: {
        completedSessions: nextCompletedSessions,
        status:
          plan.status === "CANCELED"
            ? "CANCELED"
            : nextCompletedSessions >= plan.totalSessions
              ? "FINISHED"
              : "ACTIVE",
      },
    });

    if (body.recommendedReturn) {
      await schedulePatientReturn({
        patientId: plan.patientId,
        procedureName: nullableText(body.performedProcedure) || plan.treatmentName,
        returnDate: body.recommendedReturn,
        returnTime: body.returnTime,
        notes: "Retorno definido ao registrar evolução do prontuário.",
        sourceRef: `clinicalEvolutionSession:${sessionRecord.id}; clinicalEvolutionPlan:${id}`,
      });
    }

    return NextResponse.json(sessionRecord, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar evolução clínica:", error);
    return NextResponse.json({ error: "Erro ao salvar a evolução." }, { status: 500 });
  }
}
