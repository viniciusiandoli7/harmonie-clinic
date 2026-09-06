import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hydrateContractMetadata } from "@/lib/contractStorage";

type Ctx = {
  params: Promise<{ token: string }>;
};

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { token } = await ctx.params;

  try {
    const contract = await prisma.patientContract.findUnique({
      where: { token },
      select: {
        id: true,
        token: true,
        title: true,
        content: true,
        total: true,
        status: true,
        signatureName: true,
        signedAt: true,
        createdAt: true,
        patient: { select: { name: true } },
      },
    });

    if (!contract) {
      return NextResponse.json({ error: "Contrato não encontrado." }, { status: 404 });
    }

    const withMetadata = hydrateContractMetadata(contract);
    return NextResponse.json({
      id: withMetadata.id,
      title: withMetadata.title,
      content: withMetadata.content,
      total: withMetadata.total,
      contractNumber: withMetadata.contractNumber,
      validUntil: withMetadata.validUntil,
      status: withMetadata.status,
      signatureName: withMetadata.signatureName,
      signedAt: withMetadata.signedAt,
      patient: withMetadata.patient,
    });
  } catch {
    return NextResponse.json({ error: "Erro ao carregar contrato." }, { status: 500 });
  }
}
