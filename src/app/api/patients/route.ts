import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const patients = await prisma.patient.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(patients);
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao buscar pacientes" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const patient = await prisma.patient.create({
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone,
      },
    });

    return NextResponse.json(patient);
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao criar paciente" },
      { status: 500 }
    );
  }
}
