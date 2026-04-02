/*
  Warnings:

  - You are about to drop the column `updatedAt` on the `BlockedTime` table. All the data in the column will be lost.
  - You are about to drop the column `bodyMeasurements` on the `ClinicalEvolutionSession` table. All the data in the column will be lost.
  - You are about to drop the column `clinicCommissionPct` on the `FinancialTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `clinicCommissionValue` on the `FinancialTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `grossAmount` on the `FinancialTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `FinancialTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `pendingAmount` on the `FinancialTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `receivedAmount` on the `FinancialTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `concerns` on the `PatientAnamnesis` table. All the data in the column will be lost.
  - You are about to drop the column `skinConcerns` on the `PatientAnamnesis` table. All the data in the column will be lost.
  - You are about to drop the column `discount` on the `PatientContract` table. All the data in the column will be lost.
  - You are about to drop the column `paymentDetails` on the `PatientContract` table. All the data in the column will be lost.
  - You are about to drop the column `paymentMethod` on the `PatientContract` table. All the data in the column will be lost.
  - You are about to drop the column `signatureIp` on the `PatientContract` table. All the data in the column will be lost.
  - You are about to drop the column `signatureName` on the `PatientContract` table. All the data in the column will be lost.
  - You are about to drop the column `signedAt` on the `PatientContract` table. All the data in the column will be lost.
  - You are about to drop the column `subtotal` on the `PatientContract` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Professional` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Professional` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `Sale` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `SaleItem` table. All the data in the column will be lost.
  - You are about to drop the column `serviceName` on the `SaleItem` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Appointment" DROP CONSTRAINT "Appointment_patientId_fkey";

-- DropForeignKey
ALTER TABLE "ClinicalEvolutionPlan" DROP CONSTRAINT "ClinicalEvolutionPlan_patientId_fkey";

-- DropForeignKey
ALTER TABLE "PatientAnamnesis" DROP CONSTRAINT "PatientAnamnesis_patientId_fkey";

-- DropIndex
DROP INDEX "PatientConsentDocument_token_idx";

-- DropIndex
DROP INDEX "PatientContract_token_idx";

-- DropIndex
DROP INDEX "Sale_serviceId_idx";

-- DropIndex
DROP INDEX "SaleItem_professionalId_idx";

-- AlterTable
ALTER TABLE "BlockedTime" DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "ClinicalEvolutionSession" DROP COLUMN "bodyMeasurements";

-- AlterTable
ALTER TABLE "FinancialTransaction" DROP COLUMN "clinicCommissionPct",
DROP COLUMN "clinicCommissionValue",
DROP COLUMN "grossAmount",
DROP COLUMN "notes",
DROP COLUMN "pendingAmount",
DROP COLUMN "receivedAmount";

-- AlterTable
ALTER TABLE "PatientAnamnesis" DROP COLUMN "concerns",
DROP COLUMN "skinConcerns",
ADD COLUMN     "mainComplaint" TEXT,
ADD COLUMN     "profession" TEXT,
ADD COLUMN     "sunExposure" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "PatientContract" DROP COLUMN "discount",
DROP COLUMN "paymentDetails",
DROP COLUMN "paymentMethod",
DROP COLUMN "signatureIp",
DROP COLUMN "signatureName",
DROP COLUMN "signedAt",
DROP COLUMN "subtotal";

-- AlterTable
ALTER TABLE "Professional" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "Sale" DROP COLUMN "quantity";

-- AlterTable
ALTER TABLE "SaleItem" DROP COLUMN "notes",
DROP COLUMN "serviceName";

-- DropEnum
DROP TYPE "PaymentMethod";

-- CreateTable
CREATE TABLE "MedicalRecord" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicalRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MedicalRecord_patientId_idx" ON "MedicalRecord"("patientId");

-- CreateIndex
CREATE INDEX "Patient_name_idx" ON "Patient"("name");

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientAnamnesis" ADD CONSTRAINT "PatientAnamnesis_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalEvolutionPlan" ADD CONSTRAINT "ClinicalEvolutionPlan_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
