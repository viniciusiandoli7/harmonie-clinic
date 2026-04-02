import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// SALVAR NOVA FICHA
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { patientId, type, content } = body;

    if (!patientId || !type || !content) {
      return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
    }

    const record = await prisma.medicalRecord.create({
      data: { patientId, type, content: content },
    });

    return NextResponse.json(record);
  } catch (error) {
    console.error("Erro ao salvar prontuário:", error);
    return NextResponse.json({ error: "Erro ao salvar." }, { status: 500 });
  }
}

// LISTAR FICHAS DO PACIENTE
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get("patientId");

  if (!patientId) {
    return NextResponse.json({ error: "ID do paciente não fornecido" }, { status: 400 });
  }

  try {
    const records = await prisma.medicalRecord.findMany({
      where: { patientId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(records);
  } catch (error) {
    console.error("Erro ao buscar fichas:", error);
    return NextResponse.json({ error: "Erro ao buscar fichas." }, { status: 500 });
  }
}

// EXCLUIR REGISTRO ESPECÍFICO
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID do registro não fornecido" }, { status: 400 });
  }

  try {
    await prisma.medicalRecord.delete({
      where: { id },
    });
    return NextResponse.json({ message: "Registro excluído com sucesso." });
  } catch (error) {
    console.error("Erro ao excluir prontuário:", error);
    return NextResponse.json({ error: "Erro ao excluir o registro." }, { status: 500 });
  }
}