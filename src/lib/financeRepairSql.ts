import { randomUUID } from "crypto";
import { ensureProductionSchema } from "@/lib/productionSchemaSql";
import { safeExecute, safeQuery } from "@/lib/safeSql";

type PrismaLike = {
  $executeRawUnsafe: (query: string, ...values: any[]) => Promise<any>;
  $queryRawUnsafe: (query: string, ...values: any[]) => Promise<any>;
};

function round2(value: number) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function asNumber(value: unknown) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

function paymentMethodLabel(methods: string[]) {
  if (!methods.length) return null;
  return [...new Set(methods.filter(Boolean))].join(" + ");
}

export async function ensureFinancialTransactionsForSales(client: PrismaLike) {
  await ensureProductionSchema(client);

  const sales = await safeQuery<any>(client, `
    SELECT
      s."id",
      s."patientId",
      s."price",
      s."discount",
      s."finalPrice",
      s."createdAt",
      p."name" AS "patientName",
      COALESCE(SUM(sp."amount"), 0) AS "paidAmount",
      ARRAY_REMOVE(ARRAY_AGG(DISTINCT sp."method"), NULL) AS "paymentMethods",
      ARRAY_REMOVE(ARRAY_AGG(DISTINCT si."productName"), NULL) AS "items"
    FROM "Sale" s
    LEFT JOIN "Patient" p ON p."id" = s."patientId"
    LEFT JOIN "SalePayment" sp ON sp."saleId" = s."id"
    LEFT JOIN "SaleItem" si ON si."saleId" = s."id"
    LEFT JOIN "FinancialTransaction" ft ON ft."saleId" = s."id"
    WHERE ft."id" IS NULL
    GROUP BY s."id", s."patientId", s."price", s."discount", s."finalPrice", s."createdAt", p."name"
    ORDER BY s."createdAt" DESC
  `);

  let created = 0;

  for (const sale of sales) {
    const finalPrice = round2(asNumber(sale.finalPrice || sale.price));
    if (finalPrice <= 0) continue;

    const paidAmount = round2(asNumber(sale.paidAmount));
    const items = Array.isArray(sale.items) && sale.items.length ? sale.items.filter(Boolean) : ["Procedimento"];
    const description = `Venda: ${items.join(" + ")}`;
    const status = paidAmount >= finalPrice - 0.01 ? "PAID" : paidAmount > 0 ? "PARTIAL" : "PENDING";
    const netAmount = paidAmount > 0 ? paidAmount : finalPrice;
    const transactionId = randomUUID();
    const methods = Array.isArray(sale.paymentMethods) ? sale.paymentMethods : [];
    const paymentMethod = paymentMethodLabel(methods);

    const result = await safeExecute(
      client,
      `
        INSERT INTO "FinancialTransaction" (
          "id", "date", "description", "category", "amount", "grossAmount", "feeAmount", "netAmount",
          "commissionAmount", "type", "status", "paymentMethod", "paidAt", "profit", "clinicProfit",
          "patientId", "saleId", "notes", "createdAt", "updatedAt"
        )
        VALUES (
          $1, $2, $3, 'Procedimento', $4, $5, 0, $6,
          0, 'INCOME', $7, $8, $9, $10, $11,
          $12, $13, $14, NOW(), NOW()
        )
      `,
      transactionId,
      sale.createdAt || new Date(),
      description,
      finalPrice,
      finalPrice,
      netAmount,
      status,
      paymentMethod,
      status === "PAID" || status === "PARTIAL" ? sale.createdAt || new Date() : null,
      netAmount,
      netAmount,
      sale.patientId,
      sale.id,
      `Movimentação financeira criada automaticamente a partir da venda${sale.patientName ? ` de ${sale.patientName}` : ""}.`
    );

    if (result !== null) {
      created += 1;

      await safeExecute(
        client,
        `
          INSERT INTO "FinancialInstallment" (
            "id", "transactionId", "saleId", "patientId", "description", "installmentNumber", "totalInstallments",
            "amount", "feeAmount", "netAmount", "dueDate", "status", "paidAt", "paymentMethod", "createdAt", "updatedAt"
          )
          VALUES ($1, $2, $3, $4, $5, 1, 1, $6, 0, $7, $8, $9, $10, $11, NOW(), NOW())
        `,
        randomUUID(),
        transactionId,
        sale.id,
        sale.patientId,
        description,
        netAmount,
        netAmount,
        sale.createdAt || new Date(),
        status === "PENDING" ? "PENDING" : "PAID",
        status === "PENDING" ? null : sale.createdAt || new Date(),
        paymentMethod
      );
    }
  }

  return { scanned: sales.length, created };
}
