import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = {
  params: Promise<{ planId: string }>;
};

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const { planId } = await ctx.params;
    const body = await req.json();

    const data: Record<string, unknown> = {};

    if (body.treatmentName !== undefined) {
      data.treatmentName = String(body.treatmentName || "").trim();
    }

    if (body.packageName !== undefined) {
      data.packageName = String(body.packageName || "").trim() || null;
    }

    if (body.totalSessions !== undefined) {
      const totalSessions = Number(body.totalSessions);
      if (!Number.isFinite(totalSessions) || totalSessions < 1) {
        return NextResponse.json(
          { error: "totalSessions inválido." },
          { status: 400 }
        );
      }
      data.totalSessions = totalSessions;
    }

    if (body.completedSessions !== undefined) {
      const completedSessions = Number(body.completedSessions);
      if (!Number.isFinite(completedSessions) || completedSessions < 0) {
        return NextResponse.json(
          { error: "completedSessions inválido." },
          { status: 400 }
        );
      }
      data.completedSessions = completedSessions;
    }

    if (body.status !== undefined) {
      data.status = body.status;
    }

    if (body.startDate !== undefined) {
      data.startDate = body.startDate ? new Date(body.startDate) : null;
    }

    if (body.endDate !== undefined) {
      data.endDate = body.endDate ? new Date(body.endDate) : null;
    }

    if (body.goals !== undefined) {
      data.goals = String(body.goals || "").trim() || null;
    }

    if (body.notes !== undefined) {
      data.notes = String(body.notes || "").trim() || null;
    }

    const plan = await prisma.clinicalEvolutionPlan.update({
      where: { id: planId },
      data,
    });

    return NextResponse.json(plan);
  } catch {
    return NextResponse.json(
      { error: "Erro ao atualizar plano de evolução." },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  try {
    const { planId } = await ctx.params;

    await prisma.clinicalEvolutionPlan.delete({
      where: { id: planId },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Erro ao remover plano de evolução." },
      { status: 500 }
    );
  }
}