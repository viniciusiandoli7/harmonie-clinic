import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ token: string }> };

export async function GET(_: Request, ctx: Ctx) {
  const { token } = await ctx.params;
  const document = await prisma.patientImageAuthorization.findUnique({
    where: { token },
    include: { patient: { select: { name: true, cpf: true } } },
  });

  if (!document) return NextResponse.json({ error: "Autorização não encontrada." }, { status: 404 });

  return NextResponse.json({
    id: document.id,
    title: document.title,
    status: document.status,
    contentTypes: document.contentTypesJson,
    channels: document.channelsJson,
    signatureName: document.signatureName,
    signatureImage: document.signatureImage,
    signedAt: document.signedAt,
    revokedAt: document.revokedAt,
    patient: document.patient,
  });
}
