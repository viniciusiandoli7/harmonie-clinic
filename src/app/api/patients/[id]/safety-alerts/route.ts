import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { buildSafetyAlerts } from "@/lib/clinic-intelligence";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const { id } = await ctx.params;
  const patient = await prisma.patient.findUnique({ where: { id }, include: { anamnesis: true } });
  if (!patient) return NextResponse.json({ error: "Paciente não encontrada." }, { status: 404 });
  const alerts = buildSafetyAlerts(patient);
  return NextResponse.json({ patientId: id, alerts, counts: { critical: alerts.filter(a => a.level === "CRITICAL").length, warning: alerts.filter(a => a.level === "WARNING").length, info: alerts.filter(a => a.level === "INFO").length } });
}
