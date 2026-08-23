-- Índices para os caminhos mais utilizados no sistema clínico.

-- Campos de anamnese que existiam no schema de runtime, mas ainda não tinham migration explícita.
ALTER TABLE "PatientAnamnesis"
  ADD COLUMN IF NOT EXISTS "previousAestheticProcedures" TEXT,
  ADD COLUMN IF NOT EXISTS "roacutanDetails" TEXT,
  ADD COLUMN IF NOT EXISTS "waterIntake" TEXT,
  ADD COLUMN IF NOT EXISTS "cancerHistory" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "circulationProblems" TEXT;

-- Esta migration substitui verificações de índice que antes aconteciam em runtime.

CREATE INDEX IF NOT EXISTS "Patient_isActive_name_idx" ON "Patient"("isActive", "name");
CREATE INDEX IF NOT EXISTS "Patient_crmStatus_idx" ON "Patient"("crmStatus");

CREATE INDEX IF NOT EXISTS "Appointment_room_date_idx" ON "Appointment"("room", "date");
CREATE INDEX IF NOT EXISTS "Appointment_patientId_date_idx" ON "Appointment"("patientId", "date");
CREATE INDEX IF NOT EXISTS "Appointment_status_date_idx" ON "Appointment"("status", "date");

CREATE INDEX IF NOT EXISTS "ClinicalEvolution_patientId_createdAt_idx" ON "ClinicalEvolution"("patientId", "createdAt");
CREATE INDEX IF NOT EXISTS "Sale_patientId_createdAt_idx" ON "Sale"("patientId", "createdAt");
CREATE INDEX IF NOT EXISTS "FinancialTransaction_status_type_date_idx" ON "FinancialTransaction"("status", "type", "date");
CREATE INDEX IF NOT EXISTS "FinancialTransaction_patientId_date_idx" ON "FinancialTransaction"("patientId", "date");
CREATE INDEX IF NOT EXISTS "FinancialInstallment_status_dueDate_idx" ON "FinancialInstallment"("status", "dueDate");
CREATE INDEX IF NOT EXISTS "PatientPhoto_patientId_takenAt_idx" ON "PatientPhoto"("patientId", "takenAt");

-- Mensagens padrão passam a ser semeadas no deploy, e não a cada abertura da tela.
INSERT INTO "WhatsAppTemplate" ("id", "category", "title", "content", "defaultTime", "isActive", "createdAt", "updatedAt")
SELECT * FROM (VALUES
  ('seed-wa-confirmacao', 'Confirmação', 'Confirmação de consulta', 'Oi, [primeiroNome]. Tudo bem? Passando para confirmar sua consulta com a Dra. Mariana no dia [data], às [horario]. Qualquer dúvida, pode me chamar por aqui.', NULL::TEXT, true, NOW(), NOW()),
  ('seed-wa-pre', 'Pré-procedimento', 'Orientações pré-procedimento', 'Oi, [primeiroNome]. Para o seu [procedimento], venha sem maquiagem na região e avise caso tenha usado algum medicamento novo, vacina recente, infecção, herpes ativa ou alguma alteração de saúde.', NULL::TEXT, true, NOW(), NOW()),
  ('seed-wa-pos', 'Pós-procedimento', 'Acompanhamento pós', 'Oi, [primeiroNome]. Tudo bem? A Dra. Mariana pediu para saber como você está depois do [procedimento]. Caso tenha qualquer desconforto fora do esperado, nos avise por aqui.', NULL::TEXT, true, NOW(), NOW()),
  ('seed-wa-retorno', 'Retorno', 'Lembrete de retorno', 'Oi, [primeiroNome]. Tudo bem? Está chegando o momento do seu retorno/acompanhamento de [procedimento]. Podemos verificar um horário para você?', NULL::TEXT, true, NOW(), NOW()),
  ('seed-wa-reativacao', 'Reativação', 'Paciente inativa', 'Oi, [primeiroNome]. Tudo bem? Aqui é da clínica da Dra. Mariana. Faz um tempinho desde seu último atendimento e queríamos saber como você está. Podemos agendar uma avaliação para acompanhar sua evolução e ajustar seu plano de cuidados?', NULL::TEXT, true, NOW(), NOW()),
  ('seed-wa-avaliacao', 'Avaliação', 'Avaliação que não fechou', 'Oi, [primeiroNome]. Tudo bem? Passando para saber se ficou alguma dúvida sobre o plano que a Dra. Mariana montou para você. Podemos conversar e ajustar as etapas conforme seu momento.', NULL::TEXT, true, NOW(), NOW()),
  ('seed-wa-feedback', 'Feedback', 'Pedido de feedback', 'Oi, [primeiroNome]. Como você se sentiu com sua experiência na clínica? Seu feedback ajuda muito a Dra. Mariana a manter um atendimento cada vez mais cuidadoso.', NULL::TEXT, true, NOW(), NOW()),
  ('seed-wa-cobranca', 'Cobrança', 'Cobrança delicada', 'Oi, [primeiroNome]. Tudo bem? Identificamos uma pendência em aberto no sistema da clínica. Pode nos chamar por aqui para conferirmos juntas a melhor forma de regularizar?', NULL::TEXT, true, NOW(), NOW())
) AS seed("id", "category", "title", "content", "defaultTime", "isActive", "createdAt", "updatedAt")
WHERE NOT EXISTS (SELECT 1 FROM "WhatsAppTemplate" LIMIT 1)
ON CONFLICT ("id") DO NOTHING;
