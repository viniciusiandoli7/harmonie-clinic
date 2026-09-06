-- Migration de reparo idempotente.
-- Alguns ambientes de produção ficaram com o histórico da revisão contratual
-- sem as colunas físicas correspondentes. ADD COLUMN IF NOT EXISTS torna este
-- reparo seguro tanto para bancos atualizados quanto para bancos divergentes.
ALTER TABLE "PatientContract"
  ADD COLUMN IF NOT EXISTS "contractNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "validUntil" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "PatientContract_contractNumber_key"
  ON "PatientContract"("contractNumber");
