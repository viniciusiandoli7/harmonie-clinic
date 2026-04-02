import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
  createBlockedTime,
  getBlockedTimes,
  BlockedTimeConflictError,
} from "@/services/blockedTimeService";

const createBlockedTimeSchema = z.object({
  start: z.string(),
  end: z.string(),
  reason: z.string().optional(),
});

export async function GET(req: Request) {
  // BLOQUEIO DE SEGURANÇA
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const url = new URL(req.url);

    const dateFrom = url.searchParams.get("dateFrom");
    const dateTo = url.searchParams.get("dateTo");

    const data = await getBlockedTimes(
      dateFrom ? new Date(dateFrom) : undefined,
      dateTo ? new Date(dateTo) : undefined
    );

    return NextResponse.json(data);
  } catch (error) {
    console.error("GET blocked-times error:", error);

    return NextResponse.json(
      { error: "Erro ao listar bloqueios" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  // BLOQUEIO DE SEGURANÇA
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();

    const parsed = createBlockedTimeSchema.parse(body);

    const blockedTime = await createBlockedTime({
      start: parsed.start,
      end: parsed.end,
      reason: parsed.reason,
    });

    return NextResponse.json(blockedTime, { status: 201 });
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    if (error instanceof BlockedTimeConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    console.error("POST blocked-times error:", error);

    return NextResponse.json(
      { error: "Erro ao criar bloqueio" },
      { status: 500 }
    );
  }
}