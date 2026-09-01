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
    const signatureImage = typeof body.signatureImage === "string" ? body.signatureImage.trim() : "";

    if (!signatureName && !signatureImage) {
      return NextResponse.json({ error: "Assinatura obrigatória." }, { status: 400 });
    }

    if (signatureImage && !signatureImage.startsWith("data:image/png;base64,")) {
      return NextResponse.json({ error: "Formato de assinatura inválido." }, { status: 400 });
    }

    // Evita aceitar payloads anormalmente grandes em uma rota pública.
    if (signatureImage.length > 2_500_000) {
      return NextResponse.json({ error: "Assinatura muito grande. Limpe e tente assinar novamente." }, { status: 413 });
    }

    const existing = await prisma.patientContract.findUnique({
      where: { token },
      select: { id: true, status: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Contrato não encontrado." }, { status: 404 });
    }

    if (existing.status === "CANCELED") {
      return NextResponse.json({ error: "Este contrato foi cancelado e não pode ser assinado." }, { status: 409 });
    }

    const contract = await prisma.patientContract.update({
      where: { token },
      data: {
        status: "SIGNED",
        ...(signatureName ? { signatureName } : {}),
        ...(signatureImage ? { signatureImage } : {}),
        signatureIp: requestIp(req),
        signedAt: new Date(),
      },
      include: { patient: { select: { name: true } } },
    });

    return NextResponse.json({
      id: contract.id,
      title: contract.title,
      content: contract.content,
      total: contract.total,
      status: contract.status,
      signatureName: contract.signatureName,
      signedAt: contract.signedAt,
      patient: contract.patient,
    });
  } catch (error) {
    console.error("Erro ao assinar contrato público:", error);
    return NextResponse.json({ error: "Erro ao assinar contrato." }, { status: 500 });
  }
}
