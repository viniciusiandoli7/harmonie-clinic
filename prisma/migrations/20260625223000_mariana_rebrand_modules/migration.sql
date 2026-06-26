-- Rebranding e evolução funcional para Mariana Thomaz Carmona

-- CRM de pacientes
ALTER TABLE "Patient"
ADD COLUMN "referralName" TEXT,
ADD COLUMN "crmStatus" TEXT DEFAULT 'Novo Lead',
ADD COLUMN "imageAuthorized" BOOLEAN NOT NULL DEFAULT false;

-- Financeiro premium
ALTER TABLE "FinancialTransaction"
ADD COLUMN "status" TEXT NOT NULL DEFAULT 'PENDING',
ADD COLUMN "paymentMethod" TEXT,
ADD COLUMN "notes" TEXT,
ADD COLUMN "attachmentsJson" JSONB,
ADD COLUMN "paidAt" TIMESTAMP(3),
ADD COLUMN "canceledAt" TIMESTAMP(3);

-- Estoque
CREATE TABLE "InventoryItem" (
    "id" TEXT NOT NULL,
    "product" TEXT NOT NULL,
    "supplier" TEXT,
    "batch" TEXT,
    "expiresAt" TIMESTAMP(3),
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "minimumQuantity" INTEGER NOT NULL DEFAULT 1,
    "unitValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

-- Log para auditoria futura
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "description" TEXT,
    "userName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- Histórico de backup
CREATE TABLE "BackupHistory" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'MANUAL',
    "target" TEXT NOT NULL DEFAULT 'LOCAL',
    "status" TEXT NOT NULL DEFAULT 'SUCCESS',
    "sizeLabel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BackupHistory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "InventoryItem_product_idx" ON "InventoryItem"("product");
CREATE INDEX "InventoryItem_expiresAt_idx" ON "InventoryItem"("expiresAt");
CREATE INDEX "AuditLog_entity_idx" ON "AuditLog"("entity");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
CREATE INDEX "BackupHistory_createdAt_idx" ON "BackupHistory"("createdAt");
