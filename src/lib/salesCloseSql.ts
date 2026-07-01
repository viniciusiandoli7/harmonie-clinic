import { randomUUID } from "crypto";
import { ensureProductionSchema } from "@/lib/productionSchemaSql";
import { safeExecute, safeQuery } from "@/lib/safeSql";

export type RawSaleItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  observation?: string;
};

export type NormalizedPayment = {
  method: string;
  originalMethod: string;
  amount: number;
  installments: number;
};

type PrismaLike = {
  $executeRawUnsafe: (query: string, ...values: any[]) => Promise<any>;
  $queryRawUnsafe: (query: string, ...values: any[]) => Promise<any>;
};

async function strictExecute(client: PrismaLike, query: string, ...values: any[]) {
  return client.$executeRawUnsafe(query, ...values);
}

async function getOrCreateProfessional(client: PrismaLike, commissionPct: number) {
  await ensureProductionSchema(client);
  const id = "mariana_id";
  const existing = await safeQuery<{ id: string }>(client, `SELECT "id" FROM "Professional" WHERE "id" = $1 LIMIT 1`, id);
  if (!existing[0]) {
    await safeExecute(
      client,
      `INSERT INTO "Professional" ("id", "name", "commission", "isActive", "createdAt", "updatedAt") VALUES ($1, $2, $3, true, NOW(), NOW())`,
      id,
      "Dra. Mariana Carmona",
      commissionPct / 100
    );
  } else {
    await safeExecute(
      client,
      `UPDATE "Professional" SET "name" = $2, "commission" = $3, "isActive" = true, "updatedAt" = NOW() WHERE "id" = $1`,
      id,
      "Dra. Mariana Carmona",
      commissionPct / 100
    );
  }
  return { id };
}

async function getOrCreateTreatment(client: PrismaLike) {
  await ensureProductionSchema(client);
  const name = "Procedimentos Estéticos";
  const rows = await safeQuery<{ id: string }>(client, `SELECT "id" FROM "Treatment" WHERE "name" = $1 ORDER BY "createdAt" ASC LIMIT 1`, name);
  if (rows[0]?.id) return rows[0];

  const id = randomUUID();
  await safeExecute(client, `INSERT INTO "Treatment" ("id", "name", "template", "standardPrice", "averageCost", "averageDurationMinutes", "requiresTerm", "isActive", "createdAt", "updatedAt") VALUES ($1, $2, $3, 0, 0, 60, true, true, NOW(), NOW())`, id, name, "Contrato de prestação de serviços estéticos.");

  const created = await safeQuery<{ id: string }>(client, `SELECT "id" FROM "Treatment" WHERE "id" = $1 LIMIT 1`, id);
  return created[0] || { id };
}

