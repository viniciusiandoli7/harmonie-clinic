-- Inventory 15 clinical-control fields

ALTER TABLE "InventoryItem"
ADD COLUMN IF NOT EXISTS "category" TEXT,
ADD COLUMN IF NOT EXISTS "linkedProcedure" TEXT,
ADD COLUMN IF NOT EXISTS "entryQuantity" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "entryDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "applicationMaterials" TEXT,
ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'DISPONIVEL',
ADD COLUMN IF NOT EXISTS "patientName" TEXT,
ADD COLUMN IF NOT EXISTS "exitDate" TIMESTAMP(3);

UPDATE "InventoryItem"
SET "entryQuantity" = "quantity"
WHERE "entryQuantity" = 0 AND "quantity" > 0;

CREATE INDEX IF NOT EXISTS "InventoryItem_category_idx" ON "InventoryItem"("category");
CREATE INDEX IF NOT EXISTS "InventoryItem_linkedProcedure_idx" ON "InventoryItem"("linkedProcedure");
CREATE INDEX IF NOT EXISTS "InventoryItem_status_idx" ON "InventoryItem"("status");
CREATE INDEX IF NOT EXISTS "InventoryItem_patientName_idx" ON "InventoryItem"("patientName");
