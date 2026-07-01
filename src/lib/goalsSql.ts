import { randomUUID } from "crypto";
import { safeExecute, safeQuery } from "@/lib/safeSql";

type PrismaLike = {
  $executeRawUnsafe: (query: string, ...values: any[]) => Promise<any>;
  $queryRawUnsafe: (query: string, ...values: any[]) => Promise<any>;
};

export type BusinessGoalPayload = {
  month: string;
  startDate?: Date | null;
  endDate?: Date | null;
  revenueGoal: number;
  patientGoal: number;
  evaluationGoal: number;
  conversionGoal: number;
  averageTicketGoal: number;
  notes?: string | null;
};

export async function ensureBusinessGoalPeriodColumns(client: PrismaLike) {
  await safeExecute(client, `
    CREATE TABLE IF NOT EXISTS "BusinessGoal" (
      "id" TEXT PRIMARY KEY,
      "month" TEXT NOT NULL,
      "startDate" TIMESTAMP(3),
      "endDate" TIMESTAMP(3),
      "revenueGoal" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "patientGoal" INTEGER NOT NULL DEFAULT 0,
      "evaluationGoal" INTEGER NOT NULL DEFAULT 0,
      "conversionGoal" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "averageTicketGoal" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "notes" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await safeExecute(client, `
    CREATE UNIQUE INDEX IF NOT EXISTS "BusinessGoal_month_key" ON "BusinessGoal"("month")
  `);

  await safeExecute(client, `
    ALTER TABLE "BusinessGoal"
    ADD COLUMN IF NOT EXISTS "startDate" TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS "endDate" TIMESTAMP(3)
  `);

  await safeExecute(client, `
    CREATE INDEX IF NOT EXISTS "BusinessGoal_startDate_idx" ON "BusinessGoal"("startDate")
  `);

  await safeExecute(client, `
    CREATE INDEX IF NOT EXISTS "BusinessGoal_endDate_idx" ON "BusinessGoal"("endDate")
  `);
}

export async function getBusinessGoalByMonthRaw(client: PrismaLike, month: string) {
  await ensureBusinessGoalPeriodColumns(client);

  const rows = await safeQuery<any>(client, `SELECT * FROM "BusinessGoal" WHERE "month" = $1 LIMIT 1`, month);

  return rows[0] || null;
}

export async function createBusinessGoalRaw(client: PrismaLike, payload: BusinessGoalPayload) {
  await ensureBusinessGoalPeriodColumns(client);

  const rows = await client.$queryRawUnsafe(
    `
      INSERT INTO "BusinessGoal" (
        "id",
        "month",
        "startDate",
        "endDate",
        "revenueGoal",
        "patientGoal",
        "evaluationGoal",
        "conversionGoal",
        "averageTicketGoal",
        "notes",
        "createdAt",
        "updatedAt"
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW()
      )
      RETURNING *
    `,
    randomUUID(),
    payload.month,
    payload.startDate ?? null,
    payload.endDate ?? null,
    payload.revenueGoal,
    payload.patientGoal,
    payload.evaluationGoal,
    payload.conversionGoal,
    payload.averageTicketGoal,
    payload.notes ?? null
  );

  return Array.isArray(rows) ? rows[0] : rows;
}

export async function updateBusinessGoalRaw(client: PrismaLike, month: string, payload: Partial<BusinessGoalPayload>) {
  await ensureBusinessGoalPeriodColumns(client);

  const values: any[] = [];
  const sets: string[] = [];

  const push = (column: string, value: any) => {
    values.push(value);
    sets.push(`"${column}" = $${values.length}`);
  };

  if ("startDate" in payload) push("startDate", payload.startDate ?? null);
  if ("endDate" in payload) push("endDate", payload.endDate ?? null);
  if ("revenueGoal" in payload) push("revenueGoal", Number(payload.revenueGoal || 0));
  if ("patientGoal" in payload) push("patientGoal", Number(payload.patientGoal || 0));
  if ("evaluationGoal" in payload) push("evaluationGoal", Number(payload.evaluationGoal || 0));
  if ("conversionGoal" in payload) push("conversionGoal", Number(payload.conversionGoal || 0));
  if ("averageTicketGoal" in payload) push("averageTicketGoal", Number(payload.averageTicketGoal || 0));
  if ("notes" in payload) push("notes", payload.notes ?? null);

  if (sets.length === 0) return getBusinessGoalByMonthRaw(client, month);

  values.push(month);

  const rows = await client.$queryRawUnsafe(
    `
      UPDATE "BusinessGoal"
      SET ${sets.join(", ")}, "updatedAt" = NOW()
      WHERE "month" = $${values.length}
      RETURNING *
    `,
    ...values
  );

  return Array.isArray(rows) ? rows[0] : rows;
}

export async function upsertBusinessGoalRaw(client: PrismaLike, payload: BusinessGoalPayload) {
  const existing = await getBusinessGoalByMonthRaw(client, payload.month);

  if (existing) {
    return updateBusinessGoalRaw(client, payload.month, payload);
  }

  return createBusinessGoalRaw(client, payload);
}
