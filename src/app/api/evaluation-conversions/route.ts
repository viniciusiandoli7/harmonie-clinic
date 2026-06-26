import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

const n = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const url = new URL(req.url);
  const patientId = url.searchParams.get("patientId") || undefined;
  const rows = await (prisma as any).evaluationConversion.findMany({
    where: patientId ? { patientId } : {},
    include: { patient: { select: { id: true, name: true, phone: true, crmSource: true } } },
    orderBy: { evaluationDate: "desc" },
  });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const body = await req.json();
  if (!body.patientId) return NextResponse.json({ error: "Paciente é obrigatória." }, { status: 400 });
  const conversion = await (prisma as any).evaluationConversion.create({
    data: {
      patientId: body.patientId,
      evaluationDate: body.evaluationDate ? new Date(body.evaluationDate) : new Date(),
      proposedPlan: body.proposedPlan || null,
      proposedValue: n(body.proposedValue),
      closedValue: n(body.closedValue),
      status: body.status || "FOLLOW_UP",
      lostReason: body.lostReason || null,
      followUpDate: body.followUpDate ? new Date(body.followUpDate) : null,
      notes: body.notes || null,
    },
  });
  await prisma.patient.update({
    where: { id: body.patientId },
    data: {
      conversionStatus: conversion.status,
      proposedValue: conversion.proposedValue,
      closedValue: conversion.closedValue,
      lostReason: conversion.lostReason,
      firstEvaluationAt: conversion.evaluationDate,
      nextSuggestedAt: conversion.followUpDate,
    },
  });
  await createAuditLog({ action: "CREATE", entity: "EvaluationConversion", entityId: conversion.id, description: "Registro de conversão de avaliação criado.", afterJson: conversion });
  return NextResponse.json(conversion, { status: 201 });
}
