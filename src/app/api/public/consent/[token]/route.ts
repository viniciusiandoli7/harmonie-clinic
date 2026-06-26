import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = {
  params: Promise<{ token: string }>;
};

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { token } = await ctx.params;

  try {
    const document = await prisma.patientConsentDocument.findUnique({
      where: { token },
      include: {
        patient: { select: { name: true } },
        treatment: { select: { name: true } },
      },
    });

    if (!document) {
      return NextResponse.json({ error: "Documento não encontrado." }, { status: 404 });
    }

    return NextResponse.json({
      id: document.id,
      title: document.title,
      content: document.content,
      status: document.status,
      signedAt: document.signedAt,
      signatureName: document.signatureName,
      patient: document.patient,
      treatmentName: document.treatment.name,
    });
  } catch {
    return NextResponse.json({ error: "Erro ao carregar documento." }, { status: 500 });
  }
}
