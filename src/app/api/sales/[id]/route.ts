import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createAuditLog } from "@/lib/audit";

type Context = { params: Promise<{ id: string }> };

export async function DELETE(_: NextRequest, context: Context) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const { id } = await context.params;
    const before = await prisma.sale.findUnique({
      where: { id },
      include: { saleItems: true, payments: true, transactions: true, installments: true, patient: { select: { id: true, name: true } } },
    });

    await prisma.sale.delete({ where: { id } });
    await createAuditLog({ action: "DELETE", entity: "Sale", entityId: id, description: `Venda excluída: ${before?.patient?.name || id}`, beforeJson: before });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir venda:", error);
    return NextResponse.json({ error: "Erro ao excluir venda." }, { status: 500 });
  }
}
