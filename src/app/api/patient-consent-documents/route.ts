import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get("patientId");

    if (!patientId) {
      return NextResponse.json({ error: "patientId obrigatório" }, { status: 400 });
    }

    const documents = await prisma.patientConsentDocument.findMany({
      where: { patientId },
      include: {
        treatment: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao buscar documentos" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const patientId = String(body.patientId || "");
    const treatmentId = String(body.treatmentId || "");

    if (!patientId || !treatmentId) {
      return NextResponse.json(
        { error: "patientId e treatmentId são obrigatórios." },
        { status: 400 }
      );
    }

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      return NextResponse.json({ error: "Paciente não encontrado." }, { status: 404 });
    }

    const treatment = await prisma.treatment.findUnique({
      where: { id: treatmentId },
    });

    if (!treatment) {
      return NextResponse.json({ error: "Tratamento não encontrado." }, { status: 404 });
    }

    const token = randomUUID().replace(/-/g, "");

    const document = await prisma.patientConsentDocument.create({
      data: {
        token,
        patientId,
        treatmentId,
        title: `Termo de Consentimento - ${treatment.name}`,
        content: treatment.template,
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