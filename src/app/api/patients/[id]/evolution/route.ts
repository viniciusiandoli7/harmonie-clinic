import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;

    const plans = await prisma.clinicalEvolutionPlan.findMany({
      where: { patientId: id },
      include: {
        sessions: {
          orderBy: { sessionNumber: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(plans);
  } catch {
    return NextResponse.json(
      { error: "Erro ao carregar evolução clínica." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const body = await req.json();

    const treatmentName = String(body.treatmentName || "").trim();
    const packageName = String(body.packageName || "").trim() || null;
    const totalSessions = Number(body.totalSessions || 1);
    const startDate = body.startDate ? new Date(body.startDate) : null;
    const endDate = body.endDate ? new Date(body.endDate) : null;
    const goals = String(body.goals || "").trim() || null;
    const notes = String(body.notes || "").trim() || null;

    if (!treatmentName) {
      return NextResponse.json(
        { error: "treatmentName é obrigatório." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(totalSessions) || totalSessions < 1) {
      return NextResponse.json(
        { error: "totalSessions deve ser maior que zero." },
        { status: 400 }
      );
    }

    const plan = await prisma.clinicalEvolutionPlan.create({
      data: {
        patientId: id,
        treatmentName,
        packageName,
        totalSessions,
        startDate,
        endDate,
        goals,
        notes,
      },
    });

    return NextResponse.json(plan, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Erro ao criar plano de evolução." },
      { status: 500 }
    );
  }
}