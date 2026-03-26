import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { ULTRASSOM_MICRO_MACROFOCADO_TEMPLATE } from "@/lib/consent-templates";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const patientId = String(body.patientId || "");
    const treatmentName = String(body.treatmentName || "").trim();

    if (!patientId || !treatmentName) {
      return NextResponse.json(
        { error: "patientId e treatmentName são obrigatórios." },
        { status: 400 }
      );
    }

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      return NextResponse.json({ error: "Paciente não encontrado." }, { status: 404 });
    }

    let title = `Termo de Consentimento - ${treatmentName}`;
    let content = String(body.content || "").trim();

    if (
      !content &&
      treatmentName === ULTRASSOM_MICRO_MACROFOCADO_TEMPLATE.treatmentName
    ) {
      title = ULTRASSOM_MICRO_MACROFOCADO_TEMPLATE.title;
      content = ULTRASSOM_MICRO_MACROFOCADO_TEMPLATE.content;
    }

    if (!content) {
      return NextResponse.json(
        { error: "Não foi encontrado conteúdo para este tratamento." },
        { status: 400 }
      );
    }

    const token = randomUUID().replace(/-/g, "");

    const document = await prisma.patientConsentDocument.create({
      data: {
        token,
        patientId,
        treatmentName,
        title,
        content,
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Erro ao gerar documento de consentimento." },
      { status: 500 }
    );
  }
}