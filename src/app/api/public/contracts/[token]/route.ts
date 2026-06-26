import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = {
  params: Promise<{ token: string }>;
};

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { token } = await ctx.params;

  try {
    const contract = await prisma.patientContract.findUnique({
      where: { token },
      include: { patient: { select: { name: true } } },
    });

    if (!contract) {
      return NextResponse.json({ error: "Contrato não encontrado." }, { status: 404 });
    }

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
    return NextResponse.json({ error: "Erro ao carregar contrato." }, { status: 500 });
  }
}
