import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { hydrateContractMetadata } from "@/lib/contractStorage";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const { id } = await ctx.params;
    const contracts = await prisma.patientContract.findMany({
      where: { patientId: id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        token: true,
        patientId: true,
        title: true,
        content: true,
        total: true,
        status: true,
        itemsJson: true,
        signatureName: true,
        signatureImage: true,
        signatureIp: true,
        signedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return NextResponse.json(contracts.map((contract) => hydrateContractMetadata(contract)));
  } catch (error) {
    console.error("Erro ao buscar contratos:", error);
    return NextResponse.json({ error: "Erro ao buscar contratos" }, { status: 500 });
  }
}
