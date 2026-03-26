-- CreateEnum
CREATE TYPE "ConsentDocumentStatus" AS ENUM ('PENDING', 'SIGNED', 'CANCELED');

-- CreateTable
CREATE TABLE "TreatmentConsentTemplate" (
    "id" TEXT NOT NULL,
    "treatmentName" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TreatmentConsentTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientConsentDocument" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "treatmentName" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" "ConsentDocumentStatus" NOT NULL DEFAULT 'PENDING',
    "signedAt" TIMESTAMP(3),
    "signatureName" TEXT,
    "signatureIp" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PatientConsentDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TreatmentConsentTemplate_treatmentName_key" ON "TreatmentConsentTemplate"("treatmentName");

-- CreateIndex
CREATE UNIQUE INDEX "PatientConsentDocument_token_key" ON "PatientConsentDocument"("token");

-- CreateIndex
CREATE INDEX "PatientConsentDocument_patientId_idx" ON "PatientConsentDocument"("patientId");

-- CreateIndex
CREATE INDEX "PatientConsentDocument_token_idx" ON "PatientConsentDocument"("token");

-- AddForeignKey
ALTER TABLE "PatientConsentDocument" ADD CONSTRAINT "PatientConsentDocument_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
