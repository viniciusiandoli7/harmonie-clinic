import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const treatments = await prisma.treatment.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json(treatments);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao buscar tratamentos" }, { status: 500 });
  }
}