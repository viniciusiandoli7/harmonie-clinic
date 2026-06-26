import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { calculateMonthlyClosing } from "@/lib/finance-utils";

const closingSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  notes: z.string().optional().nullable(),
  close: z.boolean().optional().default(true),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const url = new URL(req.url);
  const month = url.searchParams.get("month");
  const preview = await calculateMonthlyClosing(month);
  const saved = await (prisma as any).monthlyClosing.findUnique({ where: { month: preview.month } });

  return NextResponse.json({ preview, saved, isClosed: saved?.status === "CLOSED" });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const parsed = closingSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const calculation = await calculateMonthlyClosing(parsed.data.month);
  const before = await (prisma as any).monthlyClosing.findUnique({ where: { month: calculation.month } });
  const closing = await (prisma as any).monthlyClosing.upsert({
    where: { month: calculation.month },
    update: {
      ...calculation,
      status: parsed.data.close ? "CLOSED" : "OPEN",
      closedAt: parsed.data.close ? new Date() : null,
      notes: parsed.data.notes || null,
    },
    create: {
      ...calculation,
      status: parsed.data.close ? "CLOSED" : "OPEN",
      closedAt: parsed.data.close ? new Date() : null,
      notes: parsed.data.notes || null,
    },
  });

  await createAuditLog({
    action: parsed.data.close ? "CLOSE_MONTH" : "REOPEN_MONTH",
    entity: "MonthlyClosing",
    entityId: closing.id,
    description: `${parsed.data.close ? "Fechamento" : "Reabertura"} do mês ${closing.month}`,
    beforeJson: before,
    afterJson: closing,
  });

  return NextResponse.json(closing, { status: before ? 200 : 201 });
}
