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
  const evolutions = await (prisma as any).structuredClinicalEvolution.findMany({
    where: { patientId: id },
    include: { treatment: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(evolutions);
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const { id } = await ctx.params;
  const body = await req.json();
  const procedurePerformed = String(body.procedurePerformed || "").trim();
  if (!procedurePerformed) return NextResponse.json({ error: "Procedimento realizado é obrigatório." }, { status: 400 });

  const evolution = await (prisma as any).structuredClinicalEvolution.create({
    data: {
      patientId: id,
      treatmentId: body.treatmentId || null,
      complaint: body.complaint || null,
      clinicalAssessment: body.clinicalAssessment || null,
      procedurePerformed,
      productUsed: body.productUsed || null,
      batch: body.batch || null,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      bodyArea: body.bodyArea || null,
      quantity: body.quantity || null,
      intercurrences: body.intercurrences || null,
      guidance: body.guidance || null,
      recommendedReturn: body.recommendedReturn ? new Date(body.recommendedReturn) : null,
      termSigned: Boolean(body.termSigned),
      photosTaken: Boolean(body.photosTaken),
    },
    include: { treatment: true },
  });

  await prisma.clinicalEvolution.create({
    data: {
      patientId: id,
      type: "STRUCTURED_RECORD",
      important: Boolean(body.intercurrences),
      content: [
        `Procedimento: ${procedurePerformed}`,
        body.productUsed ? `Produto: ${body.productUsed}` : null,
        body.batch ? `Lote: ${body.batch}` : null,
        body.bodyArea ? `Região: ${body.bodyArea}` : null,
        body.quantity ? `Quantidade: ${body.quantity}` : null,
        body.intercurrences ? `Intercorrências: ${body.intercurrences}` : "Intercorrências: não registradas",
        body.guidance ? `Orientações: ${body.guidance}` : null,
      ].filter(Boolean).join("\n"),
    },
  });

  if (body.createReturnTask && body.recommendedReturn) {
    await (prisma as any).postProcedureTask.create({
      data: {
        patientId: id,
        treatmentId: body.treatmentId || null,
        title: `Retorno: ${procedurePerformed}`,
        dueDate: new Date(body.recommendedReturn),
        message: `Oi, [primeiroNome]. Tudo bem? A Dra. Mariana pediu para te lembrar do retorno de ${procedurePerformed}. Podemos verificar um horário para você?`,
      },
    });
  }

  await createAuditLog({ action: "CREATE", entity: "StructuredClinicalEvolution", entityId: evolution.id, description: `Evolução estruturada criada: ${procedurePerformed}`, afterJson: evolution });
  return NextResponse.json(evolution, { status: 201 });
}
