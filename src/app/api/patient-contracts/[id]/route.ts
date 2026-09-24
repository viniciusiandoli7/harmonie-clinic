import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Exclui somente o documento PatientContract.
 *
 * Regra de segurança:
 * - contratos PENDING/CANCELED podem ser removidos quando foram gerados por engano;
 * - contratos SIGNED são preservados como registro documental e não podem sofrer hard delete;
 * - venda, financeiro, plano, prontuário, evoluções e fotos NÃO são alterados.
 */
export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const { id } = await ctx.params;
    if (!id) return NextResponse.json({ error: "Contrato inválido." }, { status: 400 });

    // Selecionamos apenas colunas históricas para manter compatibilidade com bancos
    // onde metadados contratuais mais novos ainda não tenham sido migrados.
    const contract = await prisma.patientContract.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!contract) {
      return NextResponse.json({ error: "Contrato não encontrado." }, { status: 404 });
    }

    if (contract.status === "SIGNED") {
      return NextResponse.json(
        {
          error:
            "Este contrato já foi assinado e foi preservado como registro documental. Para corrigir uma contratação assinada, gere um novo contrato e mantenha o anterior no histórico.",
        },
        { status: 409 },
      );
    }

    await prisma.patientContract.delete({
      where: { id },
      select: { id: true },
    });

    return NextResponse.json({
      ok: true,
      deletedId: id,
      message: "Contrato excluído. Nenhum dado da venda, financeiro ou prontuário foi alterado.",
    });
  } catch (error) {
    console.error("Erro ao excluir contrato:", error);
    return NextResponse.json(
      { error: "Não foi possível excluir o contrato. Tente novamente." },
      { status: 500 },
    );
  }
}
