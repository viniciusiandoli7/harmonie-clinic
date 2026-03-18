import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const includeInactive = url.searchParams.get("includeInactive") === "true";

    const patients = await prisma.patient.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(patients);
  } catch (error) {
    console.error("GET /api/patients error:", error);
    return NextResponse.json({ error: "Erro ao listar pacientes." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const patient = await prisma.patient.create({
      data: {
        name: body.name,
        email: body.email || null,
        phone: body.phone || null,
        birthDate: body.birthDate ? new Date(body.birthDate) : null,
        notes: body.notes || null,
        isActive: body.isActive ?? true,
      },
    });

    return NextResponse.json(patient, { status: 201 });
  } catch (error) {
    console.error("POST /api/patients error:", error);
    return NextResponse.json({ error: "Erro ao criar paciente." }, { status: 500 });
  }
}