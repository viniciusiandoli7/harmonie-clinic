import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request: NextRequest) {
  // BLOQUEIO DE SEGURANÇA
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');

    if (!patientId) {
      return NextResponse.json({ error: 'Patient ID is required' }, { status: 400 });
    }

    const anamnesis = await prisma.patientAnamnesis.findUnique({
      where: { patientId },
    });

    if (!anamnesis) {
      return NextResponse.json({ error: 'Anamnesis not found' }, { status: 404 });
    }

    return NextResponse.json(anamnesis);
  } catch (error) {
    console.error('Error fetching anamnesis:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // BLOQUEIO DE SEGURANÇA
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { patientId, ...anamnesisData } = body;

    if (!patientId) {
      return NextResponse.json({ error: 'Patient ID is required' }, { status: 400 });
    }

    // Check if patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    // Prepara o objeto com todos os campos atualizados do novo banco
    const dataObj = {
      profession: anamnesisData.profession || null,
      sunExposure: Boolean(anamnesisData.sunExposure),
      mainComplaint: anamnesisData.mainComplaint || null,
      previousFillers: anamnesisData.previousFillers || null,
      previousBotox: anamnesisData.previousBotox || null,
      takingRoacutan: Boolean(anamnesisData.takingRoacutan),
      medications: anamnesisData.medications || null,
      allergicToEgg: Boolean(anamnesisData.allergicToEgg),
      allergicToSeafood: anamnesisData.allergicToSeafood || null,
      dentalAnesthesia: Boolean(anamnesisData.dentalAnesthesia),
      dentalAnesthesiaReaction: Boolean(anamnesisData.dentalAnesthesiaReaction),
      procedureReaction: anamnesisData.procedureReaction || null,
      keloidTendency: Boolean(anamnesisData.keloidTendency),
      degenerativeDisease: anamnesisData.degenerativeDisease || null,
      diseases: anamnesisData.diseases || null,
      allergies: anamnesisData.allergies || null,
      hasHerpes: Boolean(anamnesisData.hasHerpes),
      smoker: Boolean(anamnesisData.smoker),
      bloodPressure: anamnesisData.bloodPressure || null,
      pregnantOrNursing: Boolean(anamnesisData.pregnantOrNursing),
      previousPregnancies: Boolean(anamnesisData.previousPregnancies),
      exercises: Boolean(anamnesisData.exercises),
      skinCareRoutine: anamnesisData.skinCareRoutine || null,
      weightLoss: anamnesisData.weightLoss || null,
      intendsToLoseWeight: anamnesisData.intendsToLoseWeight || null,
      intendsSurgery: anamnesisData.intendsSurgery || null,
      surgeries: anamnesisData.surgeries || null,
      recentTreatmentOrVaccine: anamnesisData.recentTreatmentOrVaccine || null,
      permanentImplants: anamnesisData.permanentImplants || null,
      consentSigned: Boolean(anamnesisData.consentSigned),
    };

    // Upsert: se não existir, cria. Se existir, atualiza. (Muito mais limpo!)
    const anamnesis = await prisma.patientAnamnesis.upsert({
      where: { patientId: patientId },
      update: dataObj,
      create: {
        patientId: patientId,
        ...dataObj
      }
    });

    return NextResponse.json(anamnesis, { status: 200 });

  } catch (error) {
    console.error('Error creating/updating anamnesis:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  // BLOQUEIO DE SEGURANÇA
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');

    if (!patientId) {
      return NextResponse.json({ error: 'Patient ID is required' }, { status: 400 });
    }

    const anamnesis = await prisma.patientAnamnesis.findUnique({
      where: { patientId },
    });

    if (!anamnesis) {
      return NextResponse.json({ error: 'Anamnesis not found' }, { status: 404 });
    }

    await prisma.patientAnamnesis.delete({
      where: { patientId },
    });

    return NextResponse.json({ message: 'Anamnesis deleted successfully' });
  } catch (error) {
    console.error('Error deleting anamnesis:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}