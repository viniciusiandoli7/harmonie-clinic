ALTER TABLE "PatientContract"
  ADD COLUMN IF NOT EXISTS "contractNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "validUntil" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "PatientContract_contractNumber_key"
  ON "PatientContract"("contractNumber");
