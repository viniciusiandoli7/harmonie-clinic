import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { deleteBlockedTime } from "@/services/blockedTimeService";

const paramsSchema = z.object({
  id: z.string().uuid(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_: Request, { params }: Ctx) {
  const { id } = await params;

  try {
    await deleteBlockedTime(id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { error: "Bloqueio não encontrado" },
        { status: 404 }
      );
    }

    console.error("DELETE blocked-time error:", error);

    return NextResponse.json(
      { error: "Erro ao deletar bloqueio" },
      { status: 500 }
    );
  }
}