import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

type Ctx = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: NextRequest, ctx: Ctx) {
  // BLOQUEIO DE SEGURANÇA
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { id } = await ctx.params;

    try {
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
    } catch (error) {
      // Compatibilidade de recuperação: se o código novo estiver apontando para
      // um banco que ainda não recebeu as colunas de acompanhamento, o Prisma
      // pode falhar ao selecionar ClinicalEvolutionSession. Lemos o histórico
      // existente via SQL sem alterar absolutamente nenhum registro.
      console.error("Falha Prisma ao buscar evolução; tentando leitura compatível:", error);
      const plans = await prisma.$queryRawUnsafe<any[]>(
        `SELECT * FROM "ClinicalEvolutionPlan" WHERE "patientId" = $1 ORDER BY "createdAt" DESC`,
        id,
      );
      const planIds = plans.map((plan: any) => plan.id).filter(Boolean);
      let sessions: any[] = [];
      if (planIds.length > 0) {
        sessions = await prisma.$queryRawUnsafe<any[]>(
          `SELECT * FROM "ClinicalEvolutionSession" WHERE "planId" = ANY($1::text[]) ORDER BY "sessionNumber" DESC, "sessionDate" DESC`,
          planIds,
        );
      }

      return NextResponse.json(
        plans.map((plan: any) => ({
          ...plan,
          sessions: sessions
            .filter((item: any) => item.planId === plan.id)
            .map((item: any) => ({
              ...item,
              entryType: item.entryType || "SESSION",
              countsTowardSession: item.countsTowardSession !== false,
            })),
        })),
      );
    }
  } catch (error) {
    console.error("Erro ao carregar evolução clínica, inclusive no fallback:", error);
    return NextResponse.json(
      { error: "Erro ao carregar evolução clínica. Os registros existentes não foram alterados." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, ctx: Ctx) {
  // BLOQUEIO DE SEGURANÇA
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

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