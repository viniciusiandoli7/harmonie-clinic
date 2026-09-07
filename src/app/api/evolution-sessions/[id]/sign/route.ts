import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = {
  params: Promise<{ id: string }>;
};

function validSignature(value: unknown) {
  return typeof value === "string" && /^data:image\/png;base64,/i.test(value) && value.length <= 2_500_000;
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const body = await req.json().catch(() => ({}));
    const signatureImage = body.signatureImage;

    if (!validSignature(signatureImage)) {
      return NextResponse.json({ error: "Assinatura inválida ou não enviada." }, { status: 400 });
    }

    const evolution = await prisma.clinicalEvolutionSession.findUnique({
      where: { id },
      include: { plan: { include: { patient: true } } },
    });

    if (!evolution) {
      return NextResponse.json({ error: "Evolução não encontrada." }, { status: 404 });
    }

    if (evolution.signedAt || evolution.signatureImage) {
      return NextResponse.json(
        { error: "Esta evolução já recebeu a ciência da paciente e não pode ser sobrescrita." },
        { status: 409 }
      );
    }

    const signedAt = new Date();
    const updated = await prisma.clinicalEvolutionSession.update({
      where: { id },
      data: {
        signatureImage,
        patientSignatureName: evolution.plan.patient.name,
        signedAt,
      },
      select: {
        id: true,
        patientSignatureName: true,
        signedAt: true,
        signatureImage: true,
      },
    });

    return NextResponse.json({ success: true, evolution: updated });
  } catch (error) {
    console.error("Erro ao salvar ciência da evolução:", error);
    return NextResponse.json({ error: "Não foi possível registrar a ciência da paciente." }, { status: 500 });
  }
}
