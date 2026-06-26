-- Patient create stability patch
-- Garante que bancos locais criados em versões anteriores tenham todas as colunas usadas pelo cadastro completo.

ALTER TABLE "Patient"
  ADD COLUMN IF NOT EXISTS "cpf" TEXT,
  ADD COLUMN IF NOT EXISTS "rg" TEXT,
  ADD COLUMN IF NOT EXISTS "address" TEXT,
  ADD COLUMN IF NOT EXISTS "addressNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "addressComplement" TEXT,
  ADD COLUMN IF NOT EXISTS "neighborhood" TEXT,
  ADD COLUMN IF NOT EXISTS "city" TEXT,
  ADD COLUMN IF NOT EXISTS "state" TEXT,
  ADD COLUMN IF NOT EXISTS "zipCode" TEXT,
  ADD COLUMN IF NOT EXISTS "crmSource" TEXT,
  ADD COLUMN IF NOT EXISTS "referralName" TEXT,
  ADD COLUMN IF NOT EXISTS "crmStatus" TEXT DEFAULT 'Novo Lead',
  ADD COLUMN IF NOT EXISTS "imageAuthorized" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "interestProcedure" TEXT,
  ADD COLUMN IF NOT EXISTS "patientProfile" TEXT,
  ADD COLUMN IF NOT EXISTS "commercialNotes" TEXT,
  ADD COLUMN IF NOT EXISTS "conversionStatus" TEXT,
  ADD COLUMN IF NOT EXISTS "proposedValue" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "closedValue" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "lostReason" TEXT,
  ADD COLUMN IF NOT EXISTS "firstEvaluationAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "nextSuggestedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "notes" TEXT,
  ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;

CREATE UNIQUE INDEX IF NOT EXISTS "Patient_email_key" ON "Patient"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "Patient_cpf_key" ON "Patient"("cpf");
CREATE INDEX IF NOT EXISTS "Patient_name_idx" ON "Patient"("name");
CREATE INDEX IF NOT EXISTS "Patient_phone_idx" ON "Patient"("phone");

CREATE TABLE IF NOT EXISTS "PatientAnamnesis" (
  "id" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PatientAnamnesis_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "PatientAnamnesis"
  ADD COLUMN IF NOT EXISTS "profession" TEXT,
  ADD COLUMN IF NOT EXISTS "sunExposure" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "mainComplaint" TEXT,
  ADD COLUMN IF NOT EXISTS "previousFillers" TEXT,
  ADD COLUMN IF NOT EXISTS "previousBotox" TEXT,
  ADD COLUMN IF NOT EXISTS "takingRoacutan" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "medications" TEXT,
  ADD COLUMN IF NOT EXISTS "allergicToEgg" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "allergicToSeafood" TEXT,
  ADD COLUMN IF NOT EXISTS "dentalAnesthesia" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "dentalAnesthesiaReaction" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "procedureReaction" TEXT,
  ADD COLUMN IF NOT EXISTS "keloidTendency" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "degenerativeDisease" TEXT,
  ADD COLUMN IF NOT EXISTS "diseases" TEXT,
  ADD COLUMN IF NOT EXISTS "allergies" TEXT,
  ADD COLUMN IF NOT EXISTS "hasHerpes" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "usesAspirin" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "usesCorticosteroids" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "smoker" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "drinksAlcohol" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "bloodPressure" TEXT,
  ADD COLUMN IF NOT EXISTS "pregnantOrNursing" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "previousPregnancies" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "exercises" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "skinCareRoutine" TEXT,
  ADD COLUMN IF NOT EXISTS "weightLoss" TEXT,
  ADD COLUMN IF NOT EXISTS "intendsToLoseWeight" TEXT,
  ADD COLUMN IF NOT EXISTS "intendsSurgery" TEXT,
  ADD COLUMN IF NOT EXISTS "surgeries" TEXT,
  ADD COLUMN IF NOT EXISTS "recentTreatmentOrVaccine" TEXT,
  ADD COLUMN IF NOT EXISTS "permanentImplants" TEXT,
  ADD COLUMN IF NOT EXISTS "consentSigned" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "usesAnticoagulant" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "hasAutoimmuneDisease" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "hasDiabetes" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "hasEpilepsy" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "activeInfection" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "recentDentalProcedure" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "fillerComplicationHistory" TEXT,
  ADD COLUMN IF NOT EXISTS "clinicalRiskNotes" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "PatientAnamnesis_patientId_key" ON "PatientAnamnesis"("patientId");
CREATE INDEX IF NOT EXISTS "PatientAnamnesis_patientId_idx" ON "PatientAnamnesis"("patientId");
ALTER TABLE "PatientAnamnesis" DROP CONSTRAINT IF EXISTS "PatientAnamnesis_patientId_fkey";
ALTER TABLE "PatientAnamnesis" ADD CONSTRAINT "PatientAnamnesis_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AuditLog"
  ADD COLUMN IF NOT EXISTS "beforeJson" JSONB,
  ADD COLUMN IF NOT EXISTS "afterJson" JSONB,
  ADD COLUMN IF NOT EXISTS "contextJson" JSONB;
