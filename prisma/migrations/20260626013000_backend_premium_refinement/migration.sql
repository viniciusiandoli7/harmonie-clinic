-- Backend premium refinement for Mariana Thomaz Carmona clinic system
-- Adds stronger financial control, installments, monthly closing, inventory movements,
-- patient photo gallery and richer audit logs while preserving existing data.

ALTER TABLE "FinancialTransaction"
  ADD COLUMN IF NOT EXISTS "grossAmount" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "feeAmount" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "netAmount" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "cardFeePercent" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "commissionAmount" DOUBLE PRECISION;

CREATE TABLE IF NOT EXISTS "FinancialInstallment" (
  "id" TEXT NOT NULL,
  "transactionId" TEXT,
  "saleId" TEXT,
  "patientId" TEXT,
  "description" TEXT NOT NULL,
  "installmentNumber" INTEGER NOT NULL DEFAULT 1,
  "totalInstallments" INTEGER NOT NULL DEFAULT 1,
  "amount" DOUBLE PRECISION NOT NULL,
  "feeAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "netAmount" DOUBLE PRECISION,
  "dueDate" TIMESTAMP(3) NOT NULL,
  "paidAt" TIMESTAMP(3),
  "canceledAt" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "paymentMethod" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "FinancialInstallment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "FinancialInstallment_transactionId_idx" ON "FinancialInstallment"("transactionId");
CREATE INDEX IF NOT EXISTS "FinancialInstallment_saleId_idx" ON "FinancialInstallment"("saleId");
CREATE INDEX IF NOT EXISTS "FinancialInstallment_patientId_idx" ON "FinancialInstallment"("patientId");
CREATE INDEX IF NOT EXISTS "FinancialInstallment_dueDate_idx" ON "FinancialInstallment"("dueDate");
CREATE INDEX IF NOT EXISTS "FinancialInstallment_status_idx" ON "FinancialInstallment"("status");

ALTER TABLE "FinancialInstallment"
  ADD CONSTRAINT "FinancialInstallment_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "FinancialTransaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FinancialInstallment"
  ADD CONSTRAINT "FinancialInstallment_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FinancialInstallment"
  ADD CONSTRAINT "FinancialInstallment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "MonthlyClosing" (
  "id" TEXT NOT NULL,
  "month" TEXT NOT NULL,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3) NOT NULL,
  "grossIncome" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "expenses" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "fees" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "commissions" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "netProfit" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "availableBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "averageTicket" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "topProcedure" TEXT,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "closedAt" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "MonthlyClosing_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "MonthlyClosing_month_key" ON "MonthlyClosing"("month");
CREATE INDEX IF NOT EXISTS "MonthlyClosing_startDate_endDate_idx" ON "MonthlyClosing"("startDate", "endDate");
CREATE INDEX IF NOT EXISTS "MonthlyClosing_status_idx" ON "MonthlyClosing"("status");

CREATE TABLE IF NOT EXISTS "InventoryMovement" (
  "id" TEXT NOT NULL,
  "inventoryItemId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "unitValue" DOUBLE PRECISION,
  "totalValue" DOUBLE PRECISION,
  "reason" TEXT,
  "procedureName" TEXT,
  "patientId" TEXT,
  "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "InventoryMovement_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "InventoryMovement_inventoryItemId_idx" ON "InventoryMovement"("inventoryItemId");
CREATE INDEX IF NOT EXISTS "InventoryMovement_patientId_idx" ON "InventoryMovement"("patientId");
CREATE INDEX IF NOT EXISTS "InventoryMovement_date_idx" ON "InventoryMovement"("date");
CREATE INDEX IF NOT EXISTS "InventoryMovement_type_idx" ON "InventoryMovement"("type");

ALTER TABLE "InventoryMovement"
  ADD CONSTRAINT "InventoryMovement_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InventoryMovement"
  ADD CONSTRAINT "InventoryMovement_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "PatientPhoto" (
  "id" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "title" TEXT,
  "procedureName" TEXT,
  "bodyArea" TEXT,
  "photoType" TEXT NOT NULL DEFAULT 'CLINICAL',
  "imageUrl" TEXT NOT NULL,
  "takenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "imageAuthorized" BOOLEAN NOT NULL DEFAULT false,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "PatientPhoto_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PatientPhoto_patientId_idx" ON "PatientPhoto"("patientId");
CREATE INDEX IF NOT EXISTS "PatientPhoto_takenAt_idx" ON "PatientPhoto"("takenAt");
CREATE INDEX IF NOT EXISTS "PatientPhoto_imageAuthorized_idx" ON "PatientPhoto"("imageAuthorized");

ALTER TABLE "PatientPhoto"
  ADD CONSTRAINT "PatientPhoto_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AuditLog"
  ADD COLUMN IF NOT EXISTS "beforeJson" JSONB,
  ADD COLUMN IF NOT EXISTS "afterJson" JSONB,
  ADD COLUMN IF NOT EXISTS "contextJson" JSONB;
