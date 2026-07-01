type PrismaLike = {
  $executeRawUnsafe: (query: string, ...values: any[]) => Promise<any>;
};

export async function ensureInventorySchema(client: PrismaLike) {
  await client.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "InventoryItem" (
      "id" TEXT PRIMARY KEY,
      "product" TEXT NOT NULL,
      "category" TEXT,
      "linkedProcedure" TEXT,
      "supplier" TEXT,
      "entryQuantity" INTEGER NOT NULL DEFAULT 0,
      "quantity" INTEGER NOT NULL DEFAULT 0,
      "entryDate" TIMESTAMP(3),
      "batch" TEXT,
      "expiresAt" TIMESTAMP(3),
      "minimumQuantity" INTEGER NOT NULL DEFAULT 1,
      "unitValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "applicationMaterials" TEXT,
      "applicationMaterialsValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "status" TEXT NOT NULL DEFAULT 'DISPONIVEL',
      "patientName" TEXT,
      "exitDate" TIMESTAMP(3),
      "notes" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await client.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "InventoryMovement" (
      "id" TEXT PRIMARY KEY,
      "inventoryItemId" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "quantity" INTEGER NOT NULL,
      "unitValue" DOUBLE PRECISION,
      "totalValue" DOUBLE PRECISION,
      "reason" TEXT,
      "procedureName" TEXT,
      "patientId" TEXT,
      "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await client.$executeRawUnsafe(`
    ALTER TABLE "InventoryItem"
    ADD COLUMN IF NOT EXISTS "category" TEXT,
    ADD COLUMN IF NOT EXISTS "linkedProcedure" TEXT,
    ADD COLUMN IF NOT EXISTS "supplier" TEXT,
    ADD COLUMN IF NOT EXISTS "entryQuantity" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "entryDate" TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS "applicationMaterials" TEXT,
    ADD COLUMN IF NOT EXISTS "applicationMaterialsValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'DISPONIVEL',
    ADD COLUMN IF NOT EXISTS "patientName" TEXT,
    ADD COLUMN IF NOT EXISTS "exitDate" TIMESTAMP(3)
  `);

  await client.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "InventoryItem_product_idx" ON "InventoryItem"("product")`);
  await client.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "InventoryItem_category_idx" ON "InventoryItem"("category")`);
  await client.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "InventoryItem_linkedProcedure_idx" ON "InventoryItem"("linkedProcedure")`);
  await client.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "InventoryItem_status_idx" ON "InventoryItem"("status")`);
  await client.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "InventoryItem_patientName_idx" ON "InventoryItem"("patientName")`);
  await client.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "InventoryItem_expiresAt_idx" ON "InventoryItem"("expiresAt")`);
  await client.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "InventoryMovement_inventoryItemId_idx" ON "InventoryMovement"("inventoryItemId")`);
  await client.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "InventoryMovement_patientId_idx" ON "InventoryMovement"("patientId")`);
  await client.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "InventoryMovement_date_idx" ON "InventoryMovement"("date")`);
  await client.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "InventoryMovement_type_idx" ON "InventoryMovement"("type")`);
}

export async function ensureAuditSchema(client: PrismaLike) {
  await client.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "AuditLog" (
      "id" TEXT PRIMARY KEY,
      "action" TEXT NOT NULL,
      "entity" TEXT NOT NULL,
      "entityId" TEXT,
      "description" TEXT,
      "userName" TEXT,
      "beforeJson" JSONB,
      "afterJson" JSONB,
      "contextJson" JSONB,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await client.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "AuditLog_entity_idx" ON "AuditLog"("entity")`);
  await client.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt")`);
}

