import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = {
  params: Promise<{ token: string }>;
};

export async function POST(req: NextRequest, ctx: Ctx) {
  const { token } = await ctx.params;

  try {
    const body = await req.json();
    const signatureName = String(body.signatureName || "").trim();

    if (!signatureName) {
      return NextResponse.json(
        { error: "Nome da assinatura é obrigatório." },
        { status: 400 }
      );
    }

    const ip =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "unknown";

    const contract = await prisma.patientContract.update({
      where: { token },
      data: {
        status: "SIGNED",
        signedAt: new Date(),
        signatureName,
        signatureIp: ip,
      },
    });

    return NextResponse.json(contract);
  } catch {
    return NextResponse.json(
      { error: "Erro ao assinar contrato." },
      { status: 500 }
    );
  }
}