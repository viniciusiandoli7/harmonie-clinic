import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

const paramsSchema = z.object({ id: z.string().uuid("ID inválido") });
type Ctx = { params: Promise<{ id: string }> };

function patientDataFromBody(body: any) {
  return {
    ...(body.name !== undefined ? { name: body.name } : {}),
    ...(body.email !== undefined ? { email: body.email || null } : {}),
    ...(body.phone !== undefined ? { phone: body.phone || null } : {}),
    ...(body.birthDate !== undefined ? { birthDate: body.birthDate ? new Date(body.birthDate) : null } : {}),
    ...(body.cpf !== undefined ? { cpf: body.cpf || null } : {}),
    ...(body.rg !== undefined ? { rg: body.rg || null } : {}),
    ...(body.address !== undefined ? { address: body.address || null } : {}),
    ...(body.addressNumber !== undefined ? { addressNumber: body.addressNumber || null } : {}),
    ...(body.addressComplement !== undefined ? { addressComplement: body.addressComplement || null } : {}),
    ...(body.neighborhood !== undefined ? { neighborhood: body.neighborhood || null } : {}),
    ...(body.city !== undefined ? { city: body.city || null } : {}),
    ...(body.state !== undefined ? { state: body.state || null } : {}),
    ...(body.zipCode !== undefined ? { zipCode: body.zipCode || null } : {}),
    ...(body.crmSource !== undefined ? { crmSource: body.crmSource || null } : {}),
    ...(body.referralName !== undefined ? { referralName: body.referralName || null } : {}),
    ...(body.crmStatus !== undefined ? { crmStatus: body.crmStatus || "Novo Lead" } : {}),
    ...(body.imageAuthorized !== undefined ? { imageAuthorized: Boolean(body.imageAuthorized) } : {}),
    ...(body.interestProcedure !== undefined ? { interestProcedure: body.interestProcedure || null } : {}),
    ...(body.patientProfile !== undefined ? { patientProfile: body.patientProfile || null } : {}),
    ...(body.commercialNotes !== undefined ? { commercialNotes: body.commercialNotes || null } : {}),
    ...(body.conversionStatus !== undefined ? { conversionStatus: body.conversionStatus || null } : {}),
    ...(body.proposedValue !== undefined ? { proposedValue: body.proposedValue ? Number(body.proposedValue) : null } : {}),
    ...(body.closedValue !== undefined ? { closedValue: body.closedValue ? Number(body.closedValue) : null } : {}),
    ...(body.lostReason !== undefined ? { lostReason: body.lostReason || null } : {}),
    ...(body.firstEvaluationAt !== undefined ? { firstEvaluationAt: body.firstEvaluationAt ? new Date(body.firstEvaluationAt) : null } : {}),
    ...(body.nextSuggestedAt !== undefined ? { nextSuggestedAt: body.nextSuggestedAt ? new Date(body.nextSuggestedAt) : null } : {}),
    ...(body.notes !== undefined ? { notes: body.notes || null } : {}),
    ...(body.isActive !== undefined ? { isActive: Boolean(body.isActive) } : {}),
  };
}

function anamnesisDataFromBody(body: any) {
  return {
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
    usesAnticoagulant: Boolean(body.usesAnticoagulant),
    hasAutoimmuneDisease: Boolean(body.hasAutoimmuneDisease),
    hasDiabetes: Boolean(body.hasDiabetes),
    hasEpilepsy: Boolean(body.hasEpilepsy),
    activeInfection: Boolean(body.activeInfection),
    recentDentalProcedure: Boolean(body.recentDentalProcedure),
    fillerComplicationHistory: body.fillerComplicationHistory || null,
    clinicalRiskNotes: body.clinicalRiskNotes || null,
  };
}

