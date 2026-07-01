import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureProductionSchema } from "@/lib/productionSchemaSql";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  await ensureProductionSchema(prisma as any);

  try {
    await ensureProductionSchema(prisma as any);
    const treatments = await prisma.treatment.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json(treatments);
  } catch (error) {
    console.error("Erro ao buscar tratamentos:", error);
    return NextResponse.json({ error: "Erro ao buscar tratamentos" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  await ensureProductionSchema(prisma as any);

  try {
    const body = await req.json();
    const { name, template } = body;

    if (!name) {
      return NextResponse.json({ error: "O nome do tratamento é obrigatório" }, { status: 400 });
    }

    const treatment = await prisma.treatment.create({
      data: {
        name,
        template: template || "", 
      },
    });

    return NextResponse.json(treatment, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar tratamento:", error);
    return NextResponse.json({ error: "Erro ao criar tratamento" }, { status: 500 });
  }
}