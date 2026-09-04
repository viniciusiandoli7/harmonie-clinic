import { getServerSession } from "next-auth/next";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

type Ctx = { params: Promise<{ id: string; authorizationId: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id, authorizationId } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const action = String(body.action || "").toUpperCase();

  const current = await prisma.patientImageAuthorization.findFirst({
    where: { id: authorizationId, patientId: id },
  });
  if (!current) return NextResponse.json({ error: "Autorização não encontrada." }, { status: 404 });

  if (action === "REVOKE") {
    if (current.status !== "SIGNED") {
      return NextResponse.json({ error: "Somente uma autorização assinada pode ser revogada." }, { status: 409 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.patientImageAuthorization.update({
        where: { id: current.id },
        data: {
          status: "REVOKED",
          revokedAt: new Date(),
          revokedReason: String(body.reason || "Revogação solicitada pela paciente").trim() || "Revogação solicitada pela paciente",
        },
      });

      const anotherActive = await tx.patientImageAuthorization.count({
        where: { patientId: id, status: "SIGNED", id: { not: current.id } },
      });
      await tx.patient.update({
        where: { id },
        data: { imageAuthorized: anotherActive > 0 },
      });
      return updated;
    });

    const hasActiveAuthorization = await prisma.patientImageAuthorization.count({
      where: { patientId: id, status: "SIGNED" },
    });
    await createAuditLog({
      action: "REVOKE_IMAGE_AUTHORIZATION",
      entity: "PatientImageAuthorization",
      entityId: result.id,
      description: "Autorização de uso de imagem e voz revogada.",
      beforeJson: current,
      afterJson: result,
      contextJson: { patientId: id },
    });
    return NextResponse.json({ ...result, imageAuthorized: hasActiveAuthorization > 0 });
  }

  if (action === "CANCEL") {
    if (current.status !== "PENDING") {
      return NextResponse.json({ error: "Somente uma autorização pendente pode ser cancelada." }, { status: 409 });
    }
    const updated = await prisma.patientImageAuthorization.update({
      where: { id: current.id },
      data: { status: "CANCELED" },
    });
    await createAuditLog({
      action: "CANCEL_IMAGE_AUTHORIZATION",
      entity: "PatientImageAuthorization",
      entityId: updated.id,
      description: "Solicitação de autorização de imagem cancelada.",
      beforeJson: current,
      afterJson: updated,
      contextJson: { patientId: id },
    });
    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
}