export async function ensurePatientFeatureTables(client: PrismaLike) {
  await client.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Treatment" (
      "id" TEXT PRIMARY KEY,
      "name" TEXT NOT NULL,
      "template" TEXT NOT NULL DEFAULT '',
      "standardPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "averageCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "averageDurationMinutes" INTEGER NOT NULL DEFAULT 60,
      "defaultReturnDays" INTEGER,
      "requiresTerm" BOOLEAN NOT NULL DEFAULT true,
      "requiresPhotos" BOOLEAN NOT NULL DEFAULT false,
      "requiresBatch" BOOLEAN NOT NULL DEFAULT false,
      "postCareInstructions" TEXT,
      "defaultWhatsAppMessage" TEXT,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await client.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Appointment" (
      "id" TEXT PRIMARY KEY,
      "date" TIMESTAMP(3) NOT NULL,
      "patientId" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
      "durationMinutes" INTEGER NOT NULL DEFAULT 30,
      "procedureName" TEXT,
      "price" DOUBLE PRECISION,
      "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
      "room" TEXT NOT NULL DEFAULT 'A',
      "notes" TEXT
    )
  `);

  await client.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "FinancialTransaction" (
      "id" TEXT PRIMARY KEY,
      "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "description" TEXT NOT NULL,
      "category" TEXT NOT NULL,
      "amount" DOUBLE PRECISION NOT NULL,
      "grossAmount" DOUBLE PRECISION,
      "feeAmount" DOUBLE PRECISION,
      "netAmount" DOUBLE PRECISION,
      "cardFeePercent" DOUBLE PRECISION,
      "commissionAmount" DOUBLE PRECISION,
      "type" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'PENDING',
      "paymentMethod" TEXT,
      "notes" TEXT,
      "attachmentsJson" JSONB,
      "paidAt" TIMESTAMP(3),
      "canceledAt" TIMESTAMP(3),
      "profit" DOUBLE PRECISION,
      "clinicProfit" DOUBLE PRECISION,
      "operationalCost" DOUBLE PRECISION,
      "professionalValue" DOUBLE PRECISION,
      "patientId" TEXT,
      "saleId" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await client.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "FinancialInstallment" (
      "id" TEXT PRIMARY KEY,
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
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await client.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "PatientContract" (
      "id" TEXT PRIMARY KEY,
      "token" TEXT NOT NULL,
      "patientId" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "content" TEXT NOT NULL,
      "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "status" TEXT NOT NULL DEFAULT 'PENDING',
      "itemsJson" JSONB NOT NULL DEFAULT '[]'::jsonb,
      "signatureName" TEXT,
      "signatureImage" TEXT,
      "signatureIp" TEXT,
      "signedAt" TIMESTAMP(3),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await client.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "ClinicalEvolution" (
      "id" TEXT PRIMARY KEY,
      "patientId" TEXT NOT NULL,
      "content" TEXT NOT NULL,
      "type" TEXT NOT NULL DEFAULT 'MANUAL',
      "important" BOOLEAN NOT NULL DEFAULT false,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);


  await client.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "PatientPhoto" (
      "id" TEXT PRIMARY KEY,
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
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await client.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "TreatmentPlan" (
      "id" TEXT PRIMARY KEY,
      "patientId" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "objective" TEXT,
      "totalEstimated" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "status" TEXT NOT NULL DEFAULT 'ACTIVE',
      "notes" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await client.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "TreatmentPlanStep" (
      "id" TEXT PRIMARY KEY,
      "planId" TEXT NOT NULL,
      "treatmentId" TEXT,
      "title" TEXT NOT NULL,
      "priority" INTEGER NOT NULL DEFAULT 1,
      "estimatedValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "status" TEXT NOT NULL DEFAULT 'SUGGESTED',
      "plannedDate" TIMESTAMP(3),
      "performedDate" TIMESTAMP(3),
      "notes" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await client.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "StructuredClinicalEvolution" (
      "id" TEXT PRIMARY KEY,
      "patientId" TEXT NOT NULL,
      "treatmentId" TEXT,
      "complaint" TEXT,
      "clinicalAssessment" TEXT,
      "procedurePerformed" TEXT NOT NULL,
      "productUsed" TEXT,
      "batch" TEXT,
      "expiresAt" TIMESTAMP(3),
      "bodyArea" TEXT,
      "quantity" TEXT,
      "intercurrences" TEXT,
      "guidance" TEXT,
      "recommendedReturn" TIMESTAMP(3),
      "termSigned" BOOLEAN NOT NULL DEFAULT false,
      "photosTaken" BOOLEAN NOT NULL DEFAULT false,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await client.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "PostProcedureTask" (
      "id" TEXT PRIMARY KEY,
      "patientId" TEXT NOT NULL,
      "treatmentId" TEXT,
      "title" TEXT NOT NULL,
      "message" TEXT,
      "dueDate" TIMESTAMP(3) NOT NULL,
      "completedAt" TIMESTAMP(3),
      "status" TEXT NOT NULL DEFAULT 'PENDING',
      "channel" TEXT NOT NULL DEFAULT 'WhatsApp',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await client.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "EvaluationConversion" (
      "id" TEXT PRIMARY KEY,
      "patientId" TEXT NOT NULL,
      "evaluationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "proposedPlan" TEXT,
      "proposedValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "closedValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "status" TEXT NOT NULL DEFAULT 'FOLLOW_UP',
      "lostReason" TEXT,
      "followUpDate" TIMESTAMP(3),
      "notes" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await client.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "ClinicalEvolutionPlan" (
      "id" TEXT PRIMARY KEY,
      "patientId" TEXT NOT NULL,
      "treatmentName" TEXT NOT NULL,
      "packageName" TEXT,
      "totalSessions" INTEGER NOT NULL DEFAULT 1,
      "completedSessions" INTEGER NOT NULL DEFAULT 0,
      "status" TEXT NOT NULL DEFAULT 'ACTIVE',
      "startDate" TIMESTAMP(3),
      "endDate" TIMESTAMP(3),
      "goals" TEXT,
      "notes" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await client.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "ClinicalEvolutionSession" (
      "id" TEXT PRIMARY KEY,
      "planId" TEXT NOT NULL,
      "sessionNumber" INTEGER NOT NULL,
      "sessionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "performedProcedure" TEXT,
      "bodyMeasurements" TEXT,
      "clinicalNotes" TEXT,
      "imagesJson" JSONB,
      "patientSignatureName" TEXT,
      "signedAt" TIMESTAMP(3),
      "signatureImage" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await client.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "Treatment_name_key" ON "Treatment"("name")`);
  await client.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Appointment_patientId_idx" ON "Appointment"("patientId")`);
  await client.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Appointment_date_idx" ON "Appointment"("date")`);
  await client.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "FinancialTransaction_patientId_idx" ON "FinancialTransaction"("patientId")`);
  await client.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "FinancialTransaction_date_idx" ON "FinancialTransaction"("date")`);
  await client.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "FinancialInstallment_patientId_idx" ON "FinancialInstallment"("patientId")`);
  await client.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "FinancialInstallment_dueDate_idx" ON "FinancialInstallment"("dueDate")`);
  await client.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "PatientContract_token_key" ON "PatientContract"("token")`);
  await client.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "PatientContract_patientId_idx" ON "PatientContract"("patientId")`);
  await client.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "ClinicalEvolution_patientId_idx" ON "ClinicalEvolution"("patientId")`);

    await client.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "PatientPhoto_patientId_idx" ON "PatientPhoto"("patientId")`);
  await client.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "TreatmentPlan_patientId_idx" ON "TreatmentPlan"("patientId")`);
  await client.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "TreatmentPlanStep_planId_idx" ON "TreatmentPlanStep"("planId")`);
  await client.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "StructuredClinicalEvolution_patientId_idx" ON "StructuredClinicalEvolution"("patientId")`);
  await client.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "PostProcedureTask_patientId_idx" ON "PostProcedureTask"("patientId")`);
  await client.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "EvaluationConversion_patientId_idx" ON "EvaluationConversion"("patientId")`);
  await client.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "ClinicalEvolutionPlan_patientId_idx" ON "ClinicalEvolutionPlan"("patientId")`);
  await client.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "ClinicalEvolutionSession_planId_idx" ON "ClinicalEvolutionSession"("planId")`);
}

export async function ensureProductionSchema(client: PrismaLike) {
  await ensureAuditSchema(client);
  await ensureInventorySchema(client);
  await ensurePatientFeatureTables(client);
}
