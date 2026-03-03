import { NextResponse } from "next/server";
import { getPatients, createPatient } from "@/services/patientService";
import { createPatientSchema } from "@/validators/patientValidator";

export async function GET() {
  try {
    const patients = await getPatients();
    return NextResponse.json(patients);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao buscar pacientes" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 🔥 validação aqui
    const validatedData = createPatientSchema.parse(body);

    const patient = await createPatient(validatedData);

    return NextResponse.json(patient, { status: 201 });

  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: error.errors },
        { status: 400 }
      );
    }

    console.error(error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
