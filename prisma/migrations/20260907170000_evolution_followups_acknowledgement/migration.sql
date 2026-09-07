-- Permite múltiplos registros de acompanhamento dentro de um mesmo tratamento
-- sem alterar indevidamente a quantidade de sessões compradas/realizadas.
ALTER TABLE "ClinicalEvolutionSession"
  ADD COLUMN IF NOT EXISTS "entryType" TEXT NOT NULL DEFAULT 'SESSION',
  ADD COLUMN IF NOT EXISTS "countsTowardSession" BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS "ClinicalEvolutionSession_planId_sessionDate_idx"
  ON "ClinicalEvolutionSession"("planId", "sessionDate");
