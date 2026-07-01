import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { ensureProductionSchema } from "@/lib/productionSchemaSql";

type Ctx = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  await ensureProductionSchema(prisma as any);

  try {
    await ensureProductionSchema(prisma as any);
    const { id } = await ctx.params;

    const plan = await prisma.clinicalEvolutionPlan.findUnique({
      where: { id },
      select: { id: true, patientId: true, treatmentName: true },
    });

    await prisma.$transaction([
      // Remove retornos automáticos criados a partir desse prontuário.
      prisma.appointment.deleteMany({
        where: {
          status: "RETURN",
          notes: { contains: `clinicalEvolutionPlan:${id}` },
        },
      }),
      // Remove alertas antigos/legados de retorno criados antes da agenda automática.
      plan
        ? (prisma as any).postProcedureTask.deleteMany({
            where: {
              patientId: plan.patientId,
              title: { contains: plan.treatmentName, mode: "insensitive" },
            },
          })
        : prisma.clinicalEvolutionSession.deleteMany({ where: { id: "__no_plan__" } }),
      prisma.clinicalEvolutionSession.deleteMany({ where: { planId: id } }),
      prisma.clinicalEvolutionPlan.delete({ where: { id } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar plano:", error);
    return NextResponse.json({ error: "Erro ao deletar plano" }, { status: 500 });
  }
}
