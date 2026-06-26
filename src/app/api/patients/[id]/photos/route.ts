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
  photoType: z.enum(["BEFORE", "AFTER", "CLINICAL", "MARKETING_AUTHORIZED"]).optional().default("CLINICAL"),
  imageUrl: z.string().min(5),
  takenAt: z.string().optional().nullable(),
  imageAuthorized: z.boolean().optional().default(false),
  notes: z.string().optional().nullable(),
});

export async function GET(_: NextRequest, context: Context) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await context.params;
  const photos = await (prisma as any).patientPhoto.findMany({ where: { patientId: id }, orderBy: { takenAt: "desc" } });
  return NextResponse.json(photos);
}

export async function POST(req: NextRequest, context: Context) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await context.params;
  const parsed = photoSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const photo = await (prisma as any).patientPhoto.create({
    data: {
      patientId: id,
      ...parsed.data,
      takenAt: parsed.data.takenAt ? new Date(parsed.data.takenAt) : new Date(),
    },
  });

  await createAuditLog({ action: "CREATE", entity: "PatientPhoto", entityId: photo.id, description: "Foto clínica adicionada.", afterJson: photo });
  return NextResponse.json(photo, { status: 201 });
}
