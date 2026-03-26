import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = {
  params: Promise<{ token: string }>;
};

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { token } = await ctx.params;

  try {
    const contract = await prisma.patientContract.findUnique({
      where: { token },
      include: { patient: true },
    });

    if (!contract) {
      return NextResponse.json({ error: "Contrato não encontrado." }, { status: 404 });
    }

    return NextResponse.json(contract);
  } catch {
    return NextResponse.json({ error: "Erro ao carregar contrato." }, { status: 500 });
  }
}