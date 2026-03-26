-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('PENDING', 'SIGNED', 'CANCELED');

-- CreateEnum
CREATE TYPE "ContractPaymentMethod" AS ENUM ('CREDIT_CARD', 'DEBIT_CARD', 'PIX', 'CASH', 'BANK_SLIP', 'BANK_TRANSFER', 'OTHER');

-- CreateTable
CREATE TABLE "PatientContract" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paymentMethod" "ContractPaymentMethod" NOT NULL DEFAULT 'OTHER',
    "paymentDetails" TEXT,
    "itemsJson" JSONB NOT NULL,
    "status" "ContractStatus" NOT NULL DEFAULT 'PENDING',
    "signedAt" TIMESTAMP(3),
    "signatureName" TEXT,
    "signatureIp" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PatientContract_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PatientContract_token_key" ON "PatientContract"("token");

-- CreateIndex
CREATE INDEX "PatientContract_patientId_idx" ON "PatientContract"("patientId");

-- CreateIndex
CREATE INDEX "PatientContract_token_idx" ON "PatientContract"("token");

-- AddForeignKey
ALTER TABLE "PatientContract" ADD CONSTRAINT "PatientContract_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
