import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ token: string }> };

function requestIp(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const { token } = await ctx.params;
    const { signatureImage, signatureName } = await req.json();

    if (!signatureImage) {
      return NextResponse.json({ error: "Assinatura obrigatória." }, { status: 400 });
    }

    await prisma.patientContract.update({
      where: { token },
      data: {
        signatureImage,
        signatureName: typeof signatureName === "string" && signatureName.trim() ? signatureName.trim() : undefined,
        signatureIp: requestIp(req),
        signedAt: new Date(),
        status: "SIGNED",
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro ao assinar contrato." }, { status: 500 });
  }
}
