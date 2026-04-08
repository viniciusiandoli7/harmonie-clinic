import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const body = await req.json();

    const { signatureImage } = body;

    if (!signatureImage) {
      return NextResponse.json({ error: "Assinatura não enviada" }, { status: 400 });
    }

    // Busca a sessão para descobrir de quem é o prontuário
    const session = await prisma.clinicalEvolutionSession.findUnique({
      where: { id },
      include: {
        plan: { include: { patient: true } }
      }
    });

    if (!session) {
      return NextResponse.json({ error: "Sessão não encontrada" }, { status: 404 });
    }

    // Atualiza o banco de dados anexando a foto do desenho
    await prisma.clinicalEvolutionSession.update({
      where: { id },
      data: {
        signatureImage,
        patientSignatureName: session.plan.patient.name, // Registra o nome real automaticamente
        signedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao salvar assinatura remota:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}