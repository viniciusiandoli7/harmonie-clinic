-- AlterTable
ALTER TABLE "FinancialTransaction" ADD COLUMN     "clinicCommissionPct" DOUBLE PRECISION,
ADD COLUMN     "clinicCommissionValue" DOUBLE PRECISION,
ADD COLUMN     "clinicProfit" DOUBLE PRECISION,
ADD COLUMN     "grossAmount" DOUBLE PRECISION,
ADD COLUMN     "operationalCost" DOUBLE PRECISION,
ADD COLUMN     "pendingAmount" DOUBLE PRECISION,
ADD COLUMN     "professionalValue" DOUBLE PRECISION,
ADD COLUMN     "receivedAmount" DOUBLE PRECISION;
