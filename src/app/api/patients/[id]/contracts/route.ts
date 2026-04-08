import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const contracts = await prisma.patientContract.findMany({
      where: { patientId: id },
      orderBy: { createdAt: "desc" }
    });
    return NextResponse.json(contracts);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar contratos" }, { status: 500 });
  }
}