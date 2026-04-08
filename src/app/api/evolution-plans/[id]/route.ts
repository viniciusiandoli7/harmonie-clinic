import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = {
  params: Promise<{ id: string }>;
};

export async function DELETE(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    
    // 1. Deleta as sessões de dentro do plano primeiro (Evita o erro de bloqueio)
    await prisma.clinicalEvolutionSession.deleteMany({
      where: { planId: id },
    });

    // 2. Agora deleta o plano vazio com segurança
    await prisma.clinicalEvolutionPlan.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar plano:", error);
    return NextResponse.json({ error: "Erro ao deletar plano" }, { status: 500 });
  }
}