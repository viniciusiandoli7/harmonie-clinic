/*
  Warnings:

  - You are about to drop the column `treatmentName` on the `PatientConsentDocument` table. All the data in the column will be lost.
  - You are about to drop the `TreatmentConsentTemplate` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WhatsappMessageLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WhatsappReminderJob` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WhatsappTemplate` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[cpf]` on the table `Patient` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'PIX', 'BANK_TRANSFER', 'OTHER');

-- AlterTable
ALTER TABLE "Patient" ADD COLUMN     "address" TEXT,
ADD COLUMN     "addressComplement" TEXT,
ADD COLUMN     "addressNumber" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "cpf" TEXT,
ADD COLUMN     "crmSource" TEXT,
ADD COLUMN     "interestProcedure" TEXT,
ADD COLUMN     "neighborhood" TEXT,
ADD COLUMN     "rg" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "zipCode" TEXT;

-- AlterTable
ALTER TABLE "PatientConsentDocument" DROP COLUMN "treatmentName";

-- DropTable
DROP TABLE "TreatmentConsentTemplate";

-- DropTable
DROP TABLE "WhatsappMessageLog";

-- DropTable
DROP TABLE "WhatsappReminderJob";

-- DropTable
DROP TABLE "WhatsappTemplate";

-- CreateTable
CREATE TABLE "PatientAnamnesis" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "hasAllergies" BOOLEAN NOT NULL DEFAULT false,
    "allergies" TEXT,
    "hasMedications" BOOLEAN NOT NULL DEFAULT false,
    "medications" TEXT,
    "hasSurgeries" BOOLEAN NOT NULL DEFAULT false,
    "surgeries" TEXT,
    "hasDiseases" BOOLEAN NOT NULL DEFAULT false,
    "diseases" TEXT,
    "smoker" BOOLEAN NOT NULL DEFAULT false,
    "cigarettesPerDay" INTEGER,
    "drinksAlcohol" BOOLEAN NOT NULL DEFAULT false,
    "alcoholFrequency" TEXT,
    "exercises" BOOLEAN NOT NULL DEFAULT false,
    "exerciseFrequency" TEXT,
    "familyDiseases" TEXT,
    "skinCareRoutine" TEXT,
    "previousTreatments" TEXT,
    "skinConcerns" TEXT,
    "treatmentGoals" TEXT,
    "concerns" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientAnamnesis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Professional" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "commission" DOUBLE PRECISION NOT NULL DEFAULT 0.25,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Professional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sale" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "price" DOUBLE PRECISION NOT NULL,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "finalPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paymentMethod" "ContractPaymentMethod" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleItem" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "professionalId" TEXT,
    "productName" TEXT NOT NULL,
    "serviceName" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "commission" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,

    CONSTRAINT "SaleItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PatientAnamnesis_patientId_key" ON "PatientAnamnesis"("patientId");

-- CreateIndex
CREATE INDEX "PatientAnamnesis_patientId_idx" ON "PatientAnamnesis"("patientId");

-- CreateIndex
CREATE INDEX "Sale_patientId_idx" ON "Sale"("patientId");

-- CreateIndex
CREATE INDEX "Sale_serviceId_idx" ON "Sale"("serviceId");

-- CreateIndex
CREATE INDEX "Sale_professionalId_idx" ON "Sale"("professionalId");

-- CreateIndex
CREATE INDEX "SaleItem_saleId_idx" ON "SaleItem"("saleId");

-- CreateIndex
CREATE INDEX "SaleItem_professionalId_idx" ON "SaleItem"("professionalId");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_cpf_key" ON "Patient"("cpf");

-- AddForeignKey
ALTER TABLE "PatientAnamnesis" ADD CONSTRAINT "PatientAnamnesis_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Treatment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE SET NULL ON UPDATE CASCADE;
