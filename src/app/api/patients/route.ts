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
    const compact = url.searchParams.get("compact") === "true";
    const withLastAppointment = url.searchParams.get("withLastAppointment") === "true";
    const query = url.searchParams.get("q")?.trim();
    const limitParam = Number(url.searchParams.get("limit") || 0);
    const take = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 500) : undefined;

    const where = {
      ...(includeInactive ? {} : { isActive: true }),
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" as const } },
              { phone: { contains: query } },
              { email: { contains: query, mode: "insensitive" as const } },
              { cpf: { contains: query } },
            ],
          }
        : {}),
    };

    if (compact) {
      const patients = await prisma.patient.findMany({
        where,
        orderBy: { name: "asc" },
        ...(take ? { take } : {}),
        select: { id: true, name: true, phone: true, email: true },
      });
      return NextResponse.json(patients);
    }

    const baseSelect = {
      id: true,
      name: true,
      email: true,
      phone: true,
      createdAt: true,
      birthDate: true,
      isActive: true,
      cpf: true,
      crmSource: true,
      referralName: true,
      crmStatus: true,
      imageAuthorized: true,
      interestProcedure: true,
      patientProfile: true,
      conversionStatus: true,
      firstEvaluationAt: true,
      nextSuggestedAt: true,
    } as const;

    if (withLastAppointment) {
      const patients = await prisma.patient.findMany({
        where,
        orderBy: { name: "asc" },
        ...(take ? { take } : {}),
        select: {
          ...baseSelect,
          appointments: {
            where: { status: { not: "CANCELED" } },
            orderBy: { date: "desc" },
            take: 1,
            select: { date: true },
          },
        },
      });

      return NextResponse.json(patients.map(({ appointments, ...patient }) => ({
        ...patient,
        lastAppointmentAt: appointments[0]?.date ?? null,
      })));
    }

    const patients = await prisma.patient.findMany({
      where,
      orderBy: { name: "asc" },
      ...(take ? { take } : {}),
      select: baseSelect,
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
