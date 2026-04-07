import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

type Context = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_: NextRequest, context: Context) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const { id } = await context.params;

    // Graças ao "Cascade" no banco, excluir a venda apaga o Financeiro e os Itens juntos!
    await prisma.sale.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir venda:", error);
    return NextResponse.json({ error: "Erro ao excluir venda." }, { status: 500 });
  }
}