export async function closeSaleRaw(client: PrismaLike, input: {
  patientId: string;
  subtotal: number;
  discount: number;
  finalTotal: number;
  payments: NormalizedPayment[];
  normalizedItems: RawSaleItem[];
  clinicCommissionPct: number;
  commissionValue: number;
  operationalCost: number;
  clinicProfit: number;
  professionalValue: number;
  pendingAmount: number;
  generalTreatmentName: string;
  contractToken: string;
  contractHtml: string;
  bodyNotes?: string | null;
  goals?: string | null;
}) {
  await ensureProductionSchema(client);

  const professional = await getOrCreateProfessional(client, input.clinicCommissionPct);
  const treatment = await getOrCreateTreatment(client);

  const saleId = randomUUID();
  await strictExecute(
    client,
    `INSERT INTO "Sale" ("id", "patientId", "professionalId", "serviceId", "price", "discount", "finalPrice", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
    saleId,
    input.patientId,
    professional.id,
    treatment.id,
    input.subtotal,
    input.discount,
    input.finalTotal
  );

  for (const payment of input.payments) {
    await safeExecute(
      client,
      `INSERT INTO "SalePayment" ("id", "saleId", "amount", "method", "createdAt") VALUES ($1, $2, $3, $4, NOW())`,
      randomUUID(),
      saleId,
      payment.amount,
      payment.method
    );
  }

  for (const item of input.normalizedItems) {
    await safeExecute(
      client,
      `INSERT INTO "SaleItem" ("id", "saleId", "professionalId", "productName", "quantity", "unitPrice", "totalPrice", "commission") VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      randomUUID(),
      saleId,
      professional.id,
      `${item.description}${item.observation ? ` (${item.observation})` : ""}`,
      item.quantity,
      item.unitPrice,
      item.totalPrice,
      Math.round(item.totalPrice * (input.clinicCommissionPct / 100) * 100) / 100
    );
  }

  const financialTransactionId = randomUUID();
  await safeExecute(
    client,
    `INSERT INTO "FinancialTransaction" ("id", "type", "category", "description", "amount", "grossAmount", "feeAmount", "netAmount", "commissionAmount", "operationalCost", "professionalValue", "clinicProfit", "profit", "patientId", "saleId", "date", "status", "paidAt", "paymentMethod", "notes", "createdAt", "updatedAt") VALUES ($1, 'INCOME', 'PROCEDIMENTO', $2, $3, $4, 0, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), $13, $14, $15, $16, NOW(), NOW())`,
    financialTransactionId,
    `Venda: ${input.generalTreatmentName}`,
    input.finalTotal,
    input.subtotal,
    input.finalTotal,
    input.commissionValue,
    input.operationalCost,
    input.professionalValue,
    input.clinicProfit,
    input.clinicProfit,
    input.patientId,
    saleId,
    input.pendingAmount <= 0.01 ? "PAID" : "PENDING",
    input.pendingAmount <= 0.01 ? new Date() : null,
    input.payments.length ? input.payments.map((p) => p.method).join(" + ") : null,
    input.bodyNotes || null
  );

  for (let index = 0; index < input.payments.length; index += 1) {
    const payment = input.payments[index];
    await safeExecute(
      client,
      `INSERT INTO "FinancialInstallment" ("id", "transactionId", "saleId", "patientId", "description", "installmentNumber", "totalInstallments", "amount", "feeAmount", "netAmount", "dueDate", "status", "paidAt", "paymentMethod", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, $9, NOW(), 'PAID', NOW(), $10, NOW(), NOW())`,
      randomUUID(),
      financialTransactionId,
      saleId,
      input.patientId,
      `Venda: ${input.generalTreatmentName} (${index + 1}/${input.payments.length})`,
      index + 1,
      input.payments.length,
      payment.amount,
      payment.amount,
      payment.method
    );
  }

  if (input.pendingAmount > 0.01) {
    await safeExecute(
      client,
      `INSERT INTO "FinancialInstallment" ("id", "transactionId", "saleId", "patientId", "description", "installmentNumber", "totalInstallments", "amount", "feeAmount", "netAmount", "dueDate", "status", "paymentMethod", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, $9, NOW(), 'PENDING', NULL, NOW(), NOW())`,
      randomUUID(),
      financialTransactionId,
      saleId,
      input.patientId,
      `Saldo pendente: ${input.generalTreatmentName}`,
      input.payments.length + 1,
      input.payments.length + 1,
      input.pendingAmount,
      input.pendingAmount
    );
  }

  const contractId = randomUUID();
  await strictExecute(
    client,
    `INSERT INTO "PatientContract" ("id", "patientId", "title", "content", "total", "token", "itemsJson", "status", "signatureName", "signatureImage", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, 'PENDING', NULL, NULL, NOW(), NOW())`,
    contractId,
    input.patientId,
    `Contrato - ${new Date().toLocaleDateString("pt-BR")}`,
    input.contractHtml,
    input.finalTotal,
    input.contractToken,
    JSON.stringify(input.normalizedItems)
  );

  for (const item of input.normalizedItems) {
    await safeExecute(
      client,
      `INSERT INTO "ClinicalEvolutionPlan" ("id", "patientId", "treatmentName", "packageName", "totalSessions", "completedSessions", "status", "goals", "notes", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, 0, 'ACTIVE', $6, $7, NOW(), NOW())`,
      randomUUID(),
      input.patientId,
      item.description,
      item.observation || "Sessão avulsa",
      item.quantity,
      input.goals || "Definido no fechamento da venda.",
      input.bodyNotes || null
    );
  }

  await safeExecute(
    client,
    `INSERT INTO "ClinicalEvolution" ("id", "patientId", "content", "type", "important", "createdAt", "updatedAt") VALUES ($1, $2, $3, 'SALE_RECORD', true, NOW(), NOW())`,
    randomUUID(),
    input.patientId,
    `VENDA FECHADA: ${input.generalTreatmentName}. Total: R$ ${input.finalTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}.`
  );

  await safeExecute(
    client,
    `INSERT INTO "AuditLog" ("id", "action", "entity", "entityId", "description", "userName", "afterJson", "createdAt") VALUES ($1, 'CREATE', 'Sale', $2, $3, 'Dra. Mariana', $4::jsonb, NOW())`,
    randomUUID(),
    saleId,
    `Venda fechada: ${input.generalTreatmentName}`,
    JSON.stringify({ saleId, patientId: input.patientId, finalTotal: input.finalTotal, payments: input.payments, items: input.normalizedItems })
  );

  return {
    sale: { id: saleId },
    contract: { id: contractId, token: input.contractToken },
    financialTransaction: { id: financialTransactionId },
  };
}
