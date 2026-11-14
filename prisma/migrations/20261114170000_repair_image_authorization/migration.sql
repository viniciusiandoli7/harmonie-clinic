-- Reparo idempotente do módulo de autorização de imagem.
-- Não remove, reseta ou altera registros clínicos existentes.

DO $$ BEGIN
  CREATE TYPE "ImageAuthorizationStatus" AS ENUM ('PENDING', 'SIGNED', 'REVOKED', 'CANCELED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TYPE "ImageAuthorizationStatus" ADD VALUE IF NOT EXISTS 'PENDING';
ALTER TYPE "ImageAuthorizationStatus" ADD VALUE IF NOT EXISTS 'SIGNED';
ALTER TYPE "ImageAuthorizationStatus" ADD VALUE IF NOT EXISTS 'REVOKED';
ALTER TYPE "ImageAuthorizationStatus" ADD VALUE IF NOT EXISTS 'CANCELED';

CREATE TABLE IF NOT EXISTS "PatientImageAuthorization" (
  "id" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "title" TEXT NOT NULL DEFAULT 'Termo de Autorização de Uso de Imagem e Voz',
  "status" "ImageAuthorizationStatus" NOT NULL DEFAULT 'PENDING',
  "contentTypesJson" JSONB,
  "channelsJson" JSONB,
  "signatureName" TEXT,
  "signatureImage" TEXT,
  "signatureIp" TEXT,
  "signedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "revokedReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PatientImageAuthorization_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "PatientImageAuthorization" ADD COLUMN IF NOT EXISTS "token" TEXT;
ALTER TABLE "PatientImageAuthorization" ADD COLUMN IF NOT EXISTS "patientId" TEXT;
ALTER TABLE "PatientImageAuthorization" ADD COLUMN IF NOT EXISTS "title" TEXT DEFAULT 'Termo de Autorização de Uso de Imagem e Voz';
ALTER TABLE "PatientImageAuthorization" ADD COLUMN IF NOT EXISTS "status" "ImageAuthorizationStatus" DEFAULT 'PENDING';
ALTER TABLE "PatientImageAuthorization" ADD COLUMN IF NOT EXISTS "contentTypesJson" JSONB;
ALTER TABLE "PatientImageAuthorization" ADD COLUMN IF NOT EXISTS "channelsJson" JSONB;
ALTER TABLE "PatientImageAuthorization" ADD COLUMN IF NOT EXISTS "signatureName" TEXT;
ALTER TABLE "PatientImageAuthorization" ADD COLUMN IF NOT EXISTS "signatureImage" TEXT;
ALTER TABLE "PatientImageAuthorization" ADD COLUMN IF NOT EXISTS "signatureIp" TEXT;
ALTER TABLE "PatientImageAuthorization" ADD COLUMN IF NOT EXISTS "signedAt" TIMESTAMP(3);
ALTER TABLE "PatientImageAuthorization" ADD COLUMN IF NOT EXISTS "revokedAt" TIMESTAMP(3);
ALTER TABLE "PatientImageAuthorization" ADD COLUMN IF NOT EXISTS "revokedReason" TEXT;
ALTER TABLE "PatientImageAuthorization" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "PatientImageAuthorization" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX IF NOT EXISTS "PatientImageAuthorization_token_key" ON "PatientImageAuthorization"("token");
CREATE INDEX IF NOT EXISTS "PatientImageAuthorization_patientId_idx" ON "PatientImageAuthorization"("patientId");
CREATE INDEX IF NOT EXISTS "PatientImageAuthorization_patientId_status_idx" ON "PatientImageAuthorization"("patientId", "status");
CREATE INDEX IF NOT EXISTS "PatientImageAuthorization_createdAt_idx" ON "PatientImageAuthorization"("createdAt");

DO $$ BEGIN
  ALTER TABLE "PatientImageAuthorization"
    ADD CONSTRAINT "PatientImageAuthorization_patientId_fkey"
    FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
