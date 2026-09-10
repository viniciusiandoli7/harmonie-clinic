import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

type Ctx = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const authSession = await getServerSession(authOptions);
  if (!authSession) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const { id } = await ctx.params;
    const body = await req.json().catch(() => ({}));
    const signatureImage = typeof body.signatureImage === "string" ? body.signatureImage.trim() : "";

    if (!signatureImage || !/^data:image\/png;base64,/i.test(signatureImage)) {
      return NextResponse.json({ error: "Assinatura não enviada ou inválida." }, { status: 400 });
    }

    const session = await prisma.clinicalEvolutionSession.findUnique({
      where: { id },
      include: { plan: { include: { patient: true } } },
    });

    if (!session) return NextResponse.json({ error: "Evolução não encontrada." }, { status: 404 });

    if (session.signedAt || session.signatureImage) {
      return NextResponse.json(
        { error: "A ciência desta evolução já foi registrada e não pode ser sobrescrita." },
        { status: 409 },
      );
    }

    const updated = await prisma.clinicalEvolutionSession.update({
      where: { id },
      data: {
        signatureImage,
        patientSignatureName: session.plan.patient.name,
        signedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      patientSignatureName: updated.patientSignatureName,
      signedAt: updated.signedAt,
      signatureImage: updated.signatureImage,
    });
  } catch (error) {
    console.error("Erro ao registrar ciência da evolução:", error);
    return NextResponse.json({ error: "Não foi possível registrar a ciência da paciente." }, { status: 500 });
  }
}
