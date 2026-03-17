import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { createPatientSchema } from "@/validators/patientValidator";
import { createPatient, getAllPatients } from "@/services/patientService";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get("includeInactive") === "true";

    const patients = await getAllPatients(includeInactive);
    return NextResponse.json(patients);
  } catch {
    return NextResponse.json(
      { error: "Erro ao buscar pacientes" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = createPatientSchema.parse(body);

    const patient = await createPatient(data);

    return NextResponse.json(patient, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json(
          { error: "Já existe um paciente com este e-mail" },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: "Erro ao criar paciente" },
      { status: 400 }
    );
  }
}