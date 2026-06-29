-- Campos para metas com período personalizado

ALTER TABLE "BusinessGoal"
ADD COLUMN IF NOT EXISTS "startDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "endDate" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "BusinessGoal_startDate_idx" ON "BusinessGoal"("startDate");
CREATE INDEX IF NOT EXISTS "BusinessGoal_endDate_idx" ON "BusinessGoal"("endDate");
