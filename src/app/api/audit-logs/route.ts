import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const url = new URL(req.url);
  const entity = url.searchParams.get("entity");
  const entityId = url.searchParams.get("entityId");
  const take = Math.min(Number(url.searchParams.get("take") || 100), 500);

  const logs = await (prisma as any).auditLog.findMany({
    where: {
      ...(entity ? { entity } : {}),
      ...(entityId ? { entityId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take,
  });

  return NextResponse.json(logs);
}
