import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const url = new URL(req.url);
    const includeInactive = url.searchParams.get("includeInactive") === "true";

    const patients = await prisma.patient.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { name: "asc" },
      include: { anamnesis: true } 
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

        anamnesis: {
          create: {
            profession: body.profession || null,
            sunExposure: Boolean(body.sunExposure),
            mainComplaint: body.mainComplaint || null,
            previousFillers: body.previousFillers || null,
            previousBotox: body.previousBotox || null,
            takingRoacutan: Boolean(body.takingRoacutan),
            medications: body.medications || null,
            allergicToEgg: Boolean(body.allergicToEgg),
            allergicToSeafood: body.allergicToSeafood || null,
            dentalAnesthesia: Boolean(body.dentalAnesthesia),
            dentalAnesthesiaReaction: Boolean(body.dentalAnesthesiaReaction),
            procedureReaction: body.procedureReaction || null,
            keloidTendency: Boolean(body.keloidTendency),
            degenerativeDisease: body.degenerativeDisease || null,
            diseases: body.diseases || null,
            allergies: body.allergies || null,
            hasHerpes: Boolean(body.hasHerpes),
            smoker: Boolean(body.smoker),
            bloodPressure: body.bloodPressure || null,
            pregnantOrNursing: Boolean(body.pregnantOrNursing),
            previousPregnancies: Boolean(body.previousPregnancies),
            exercises: Boolean(body.exercises),
            skinCareRoutine: body.skinCareRoutine || null,
            weightLoss: body.weightLoss || null,
            intendsToLoseWeight: body.intendsToLoseWeight || null,
            intendsSurgery: body.intendsSurgery || null,
            surgeries: body.surgeries || null,
            recentTreatmentOrVaccine: body.recentTreatmentOrVaccine || null,
            permanentImplants: body.permanentImplants || null,
            consentSigned: Boolean(body.consentSigned),
          }
        }
      },
    });

    return NextResponse.json(patient, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/patients error:", error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Já existe um paciente com este E-mail ou CPF." }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao criar paciente." }, { status: 500 });
  }
}