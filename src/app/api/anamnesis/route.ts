import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
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
  try {
    const body = await request.json();
    const {
      patientId,
      hasAllergies,
      allergies,
      hasMedications,
      medications,
      hasSurgeries,
      surgeries,
      hasDiseases,
      diseases,
      smoker,
      cigarettesPerDay,
      drinksAlcohol,
      alcoholFrequency,
      exercises,
      exerciseFrequency,
      familyDiseases,
      skinCareRoutine,
      previousTreatments,
      skinConcerns,
      treatmentGoals,
      concerns,
    } = body;

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

    // Check if anamnesis already exists
    const existingAnamnesis = await prisma.patientAnamnesis.findUnique({
      where: { patientId },
    });

    if (existingAnamnesis) {
      // Update existing anamnesis
      const updatedAnamnesis = await prisma.patientAnamnesis.update({
        where: { patientId },
        data: {
          hasAllergies: hasAllergies ?? false,
          allergies,
          hasMedications: hasMedications ?? false,
          medications,
          hasSurgeries: hasSurgeries ?? false,
          surgeries,
          hasDiseases: hasDiseases ?? false,
          diseases,
          smoker: smoker ?? false,
          cigarettesPerDay,
          drinksAlcohol: drinksAlcohol ?? false,
          alcoholFrequency,
          exercises: exercises ?? false,
          exerciseFrequency,
          familyDiseases,
          skinCareRoutine,
          previousTreatments,
          skinConcerns,
          treatmentGoals,
          concerns,
        },
      });

      return NextResponse.json(updatedAnamnesis);
    } else {
      // Create new anamnesis
      const newAnamnesis = await prisma.patientAnamnesis.create({
        data: {
          patientId,
          hasAllergies: hasAllergies ?? false,
          allergies,
          hasMedications: hasMedications ?? false,
          medications,
          hasSurgeries: hasSurgeries ?? false,
          surgeries,
          hasDiseases: hasDiseases ?? false,
          diseases,
          smoker: smoker ?? false,
          cigarettesPerDay,
          drinksAlcohol: drinksAlcohol ?? false,
          alcoholFrequency,
          exercises: exercises ?? false,
          exerciseFrequency,
          familyDiseases,
          skinCareRoutine,
          previousTreatments,
          skinConcerns,
          treatmentGoals,
          concerns,
        },
      });

      return NextResponse.json(newAnamnesis);
    }
  } catch (error) {
    console.error('Error creating/updating anamnesis:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
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