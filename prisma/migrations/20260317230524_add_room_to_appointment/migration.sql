-- CreateEnum
CREATE TYPE "Room" AS ENUM ('A', 'B');

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "room" "Room" NOT NULL DEFAULT 'A';

-- CreateIndex
CREATE INDEX "Appointment_date_idx" ON "Appointment"("date");

-- CreateIndex
CREATE INDEX "Appointment_patientId_idx" ON "Appointment"("patientId");

-- CreateIndex
CREATE INDEX "BlockedTime_start_end_idx" ON "BlockedTime"("start", "end");

-- CreateIndex
CREATE INDEX "FinancialTransaction_date_idx" ON "FinancialTransaction"("date");
