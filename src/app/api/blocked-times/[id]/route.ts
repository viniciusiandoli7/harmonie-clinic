import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import {
  deleteBlockedTime,
  updateBlockedTime,
} from "@/services/blockedTimeService";

const paramsSchema = z.object({
  id: z.string().uuid(),
});

const updateBlockedTimeSchema = z.object({
  start: z.string().datetime("Data inicial inválida"),
  end: z.string().datetime("Data final inválida"),
  reason: z.string().nullable().optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = paramsSchema.parse(await params);

  try {
    const body = await req.json();
    const parsed = updateBlockedTimeSchema.parse(body);

    const blockedTime = await updateBlockedTime(id, {
      start: new Date(parsed.start),
      end: new Date(parsed.end),
      reason: parsed.reason ?? null,
    });

    return NextResponse.json(blockedTime);
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { error: "Bloqueio não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: error?.message ?? "Erro ao atualizar bloqueio" },
      { status: 400 }
    );
  }
}

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