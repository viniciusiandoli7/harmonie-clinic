import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = {
  params: Promise<{ token: string }>;
};

function requestIp(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const { token } = await ctx.params;

  try {
    const body = await req.json();
    const signatureName = String(body.signatureName || "").trim();

    if (!signatureName) {
      return NextResponse.json({ error: "Nome da assinatura é obrigatório." }, { status: 400 });
    }

    const document = await prisma.patientConsentDocument.update({
      where: { token },
      data: {
        status: "SIGNED",
        signatureName,
        signatureIp: requestIp(req),
        signedAt: new Date(),
      },
      include: {
        patient: { select: { name: true } },
        treatment: { select: { name: true } },
      },
    });

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
    return NextResponse.json({ error: "Erro ao assinar documento." }, { status: 500 });
  }
}
