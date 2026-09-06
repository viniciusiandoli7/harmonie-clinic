import { randomUUID } from "crypto";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { IMAGE_AUTHORIZATION_TITLE } from "@/lib/imageAuthorizationLegal";
import { createAuditLog } from "@/lib/audit";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await ctx.params;
  try {
    const documents = await prisma.patientImageAuthorization.findMany({
      where: { patientId: id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(documents);
  } catch (error) {
    // Não derruba a aba de contratos/prontuário se a migration deste módulo
    // ainda não tiver sido aplicada no ambiente.
    console.error("GET image-authorizations error:", error);
    return NextResponse.json([]);
  }
}

export async function POST(_: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await ctx.params;
  const patient = await prisma.patient.findUnique({ where: { id }, select: { id: true } });
  if (!patient) return NextResponse.json({ error: "Paciente não encontrado." }, { status: 404 });

  try {
    const existingPending = await prisma.patientImageAuthorization.findFirst({
      where: { patientId: id, status: "PENDING" },
      orderBy: { createdAt: "desc" },
    });
    if (existingPending) return NextResponse.json(existingPending);

    const document = await prisma.patientImageAuthorization.create({
      data: {
        patientId: id,
        token: randomUUID().replace(/-/g, ""),
        title: IMAGE_AUTHORIZATION_TITLE,
      },
    });
    await createAuditLog({
      action: "CREATE_IMAGE_AUTHORIZATION",
      entity: "PatientImageAuthorization",
      entityId: document.id,
      description: "Autorização de uso de imagem e voz gerada.",
      contextJson: { patientId: id, status: document.status },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error("POST image-authorizations error:", error);
    return NextResponse.json(
      { error: "A autorização de imagem ainda não está disponível neste banco. Execute as migrations e tente novamente." },
      { status: 503 },
    );
  }
}
