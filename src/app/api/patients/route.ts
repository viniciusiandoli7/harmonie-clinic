import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
  buildPatientCreateData,
  patientErrorMessage,
  patientErrorStatus,
  toAuditJson,
  validatePatientPayload,
} from "@/lib/patient-data";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const url = new URL(req.url);
    const includeInactive = url.searchParams.get("includeInactive") === "true";

    const patients = await prisma.patient.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { name: "asc" },
      include: { anamnesis: true },
    });

    return NextResponse.json(patients);
  } catch (error) {
    console.error("GET /api/patients error:", error);
    return NextResponse.json({ error: "Erro ao listar pacientes." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const body = await req.json();
    const validationError = validatePatientPayload(body);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const patient = await prisma.patient.create({
      data: buildPatientCreateData(body),
      include: { anamnesis: true },
    });

    await createAuditLog({
      action: "CREATE",
      entity: "Patient",
      entityId: patient.id,
      description: `Paciente cadastrada: ${patient.name}`,
      afterJson: toAuditJson(patient),
    });

    return NextResponse.json(patient, { status: 201 });
  } catch (error) {
    console.error("POST /api/patients error:", error);
    return NextResponse.json({ error: patientErrorMessage(error) }, { status: patientErrorStatus(error) });
  }
}
