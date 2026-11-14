import { randomUUID } from "crypto";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { IMAGE_AUTHORIZATION_TITLE } from "@/lib/imageAuthorizationLegal";
import { createAuditLog } from "@/lib/audit";
import { isImageAuthorizationSchemaError, repairImageAuthorizationSchema } from "@/lib/imageAuthorizationSchema";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await ctx.params;
  const loadDocuments = () => prisma.patientImageAuthorization.findMany({
    where: { patientId: id },
    orderBy: { createdAt: "desc" },
  });

  try {
    return NextResponse.json(await loadDocuments());
  } catch (error) {
    if (isImageAuthorizationSchemaError(error)) {
      try {
        await repairImageAuthorizationSchema();
        return NextResponse.json(await loadDocuments());
      } catch (repairError) {
        console.error("GET image-authorizations repair error:", repairError);
      }
    }

    // Não derruba a aba de contratos/prontuário por um erro isolado deste módulo.
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

  const createOrReuseAuthorization = async () => {
    const existingPending = await prisma.patientImageAuthorization.findFirst({
      where: { patientId: id, status: "PENDING" },
      orderBy: { createdAt: "desc" },
    });
    if (existingPending) return { document: existingPending, created: false };

    const document = await prisma.patientImageAuthorization.create({
      data: {
        patientId: id,
        token: randomUUID().replace(/-/g, ""),
        title: IMAGE_AUTHORIZATION_TITLE,
      },
    });
    return { document, created: true };
  };

  try {
    let result;
    try {
      result = await createOrReuseAuthorization();
    } catch (error) {
      if (!isImageAuthorizationSchemaError(error)) throw error;

      console.warn("Estrutura de autorização de imagem ausente/incompleta. Aplicando reparo restrito ao módulo.");
      await repairImageAuthorizationSchema();
      result = await createOrReuseAuthorization();
    }

    if (result.created) {
      await createAuditLog({
        action: "CREATE_IMAGE_AUTHORIZATION",
        entity: "PatientImageAuthorization",
        entityId: result.document.id,
        description: "Autorização de uso de imagem e voz gerada.",
        contextJson: { patientId: id, status: result.document.status },
      });
    }

    return NextResponse.json(result.document, { status: result.created ? 201 : 200 });
  } catch (error) {
    console.error("POST image-authorizations error:", error);
    return NextResponse.json(
      { error: "Não foi possível gerar a autorização de imagem agora. Tente novamente ou verifique a conexão com o banco." },
      { status: 503 },
    );
  }
}
