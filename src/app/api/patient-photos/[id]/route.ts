import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

type Context = { params: Promise<{ id: string }> };

const photoSchema = z.object({
  title: z.string().optional().nullable(),
  procedureName: z.string().optional().nullable(),
  bodyArea: z.string().optional().nullable(),
  photoType: z.enum(["BEFORE", "AFTER", "CLINICAL", "MARKETING_AUTHORIZED"]).optional(),
  imageUrl: z.string().min(5).optional(),
  takenAt: z.string().optional().nullable(),
  imageAuthorized: z.boolean().optional(),
  notes: z.string().optional().nullable(),
});

export async function PATCH(req: NextRequest, context: Context) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const { id } = await context.params;
  const parsed = photoSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const before = await (prisma as any).patientPhoto.findUnique({ where: { id } });
  const photo = await (prisma as any).patientPhoto.update({
    where: { id },
    data: { ...parsed.data, takenAt: parsed.data.takenAt ? new Date(parsed.data.takenAt) : undefined },
  });
  await createAuditLog({ action: "UPDATE", entity: "PatientPhoto", entityId: id, description: "Foto clínica atualizada.", beforeJson: before, afterJson: photo });
  return NextResponse.json(photo);
}

export async function DELETE(_: NextRequest, context: Context) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const { id } = await context.params;
  const before = await (prisma as any).patientPhoto.findUnique({ where: { id } });
  await (prisma as any).patientPhoto.delete({ where: { id } });
  await createAuditLog({ action: "DELETE", entity: "PatientPhoto", entityId: id, description: "Foto clínica excluída.", beforeJson: before });
  return NextResponse.json({ success: true });
}
