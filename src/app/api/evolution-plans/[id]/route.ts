import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

type Ctx = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const { id } = await ctx.params;

    await prisma.$transaction([
      prisma.clinicalEvolutionSession.deleteMany({ where: { planId: id } }),
      prisma.clinicalEvolutionPlan.delete({ where: { id } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar plano:", error);
    return NextResponse.json({ error: "Erro ao deletar plano" }, { status: 500 });
  }
}
