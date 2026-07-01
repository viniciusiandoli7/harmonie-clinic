import { ensureProductionSchema } from "@/lib/productionSchemaSql";
import { ensurePatientSchema } from "@/lib/patientSchemaSql";
import { safeQuery } from "@/lib/safeSql";

type PrismaLike = {
  $executeRawUnsafe: (query: string, ...values: any[]) => Promise<any>;
  $queryRawUnsafe: (query: string, ...values: any[]) => Promise<any>;
};

async function one<T = any>(client: PrismaLike, query: string, ...values: any[]): Promise<T | null> {
  const rows = await safeQuery<T>(client, query, ...values);
  return rows[0] || null;
}

async function many<T = any>(client: PrismaLike, query: string, ...values: any[]): Promise<T[]> {
  return safeQuery<T>(client, query, ...values);
}

export async function getPatientDetailRaw(client: PrismaLike, id: string) {
  await ensureProductionSchema(client);
  await ensurePatientSchema(client);

  const patient = await one<any>(client, `SELECT * FROM "Patient" WHERE "id" = $1 LIMIT 1`, id);
  if (!patient) return null;

  const [
    anamnesis,
    appointments,
    transactions,
    installments,
    photos,
    inventoryMovements,
    contracts,
    evolutionPlans,
    evolutions,
    treatmentPlans,
    structuredEvolutions,
    postProcedureTasks,
    evaluationConversions,
  ] = await Promise.all([
    one(client, `SELECT * FROM "PatientAnamnesis" WHERE "patientId" = $1 LIMIT 1`, id),
    many(client, `SELECT * FROM "Appointment" WHERE "patientId" = $1 ORDER BY "date" DESC`, id),
    many(client, `SELECT * FROM "FinancialTransaction" WHERE "patientId" = $1 ORDER BY "date" DESC`, id),
    many(client, `SELECT * FROM "FinancialInstallment" WHERE "patientId" = $1 ORDER BY "dueDate" DESC`, id),
    many(client, `SELECT * FROM "PatientPhoto" WHERE "patientId" = $1 ORDER BY "takenAt" DESC`, id),
    many(client, `SELECT * FROM "InventoryMovement" WHERE "patientId" = $1 ORDER BY "date" DESC`, id),
    many(client, `SELECT * FROM "PatientContract" WHERE "patientId" = $1 ORDER BY "createdAt" DESC`, id),
    many(client, `SELECT * FROM "ClinicalEvolutionPlan" WHERE "patientId" = $1 ORDER BY "createdAt" DESC`, id),
    many(client, `SELECT * FROM "ClinicalEvolution" WHERE "patientId" = $1 ORDER BY "createdAt" DESC`, id),
    many(client, `SELECT * FROM "TreatmentPlan" WHERE "patientId" = $1 ORDER BY "createdAt" DESC`, id),
    many(client, `SELECT * FROM "StructuredClinicalEvolution" WHERE "patientId" = $1 ORDER BY "createdAt" DESC`, id),
    many(client, `SELECT * FROM "PostProcedureTask" WHERE "patientId" = $1 ORDER BY "dueDate" ASC`, id),
    many(client, `SELECT * FROM "EvaluationConversion" WHERE "patientId" = $1 ORDER BY "evaluationDate" DESC`, id),
  ]);

  const sessions = await many<any>(client, `SELECT * FROM "ClinicalEvolutionSession" WHERE "planId" = ANY($1::text[]) ORDER BY "sessionNumber" ASC`, evolutionPlans.map((p: any) => p.id));
  const steps = await many<any>(client, `SELECT * FROM "TreatmentPlanStep" WHERE "planId" = ANY($1::text[]) ORDER BY "priority" ASC`, treatmentPlans.map((p: any) => p.id));

  const installmentsByTransaction = new Map<string, any[]>();
  for (const installment of installments) {
    if (!installment.transactionId) continue;
    const list = installmentsByTransaction.get(installment.transactionId) || [];
    list.push(installment);
    installmentsByTransaction.set(installment.transactionId, list);
  }

  return {
    ...patient,
    anamnesis,
    appointments,
    transactions: transactions.map((transaction: any) => ({ ...transaction, installments: installmentsByTransaction.get(transaction.id) || [] })),
    installments,
    photos,
    inventoryMovements,
    contracts,
    evolutionPlans: evolutionPlans.map((plan: any) => ({
      ...plan,
      sessions: sessions.filter((session: any) => session.planId === plan.id),
    })),
    evolutions,
    treatmentPlans: treatmentPlans.map((plan: any) => ({
      ...plan,
      steps: steps.filter((step: any) => step.planId === plan.id),
    })),
    structuredEvolutions,
    postProcedureTasks,
    evaluationConversions,
  };
}
