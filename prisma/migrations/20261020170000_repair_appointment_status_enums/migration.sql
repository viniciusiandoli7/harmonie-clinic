-- Reparo idempotente dos enums usados pela agenda.
-- Alguns bancos de produção antigos podem ter recebido a coluna `status`
-- antes dos novos estados operacionais (confirmada, faltou, remarcou etc.).
-- ADD VALUE IF NOT EXISTS preserva todos os dados existentes.

ALTER TYPE "AppointmentStatus" ADD VALUE IF NOT EXISTS 'CONFIRMED';
ALTER TYPE "AppointmentStatus" ADD VALUE IF NOT EXISTS 'NO_SHOW';
ALTER TYPE "AppointmentStatus" ADD VALUE IF NOT EXISTS 'RESCHEDULED';
ALTER TYPE "AppointmentStatus" ADD VALUE IF NOT EXISTS 'RETURN';
ALTER TYPE "AppointmentStatus" ADD VALUE IF NOT EXISTS 'FIT_IN';

ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'PENDING';
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'PAID';
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'CANCELED';
