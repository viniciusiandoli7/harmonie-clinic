-- Complete clinic management refinement for Mariana Thomaz Carmona
-- Adds treatment planning, treatment catalog costing, post-procedure follow-up,
-- WhatsApp templates, structured evolutions, evaluation conversion and monthly goals.

-- Agenda status refinement
ALTER TYPE "AppointmentStatus" ADD VALUE IF NOT EXISTS 'CONFIRMED';
ALTER TYPE "AppointmentStatus" ADD VALUE IF NOT EXISTS 'NO_SHOW';
ALTER TYPE "AppointmentStatus" ADD VALUE IF NOT EXISTS 'RESCHEDULED';
ALTER TYPE "AppointmentStatus" ADD VALUE IF NOT EXISTS 'RETURN';
ALTER TYPE "AppointmentStatus" ADD VALUE IF NOT EXISTS 'FIT_IN';

ALTER TABLE "Patient"
  ADD COLUMN IF NOT EXISTS "patientProfile" TEXT,
  ADD COLUMN IF NOT EXISTS "commercialNotes" TEXT,
  ADD COLUMN IF NOT EXISTS "conversionStatus" TEXT,
  ADD COLUMN IF NOT EXISTS "proposedValue" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "closedValue" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "lostReason" TEXT,
  ADD COLUMN IF NOT EXISTS "firstEvaluationAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "nextSuggestedAt" TIMESTAMP(3);

ALTER TABLE "PatientAnamnesis"
  ADD COLUMN IF NOT EXISTS "usesAnticoagulant" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "hasAutoimmuneDisease" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "hasDiabetes" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "hasEpilepsy" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "activeInfection" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "recentDentalProcedure" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "fillerComplicationHistory" TEXT,
  ADD COLUMN IF NOT EXISTS "clinicalRiskNotes" TEXT;