export async function GET(_: Request, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const { id } = paramsSchema.parse(await context.params);
    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        anamnesis: true,
        appointments: { orderBy: { date: "desc" } },
        transactions: { orderBy: { date: "desc" }, include: { installments: true } },
        installments: { orderBy: { dueDate: "desc" } },
        photos: { orderBy: { takenAt: "desc" } },
        inventoryMovements: { orderBy: { date: "desc" }, include: { inventoryItem: true } },
        contracts: { orderBy: { createdAt: "desc" } },
        evolutionPlans: { include: { sessions: true }, orderBy: { createdAt: "desc" } },
        evolutions: { orderBy: { createdAt: "desc" } },
        treatmentPlans: { include: { steps: { include: { treatment: true }, orderBy: { priority: "asc" } } }, orderBy: { createdAt: "desc" } },
        structuredEvolutions: { include: { treatment: true }, orderBy: { createdAt: "desc" } },
        postProcedureTasks: { include: { treatment: true }, orderBy: { dueDate: "asc" } },
        evaluationConversions: { orderBy: { evaluationDate: "desc" } },
      },
    });
    if (!patient) return NextResponse.json({ error: "Paciente não encontrado" }, { status: 404 });
    return NextResponse.json(patient);
  } catch {
    return NextResponse.json({ error: "Erro ao buscar paciente" }, { status: 400 });
  }
}

export async function PATCH(req: Request, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const { id } = paramsSchema.parse(await context.params);
    const body = await req.json();

    const before = await prisma.patient.findUnique({ where: { id }, include: { anamnesis: true } });
    const patient = await prisma.patient.update({
      where: { id },
      data: {
        ...patientDataFromBody(body),
        anamnesis: {
          upsert: {
            create: anamnesisDataFromBody(body),
            update: anamnesisDataFromBody(body),
          },
        },
      },
      include: { anamnesis: true },
    });

    await createAuditLog({
      action: "UPDATE",
      entity: "Patient",
      entityId: id,
      description: `Paciente atualizada: ${patient.name}`,
      beforeJson: before,
      afterJson: patient,
    });

    return NextResponse.json(patient);
  } catch (error) {
    console.error("PATCH /api/patients/[id] error:", error);
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 400 });
  }
}

export async function DELETE(_: Request, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const { id } = paramsSchema.parse(await context.params);

    const before = await prisma.patient.findUnique({ where: { id }, select: { id: true, name: true, phone: true, email: true } });

    await prisma.$transaction([
      prisma.clinicalEvolutionSession.deleteMany({ where: { plan: { patientId: id } } }),
      prisma.clinicalEvolutionPlan.deleteMany({ where: { patientId: id } }),
      (prisma as any).postProcedureTask.deleteMany({ where: { patientId: id } }),
      (prisma as any).evaluationConversion.deleteMany({ where: { patientId: id } }),
      (prisma as any).structuredClinicalEvolution.deleteMany({ where: { patientId: id } }),
      (prisma as any).treatmentPlanStep.deleteMany({ where: { plan: { patientId: id } } }),
      (prisma as any).treatmentPlan.deleteMany({ where: { patientId: id } }),
      prisma.clinicalEvolution.deleteMany({ where: { patientId: id } }),
      prisma.medicalRecord.deleteMany({ where: { patientId: id } }),
      prisma.patientAnamnesis.deleteMany({ where: { patientId: id } }),
      prisma.saleItem.deleteMany({ where: { sale: { patientId: id } } }),
      prisma.salePayment.deleteMany({ where: { sale: { patientId: id } } }),
      (prisma as any).patientPhoto.deleteMany({ where: { patientId: id } }),
      (prisma as any).financialInstallment.updateMany({ where: { patientId: id }, data: { patientId: null } }),
      (prisma as any).inventoryMovement.updateMany({ where: { patientId: id }, data: { patientId: null } }),
      prisma.financialTransaction.deleteMany({ where: { patientId: id } }),
      prisma.sale.deleteMany({ where: { patientId: id } }),
      prisma.patientConsentDocument.deleteMany({ where: { patientId: id } }),
      prisma.patientContract.deleteMany({ where: { patientId: id } }),
      prisma.appointment.deleteMany({ where: { patientId: id } }),
      prisma.patient.delete({ where: { id } }),
    ]);

    await createAuditLog({ action: "DELETE", entity: "Patient", entityId: id, description: `Paciente excluída: ${before?.name || id}`, beforeJson: before });

    return NextResponse.json({ message: "Excluído com sucesso" });
  } catch (error) {
    console.error("ERRO CRÍTICO NA EXCLUSÃO:", error);
    return NextResponse.json({ error: "Falha ao excluir registros vinculados." }, { status: 500 });
  }
}
