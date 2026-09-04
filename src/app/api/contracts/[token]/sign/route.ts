import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ token: string }> };

function requestIp(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const { token } = await ctx.params;
    const body = await req.json();
    const signatureImage = typeof body.signatureImage === "string" ? body.signatureImage.trim() : "";

    if (!signatureImage || !signatureImage.startsWith("data:image/png;base64,")) {
      return NextResponse.json({ error: "Assinatura digital obrigatória." }, { status: 400 });
    }

    if (signatureImage.length > 2_500_000) {
      return NextResponse.json({ error: "Assinatura muito grande." }, { status: 413 });
    }

    const existing = await prisma.patientContract.findUnique({
      where: { token },
      select: { id: true, status: true, patient: { select: { name: true } } },
    });

    if (!existing) {
      return NextResponse.json({ error: "Contrato não encontrado." }, { status: 404 });
    }
    if (existing.status === "CANCELED") {
      return NextResponse.json({ error: "Este contrato foi cancelado e não pode ser assinado." }, { status: 409 });
    }
    if (existing.status === "SIGNED") {
      return NextResponse.json({ error: "Este contrato já foi assinado e não pode ser alterado." }, { status: 409 });
    }

    const signedAt = new Date();
    await prisma.patientContract.update({
      where: { token },
      data: {
        signatureImage,
        signatureName: existing.patient?.name || "Contratante",
        signatureIp: requestIp(req),
        signedAt,
        status: "SIGNED",
      },
    });

    return NextResponse.json({
      success: true,
      signatureName: existing.patient?.name || "Contratante",
      signedAt,
    });
  } catch (error) {
    console.error("Erro ao assinar contrato:", error);
    return NextResponse.json({ error: "Erro ao assinar contrato." }, { status: 500 });
  }
}
