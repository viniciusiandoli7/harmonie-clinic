/*
  Warnings:

  - You are about to drop the column `alcoholFrequency` on the `PatientAnamnesis` table. All the data in the column will be lost.
  - You are about to drop the column `cigarettesPerDay` on the `PatientAnamnesis` table. All the data in the column will be lost.
  - You are about to drop the column `exerciseFrequency` on the `PatientAnamnesis` table. All the data in the column will be lost.
  - You are about to drop the column `familyDiseases` on the `PatientAnamnesis` table. All the data in the column will be lost.
  - You are about to drop the column `hasAllergies` on the `PatientAnamnesis` table. All the data in the column will be lost.
  - You are about to drop the column `hasDiseases` on the `PatientAnamnesis` table. All the data in the column will be lost.
  - You are about to drop the column `hasMedications` on the `PatientAnamnesis` table. All the data in the column will be lost.
  - You are about to drop the column `hasSurgeries` on the `PatientAnamnesis` table. All the data in the column will be lost.
  - You are about to drop the column `previousTreatments` on the `PatientAnamnesis` table. All the data in the column will be lost.
  - You are about to drop the column `treatmentGoals` on the `PatientAnamnesis` table. All the data in the column will be lost.
  - You are about to drop the column `paymentMethod` on the `Sale` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ClinicalEvolutionSession" ADD COLUMN     "bodyMeasurements" TEXT,
ADD COLUMN     "signatureImage" TEXT;

-- AlterTable
ALTER TABLE "FinancialTransaction" ADD COLUMN     "patientId" TEXT,
ADD COLUMN     "profit" DOUBLE PRECISION,
ADD COLUMN     "saleId" TEXT,
ALTER COLUMN "date" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "InventoryItem" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "PatientAnamnesis" DROP COLUMN "alcoholFrequency",
DROP COLUMN "cigarettesPerDay",
DROP COLUMN "exerciseFrequency",
DROP COLUMN "familyDiseases",
DROP COLUMN "hasAllergies",
DROP COLUMN "hasDiseases",
DROP COLUMN "hasMedications",
DROP COLUMN "hasSurgeries",
DROP COLUMN "previousTreatments",
DROP COLUMN "treatmentGoals",
ADD COLUMN     "allergicToEgg" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "allergicToSeafood" TEXT,
ADD COLUMN     "bloodPressure" TEXT,
ADD COLUMN     "consentSigned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "degenerativeDisease" TEXT,
ADD COLUMN     "dentalAnesthesia" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "dentalAnesthesiaReaction" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasHerpes" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "intendsSurgery" TEXT,
ADD COLUMN     "intendsToLoseWeight" TEXT,
ADD COLUMN     "keloidTendency" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "permanentImplants" TEXT,
ADD COLUMN     "pregnantOrNursing" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "previousBotox" TEXT,
ADD COLUMN     "previousFillers" TEXT,
ADD COLUMN     "previousPregnancies" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "procedureReaction" TEXT,
ADD COLUMN     "recentTreatmentOrVaccine" TEXT,
ADD COLUMN     "takingRoacutan" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "usesAspirin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "usesCorticosteroids" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "weightLoss" TEXT;

-- AlterTable
ALTER TABLE "PatientContract" ADD COLUMN     "signatureImage" TEXT,
ADD COLUMN     "signatureName" TEXT;

-- AlterTable
ALTER TABLE "Sale" DROP COLUMN "paymentMethod";

-- CreateTable
CREATE TABLE "ClinicalEvolution" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'MANUAL',
    "important" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClinicalEvolution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalePayment" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "method" "ContractPaymentMethod" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalePayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClinicalEvolution_patientId_idx" ON "ClinicalEvolution"("patientId");

-- CreateIndex
CREATE INDEX "SalePayment_saleId_idx" ON "SalePayment"("saleId");

-- CreateIndex
CREATE INDEX "FinancialTransaction_patientId_idx" ON "FinancialTransaction"("patientId");

-- CreateIndex
CREATE INDEX "FinancialTransaction_saleId_idx" ON "FinancialTransaction"("saleId");

-- CreateIndex
CREATE INDEX "Patient_cpf_idx" ON "Patient"("cpf");

-- CreateIndex
CREATE INDEX "Patient_phone_idx" ON "Patient"("phone");

-- CreateIndex
CREATE INDEX "Sale_createdAt_idx" ON "Sale"("createdAt");

-- AddForeignKey
ALTER TABLE "ClinicalEvolution" ADD CONSTRAINT "ClinicalEvolution_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalePayment" ADD CONSTRAINT "SalePayment_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialTransaction" ADD CONSTRAINT "FinancialTransaction_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialTransaction" ADD CONSTRAINT "FinancialTransaction_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;
