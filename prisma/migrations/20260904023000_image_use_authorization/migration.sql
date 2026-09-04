DO $$ BEGIN
  CREATE TYPE "ImageAuthorizationStatus" AS ENUM ('PENDING', 'SIGNED', 'REVOKED', 'CANCELED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

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

CREATE UNIQUE INDEX IF NOT EXISTS "PatientImageAuthorization_token_key" ON "PatientImageAuthorization"("token");
CREATE INDEX IF NOT EXISTS "PatientImageAuthorization_patientId_idx" ON "PatientImageAuthorization"("patientId");
CREATE INDEX IF NOT EXISTS "PatientImageAuthorization_patientId_status_idx" ON "PatientImageAuthorization"("patientId", "status");
CREATE INDEX IF NOT EXISTS "PatientImageAuthorization_createdAt_idx" ON "PatientImageAuthorization"("createdAt");

DO $$ BEGIN
  ALTER TABLE "PatientImageAuthorization"
    ADD CONSTRAINT "PatientImageAuthorization_patientId_fkey"
    FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