ALTER TABLE "Treatment"
  ADD COLUMN IF NOT EXISTS "standardPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "averageCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "averageDurationMinutes" INTEGER NOT NULL DEFAULT 60,
  ADD COLUMN IF NOT EXISTS "defaultReturnDays" INTEGER,
  ADD COLUMN IF NOT EXISTS "requiresTerm" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "requiresPhotos" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "requiresBatch" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "postCareInstructions" TEXT,
  ADD COLUMN IF NOT EXISTS "defaultWhatsAppMessage" TEXT,
  ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS "TreatmentCostItem" (
  "id" TEXT NOT NULL,
  "treatmentId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'Produto',
  "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
  "unitCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "totalCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TreatmentCostItem_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "TreatmentCostItem_treatmentId_idx" ON "TreatmentCostItem"("treatmentId");
ALTER TABLE "TreatmentCostItem" DROP CONSTRAINT IF EXISTS "TreatmentCostItem_treatmentId_fkey";
ALTER TABLE "TreatmentCostItem" ADD CONSTRAINT "TreatmentCostItem_treatmentId_fkey" FOREIGN KEY ("treatmentId") REFERENCES "Treatment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "TreatmentPlan" (
  "id" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "objective" TEXT,
  "totalEstimated" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TreatmentPlan_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "TreatmentPlan_patientId_idx" ON "TreatmentPlan"("patientId");
CREATE INDEX IF NOT EXISTS "TreatmentPlan_status_idx" ON "TreatmentPlan"("status");
ALTER TABLE "TreatmentPlan" DROP CONSTRAINT IF EXISTS "TreatmentPlan_patientId_fkey";
ALTER TABLE "TreatmentPlan" ADD CONSTRAINT "TreatmentPlan_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "TreatmentPlanStep" (
  "id" TEXT NOT NULL,
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
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TreatmentPlanStep_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "TreatmentPlanStep_planId_idx" ON "TreatmentPlanStep"("planId");
CREATE INDEX IF NOT EXISTS "TreatmentPlanStep_treatmentId_idx" ON "TreatmentPlanStep"("treatmentId");
CREATE INDEX IF NOT EXISTS "TreatmentPlanStep_status_idx" ON "TreatmentPlanStep"("status");
ALTER TABLE "TreatmentPlanStep" DROP CONSTRAINT IF EXISTS "TreatmentPlanStep_planId_fkey";
ALTER TABLE "TreatmentPlanStep" ADD CONSTRAINT "TreatmentPlanStep_planId_fkey" FOREIGN KEY ("planId") REFERENCES "TreatmentPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TreatmentPlanStep" DROP CONSTRAINT IF EXISTS "TreatmentPlanStep_treatmentId_fkey";
ALTER TABLE "TreatmentPlanStep" ADD CONSTRAINT "TreatmentPlanStep_treatmentId_fkey" FOREIGN KEY ("treatmentId") REFERENCES "Treatment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "StructuredClinicalEvolution" (
  "id" TEXT NOT NULL,
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
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StructuredClinicalEvolution_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "StructuredClinicalEvolution_patientId_idx" ON "StructuredClinicalEvolution"("patientId");
CREATE INDEX IF NOT EXISTS "StructuredClinicalEvolution_treatmentId_idx" ON "StructuredClinicalEvolution"("treatmentId");
CREATE INDEX IF NOT EXISTS "StructuredClinicalEvolution_createdAt_idx" ON "StructuredClinicalEvolution"("createdAt");
ALTER TABLE "StructuredClinicalEvolution" DROP CONSTRAINT IF EXISTS "StructuredClinicalEvolution_patientId_fkey";
ALTER TABLE "StructuredClinicalEvolution" ADD CONSTRAINT "StructuredClinicalEvolution_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StructuredClinicalEvolution" DROP CONSTRAINT IF EXISTS "StructuredClinicalEvolution_treatmentId_fkey";
ALTER TABLE "StructuredClinicalEvolution" ADD CONSTRAINT "StructuredClinicalEvolution_treatmentId_fkey" FOREIGN KEY ("treatmentId") REFERENCES "Treatment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "PostProcedureTask" (
  "id" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "treatmentId" TEXT,
  "title" TEXT NOT NULL,
  "message" TEXT,
  "dueDate" TIMESTAMP(3) NOT NULL,
  "completedAt" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "channel" TEXT NOT NULL DEFAULT 'WhatsApp',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PostProcedureTask_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "PostProcedureTask_patientId_idx" ON "PostProcedureTask"("patientId");
CREATE INDEX IF NOT EXISTS "PostProcedureTask_dueDate_idx" ON "PostProcedureTask"("dueDate");
CREATE INDEX IF NOT EXISTS "PostProcedureTask_status_idx" ON "PostProcedureTask"("status");
ALTER TABLE "PostProcedureTask" DROP CONSTRAINT IF EXISTS "PostProcedureTask_patientId_fkey";
ALTER TABLE "PostProcedureTask" ADD CONSTRAINT "PostProcedureTask_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PostProcedureTask" DROP CONSTRAINT IF EXISTS "PostProcedureTask_treatmentId_fkey";
ALTER TABLE "PostProcedureTask" ADD CONSTRAINT "PostProcedureTask_treatmentId_fkey" FOREIGN KEY ("treatmentId") REFERENCES "Treatment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "WhatsAppTemplate" (
  "id" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WhatsAppTemplate_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "WhatsAppTemplate_category_idx" ON "WhatsAppTemplate"("category");
CREATE INDEX IF NOT EXISTS "WhatsAppTemplate_isActive_idx" ON "WhatsAppTemplate"("isActive");

CREATE TABLE IF NOT EXISTS "EvaluationConversion" (
  "id" TEXT NOT NULL,
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
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EvaluationConversion_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "EvaluationConversion_patientId_idx" ON "EvaluationConversion"("patientId");
CREATE INDEX IF NOT EXISTS "EvaluationConversion_evaluationDate_idx" ON "EvaluationConversion"("evaluationDate");
CREATE INDEX IF NOT EXISTS "EvaluationConversion_status_idx" ON "EvaluationConversion"("status");
ALTER TABLE "EvaluationConversion" DROP CONSTRAINT IF EXISTS "EvaluationConversion_patientId_fkey";
ALTER TABLE "EvaluationConversion" ADD CONSTRAINT "EvaluationConversion_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "BusinessGoal" (
  "id" TEXT NOT NULL,
  "month" TEXT NOT NULL,
  "revenueGoal" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "patientGoal" INTEGER NOT NULL DEFAULT 0,
  "evaluationGoal" INTEGER NOT NULL DEFAULT 0,
  "conversionGoal" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "averageTicketGoal" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BusinessGoal_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "BusinessGoal_month_key" ON "BusinessGoal"("month");
CREATE INDEX IF NOT EXISTS "BusinessGoal_month_idx" ON "BusinessGoal"("month");
