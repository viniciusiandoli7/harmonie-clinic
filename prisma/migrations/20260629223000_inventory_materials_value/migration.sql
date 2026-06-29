-- Valor numérico de materiais de aplicação no estoque

ALTER TABLE "InventoryItem"
ADD COLUMN IF NOT EXISTS "applicationMaterialsValue" DOUBLE PRECISION NOT NULL DEFAULT 0;
