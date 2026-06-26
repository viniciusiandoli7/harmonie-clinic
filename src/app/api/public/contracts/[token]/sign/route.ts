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

    const contract = await prisma.patientContract.update({
      where: { token },
      data: {
        status: "SIGNED",
        signatureName,
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
  } catch {
    return NextResponse.json({ error: "Erro ao assinar contrato." }, { status: 500 });
  }
}
