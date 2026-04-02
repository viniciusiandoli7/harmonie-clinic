import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req: Request) {
  // BLOQUEIO DE SEGURANÇA
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

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
  // BLOQUEIO DE SEGURANÇA
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();

    const patient = await prisma.patient.create({
      data: {
        name: body.name,
        email: body.email || null,
        phone: body.phone || null,
        birthDate: body.birthDate ? new Date(body.birthDate) : null,
        cpf: body.cpf || null,
        rg: body.rg || null,
        address: body.address || null,
        addressNumber: body.addressNumber || null,
        addressComplement: body.addressComplement || null,
        neighborhood: body.neighborhood || null,
        city: body.city || null,
        state: body.state || null,
        zipCode: body.zipCode || null,
        crmSource: body.crmSource || null,
        interestProcedure: body.interestProcedure || null,
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