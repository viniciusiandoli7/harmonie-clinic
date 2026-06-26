import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { buildPatientUpdateData, patientErrorMessage, patientErrorStatus, toAuditJson } from "@/lib/patient-data";

const paramsSchema = z.object({ id: z.string().uuid("ID inválido") });
type Ctx = { params: Promise<{ id: string }> };

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
      data: buildPatientUpdateData(body),
      include: { anamnesis: true },
    });

    await createAuditLog({
      action: "UPDATE",
      entity: "Patient",
      entityId: id,
      description: `Paciente atualizada: ${patient.name}`,
      beforeJson: toAuditJson(before),
      afterJson: toAuditJson(patient),
    });

    return NextResponse.json(patient);
  } catch (error) {
    console.error("PATCH /api/patients/[id] error:", error);
    return NextResponse.json({ error: patientErrorMessage(error) }, { status: patientErrorStatus(error) });
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

    await createAuditLog({ action: "DELETE", entity: "Patient", entityId: id, description: `Paciente excluída: ${before?.name || id}`, beforeJson: toAuditJson(before) });

    return NextResponse.json({ message: "Excluído com sucesso" });
  } catch (error) {
    console.error("ERRO CRÍTICO NA EXCLUSÃO:", error);
    return NextResponse.json({ error: "Falha ao excluir registros vinculados." }, { status: 500 });
  }
}
