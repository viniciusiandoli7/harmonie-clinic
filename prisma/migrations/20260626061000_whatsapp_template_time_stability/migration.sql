-- Stabilizes WhatsApp template creation and adds an optional default time.
-- The application also performs this ALTER defensively at runtime to avoid breaking local development.
ALTER TABLE "WhatsAppTemplate"
  ADD COLUMN IF NOT EXISTS "defaultTime" TEXT;
