-- CreateTable
CREATE TABLE "Treatment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Treatment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Treatment_name_key" ON "Treatment"("name");

-- Add treatmentId column to PatientConsentDocument
ALTER TABLE "PatientConsentDocument" ADD COLUMN "treatmentId" TEXT;

-- Insert default treatment
INSERT INTO "Treatment" (id, name, template, "createdAt", "updatedAt")
VALUES ('default-ultrasound-id', 'Ultrassom Micro e Macro Focado', 'TERMO DE CONSENTIMENTO INFORMADO PARA ULTRASSOM MICRO E MACRO FOCADO

Eu, [NOME_DO_PACIENTE], portador do CPF [CPF_DO_PACIENTE], residente em [ENDEREÇO_DO_PACIENTE], telefone [TELEFONE_DO_PACIENTE], declaro que:

1. Fui devidamente informado(a) sobre o procedimento de ultrassom micro e macro focado, incluindo seus benefícios, riscos e possíveis complicações.

2. Compreendo que este tratamento visa melhorar a aparência da pele através da estimulação do colágeno e elastina.

3. Estou ciente dos possíveis efeitos colaterais como vermelhidão temporária, inchaço e sensibilidade na área tratada.

4. Comprometo-me a seguir todas as orientações pré e pós-procedimento fornecidas pela equipe médica.

5. Declaro que não tenho contraindicações para este tratamento e que informei todas as minhas condições de saúde relevantes.

Data: _______________
Assinatura: ___________________________', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Update existing records to use the default treatment
UPDATE "PatientConsentDocument" SET "treatmentId" = 'default-ultrasound-id' WHERE "treatmentId" IS NULL;

-- Make treatmentId NOT NULL
ALTER TABLE "PatientConsentDocument" ALTER COLUMN "treatmentId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "PatientConsentDocument" ADD CONSTRAINT "PatientConsentDocument_treatmentId_fkey" FOREIGN KEY ("treatmentId") REFERENCES "Treatment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "PatientConsentDocument_treatmentId_idx" ON "PatientConsentDocument"("treatmentId");

-- DropColumn (this will be done after updating all references)
-- ALTER TABLE "PatientConsentDocument" DROP COLUMN "treatmentName";