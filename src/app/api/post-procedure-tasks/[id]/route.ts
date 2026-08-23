import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const { id } = await ctx.params;
  const body = await req.json();
  const before = await (prisma as any).postProcedureTask.findUnique({ where: { id } });
  if (!before) return NextResponse.json({ error: "Acompanhamento não encontrado." }, { status: 404 });
  const status = body.status || before.status;
  const task = await (prisma as any).postProcedureTask.update({
    where: { id },
    data: {
      ...(body.title !== undefined ? { title: body.title || before.title } : {}),
      ...(body.message !== undefined ? { message: body.message || null } : {}),
      ...(body.dueDate !== undefined ? { dueDate: new Date(body.dueDate) } : {}),
      status,
      ...(status === "DONE" && !before.completedAt ? { completedAt: new Date() } : {}),
      ...(status !== "DONE" ? { completedAt: null } : {}),
    },
  });
  await createAuditLog({ action: "UPDATE", entity: "PostProcedureTask", entityId: id, description: `Acompanhamento atualizado: ${task.title}`, beforeJson: before, afterJson: task });
  return NextResponse.json(task);
}

export async function DELETE(_: NextRequest, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const { id } = await ctx.params;
  const before = await (prisma as any).postProcedureTask.findUnique({ where: { id } });
  if (!before) return NextResponse.json({ error: "Acompanhamento não encontrado." }, { status: 404 });
  await (prisma as any).postProcedureTask.delete({ where: { id } });
  await createAuditLog({ action: "DELETE", entity: "PostProcedureTask", entityId: id, description: `Acompanhamento excluído: ${before.title}`, beforeJson: before });
  return NextResponse.json({ ok: true });
}
