import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req: NextRequest) {
  // BLOQUEIO DE SEGURANÇA
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

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
    console.error("Erro ao buscar documentos de consentimento:", error);
    return NextResponse.json({ error: "Erro ao buscar documentos" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // BLOQUEIO DE SEGURANÇA
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

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

    // Valida se o paciente existe
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      return NextResponse.json({ error: "Paciente não encontrado." }, { status: 404 });
    }

    // Busca o tratamento para herdar o template (termo padrão)
    const treatment = await prisma.treatment.findUnique({
      where: { id: treatmentId },
    });

    if (!treatment) {
      return NextResponse.json({ error: "Tratamento não encontrado." }, { status: 404 });
    }

    // Gera o token de acesso para assinatura externa
    const token = randomUUID().replace(/-/g, "");

    const document = await prisma.patientConsentDocument.create({
      data: {
        token,
        patientId,
        treatmentId,
        title: `Termo de Consentimento - ${treatment.name}`,
        content: treatment.template, // Aqui o sistema já puxa o texto jurídico padrão
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error("Erro ao gerar termo de consentimento:", error);
    return NextResponse.json(
      { error: "Erro ao gerar documento de consentimento." },
      { status: 500 }
    );
  }
}