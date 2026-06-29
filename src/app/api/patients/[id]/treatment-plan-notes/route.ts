import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

function sanitizeNote(value: unknown) {
  return String(value || "").trim();
}

export async function GET(_: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const { id } = await ctx.params;
    const notes = await prisma.clinicalEvolution.findMany({
      where: { patientId: id, type: "TREATMENT_PLAN_NOTE" },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(notes);
  } catch (error) {
    console.error("Erro ao buscar observações do plano:", error);
    return NextResponse.json({ error: "Erro ao buscar observações do plano." }, { status: 500 });
  }
}

export async function POST(req: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const { id } = await ctx.params;
    const body = await req.json().catch(() => ({}));
    const content = sanitizeNote(body.content);

    if (!content) {
      return NextResponse.json({ error: "Escreva a observação antes de salvar." }, { status: 400 });
    }

    const note = await prisma.clinicalEvolution.create({
      data: {
        patientId: id,
        type: "TREATMENT_PLAN_NOTE",
        important: false,
        content,
      },
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error("Erro ao salvar observação do plano:", error);
    return NextResponse.json({ error: "Erro ao salvar observação do plano." }, { status: 500 });
  }
}
