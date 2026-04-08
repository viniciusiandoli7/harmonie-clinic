import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ token: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const { token } = await ctx.params;
    const { signatureImage } = await req.json();

    if (!signatureImage) return NextResponse.json({ error: "Sem assinatura" }, { status: 400 });

    const contract = await prisma.patientContract.update({
      where: { token },
      data: {
        signatureImage,
        status: "SIGNED", // Muda o status do contrato para Assinado!
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao assinar contrato" }, { status: 500 });
  }
}