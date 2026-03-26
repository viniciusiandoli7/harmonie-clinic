-- CreateEnum
CREATE TYPE "ClinicalEvolutionPlanStatus" AS ENUM ('ACTIVE', 'FINISHED', 'CANCELED');

-- CreateTable
CREATE TABLE "ClinicalEvolutionPlan" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "treatmentName" TEXT NOT NULL,
    "packageName" TEXT,
    "totalSessions" INTEGER NOT NULL DEFAULT 1,
    "completedSessions" INTEGER NOT NULL DEFAULT 0,
    "status" "ClinicalEvolutionPlanStatus" NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "goals" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClinicalEvolutionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicalEvolutionSession" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "sessionNumber" INTEGER NOT NULL,
    "sessionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "performedProcedure" TEXT,
    "bodyMeasurements" TEXT,
    "clinicalNotes" TEXT,
    "patientSignatureName" TEXT,
    "signedAt" TIMESTAMP(3),
    "imagesJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClinicalEvolutionSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClinicalEvolutionPlan_patientId_idx" ON "ClinicalEvolutionPlan"("patientId");

-- CreateIndex
CREATE INDEX "ClinicalEvolutionSession_planId_idx" ON "ClinicalEvolutionSession"("planId");

-- AddForeignKey
ALTER TABLE "ClinicalEvolutionPlan" ADD CONSTRAINT "ClinicalEvolutionPlan_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalEvolutionSession" ADD CONSTRAINT "ClinicalEvolutionSession_planId_fkey" FOREIGN KEY ("planId") REFERENCES "ClinicalEvolutionPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
