import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { IMAGE_CHANNEL_OPTIONS, IMAGE_CONTENT_OPTIONS } from "@/lib/imageAuthorizationLegal";
import { createAuditLog } from "@/lib/audit";

type Ctx = { params: Promise<{ token: string }> };

function requestIp(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

function validSelection(value: unknown, allowed: readonly { key: string }[]) {
  if (!Array.isArray(value)) return [];
  const set = new Set(allowed.map((item) => item.key));
  return Array.from(new Set(value.map(String).filter((key) => set.has(key))));
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const { token } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const signatureImage = typeof body.signatureImage === "string" ? body.signatureImage.trim() : "";
  const contentTypes = validSelection(body.contentTypes, IMAGE_CONTENT_OPTIONS);
  const channels = validSelection(body.channels, IMAGE_CHANNEL_OPTIONS);

  if (!signatureImage.startsWith("data:image/png;base64,")) {
    return NextResponse.json({ error: "Assinatura digital obrigatória." }, { status: 400 });
  }
  if (signatureImage.length > 2_500_000) {
    return NextResponse.json({ error: "Assinatura muito grande. Limpe e tente novamente." }, { status: 413 });
  }
  if (!contentTypes.length) {
    return NextResponse.json({ error: "Selecione ao menos um tipo de conteúdo autorizado." }, { status: 400 });
  }
  if (!channels.length) {
    return NextResponse.json({ error: "Selecione ao menos um canal de divulgação autorizado." }, { status: 400 });
  }

  const existing = await prisma.patientImageAuthorization.findUnique({
    where: { token },
    include: { patient: { select: { id: true, name: true, cpf: true } } },
  });
  if (!existing) return NextResponse.json({ error: "Autorização não encontrada." }, { status: 404 });
  if (existing.status === "SIGNED") return NextResponse.json({ error: "Esta autorização já foi assinada." }, { status: 409 });
  if (existing.status === "REVOKED" || existing.status === "CANCELED") {
    return NextResponse.json({ error: "Esta autorização não está disponível para assinatura." }, { status: 409 });
  }

  const signedAt = new Date();
  const document = await prisma.$transaction(async (tx) => {
    const updated = await tx.patientImageAuthorization.update({
      where: { id: existing.id },
      data: {
        status: "SIGNED",
        contentTypesJson: contentTypes,
        channelsJson: channels,
        signatureName: existing.patient.name,
        signatureImage,
        signatureIp: requestIp(req),
        signedAt,
      },
      include: { patient: { select: { name: true, cpf: true } } },
    });
    await tx.patient.update({ where: { id: existing.patient.id }, data: { imageAuthorized: true } });
    return updated;
  });

  await createAuditLog({
    action: "SIGN_IMAGE_AUTHORIZATION",
    entity: "PatientImageAuthorization",
    entityId: document.id,
    description: "Autorização de uso de imagem e voz assinada eletronicamente pela paciente.",
    userName: document.signatureName || document.patient.name || "Paciente",
    contextJson: {
      patientId: existing.patient.id,
      contentTypes,
      channels,
      signedAt: document.signedAt,
      signatureIp: requestIp(req),
    },
  });

  return NextResponse.json({
    id: document.id,
    title: document.title,
    status: document.status,
    contentTypes: document.contentTypesJson,
    channels: document.channelsJson,
    signatureName: document.signatureName,
    signatureImage: document.signatureImage,
    signedAt: document.signedAt,
    patient: document.patient,
  });
}
