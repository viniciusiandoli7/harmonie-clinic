import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const { id } = await ctx.params;
  const tasks = await (prisma as any).postProcedureTask.findMany({
    where: { patientId: id },
    include: { treatment: true, patient: { select: { id: true, name: true, phone: true } } },
    orderBy: { dueDate: "asc" },
  });
  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const { id } = await ctx.params;
  const body = await req.json();
  const title = String(body.title || "Acompanhamento pós-procedimento").trim();
  if (!body.dueDate) return NextResponse.json({ error: "Data do acompanhamento é obrigatória." }, { status: 400 });

  const task = await (prisma as any).postProcedureTask.create({
    data: {
      patientId: id,
      treatmentId: body.treatmentId || null,
      title,
      message: body.message || null,
      dueDate: new Date(body.dueDate),
      channel: body.channel || "WhatsApp",
      status: body.status || "PENDING",
    },
  });
  await createAuditLog({ action: "CREATE", entity: "PostProcedureTask", entityId: task.id, description: `Acompanhamento criado: ${title}`, afterJson: task });
  return NextResponse.json(task, { status: 201 });
}
