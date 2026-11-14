import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Detecta exclusivamente erros que indicam divergência de schema no módulo
 * de autorização de imagem. Não trata indisponibilidade de conexão nem outros
 * erros de banco como problema de migration.
 */
export function isImageAuthorizationSchemaError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2021" || error.code === "P2022") return true;

    // Queries raw podem encapsular o código PostgreSQL em P2010.
    if (error.code === "P2010") {
      const dbCode = String((error.meta as Record<string, unknown> | undefined)?.code ?? "");
      if (["42P01", "42703", "42704"].includes(dbCode)) return true;
    }
  }

  const message = error instanceof Error ? error.message : String(error ?? "");
  return (
    /PatientImageAuthorization/i.test(message) &&
    /(does not exist|não existe|unknown table|unknown column|relation .* does not exist|column .* does not exist|type .* does not exist|P2021|P2022|42P01|42703|42704)/i.test(message)
  );
}

/**
 * Reparo idempotente e restrito ao módulo de autorização de imagem.
 * Só deve ser chamado depois de um erro de schema detectado. Não remove,
 * reseta ou altera registros existentes.
 */
export async function repairImageAuthorizationSchema(): Promise<void> {
  await prisma.$executeRawUnsafe(`
DO $$ BEGIN
  CREATE TYPE "ImageAuthorizationStatus" AS ENUM ('PENDING', 'SIGNED', 'REVOKED', 'CANCELED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
  `);

  // Garante valores do enum inclusive em bancos onde o tipo já existia incompleto.
  await prisma.$executeRawUnsafe(`ALTER TYPE "ImageAuthorizationStatus" ADD VALUE IF NOT EXISTS 'PENDING'`);
  await prisma.$executeRawUnsafe(`ALTER TYPE "ImageAuthorizationStatus" ADD VALUE IF NOT EXISTS 'SIGNED'`);
  await prisma.$executeRawUnsafe(`ALTER TYPE "ImageAuthorizationStatus" ADD VALUE IF NOT EXISTS 'REVOKED'`);
  await prisma.$executeRawUnsafe(`ALTER TYPE "ImageAuthorizationStatus" ADD VALUE IF NOT EXISTS 'CANCELED'`);

  await prisma.$executeRawUnsafe(`
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
)
  `);

  // Se a tabela já existia parcialmente, completa somente o que estiver faltando.
  await prisma.$executeRawUnsafe(`ALTER TABLE "PatientImageAuthorization" ADD COLUMN IF NOT EXISTS "token" TEXT`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "PatientImageAuthorization" ADD COLUMN IF NOT EXISTS "patientId" TEXT`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "PatientImageAuthorization" ADD COLUMN IF NOT EXISTS "title" TEXT DEFAULT 'Termo de Autorização de Uso de Imagem e Voz'`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "PatientImageAuthorization" ADD COLUMN IF NOT EXISTS "status" "ImageAuthorizationStatus" DEFAULT 'PENDING'`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "PatientImageAuthorization" ADD COLUMN IF NOT EXISTS "contentTypesJson" JSONB`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "PatientImageAuthorization" ADD COLUMN IF NOT EXISTS "channelsJson" JSONB`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "PatientImageAuthorization" ADD COLUMN IF NOT EXISTS "signatureName" TEXT`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "PatientImageAuthorization" ADD COLUMN IF NOT EXISTS "signatureImage" TEXT`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "PatientImageAuthorization" ADD COLUMN IF NOT EXISTS "signatureIp" TEXT`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "PatientImageAuthorization" ADD COLUMN IF NOT EXISTS "signedAt" TIMESTAMP(3)`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "PatientImageAuthorization" ADD COLUMN IF NOT EXISTS "revokedAt" TIMESTAMP(3)`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "PatientImageAuthorization" ADD COLUMN IF NOT EXISTS "revokedReason" TEXT`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "PatientImageAuthorization" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "PatientImageAuthorization" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP`);

  // Não força NOT NULL em colunas de uma tabela legada parcialmente criada para
  // evitar qualquer alteração destrutiva. Novos registros continuam completos.
  await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "PatientImageAuthorization_token_key" ON "PatientImageAuthorization"("token")`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "PatientImageAuthorization_patientId_idx" ON "PatientImageAuthorization"("patientId")`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "PatientImageAuthorization_patientId_status_idx" ON "PatientImageAuthorization"("patientId", "status")`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "PatientImageAuthorization_createdAt_idx" ON "PatientImageAuthorization"("createdAt")`);

  await prisma.$executeRawUnsafe(`
DO $$ BEGIN
  ALTER TABLE "PatientImageAuthorization"
    ADD CONSTRAINT "PatientImageAuthorization_patientId_fkey"
    FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
  `);
}
