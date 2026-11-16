-- Reparo idempotente dos enums da agenda (v2).
-- Esta migration NÃO altera nem remove agendamentos existentes.
-- Ela apenas garante que todos os status usados pela aplicação existam no PostgreSQL.

ALTER TYPE "AppointmentStatus" ADD VALUE IF NOT EXISTS 'SCHEDULED';
ALTER TYPE "AppointmentStatus" ADD VALUE IF NOT EXISTS 'CONFIRMED';
ALTER TYPE "AppointmentStatus" ADD VALUE IF NOT EXISTS 'COMPLETED';
ALTER TYPE "AppointmentStatus" ADD VALUE IF NOT EXISTS 'NO_SHOW';
ALTER TYPE "AppointmentStatus" ADD VALUE IF NOT EXISTS 'RESCHEDULED';
ALTER TYPE "AppointmentStatus" ADD VALUE IF NOT EXISTS 'CANCELED';
ALTER TYPE "AppointmentStatus" ADD VALUE IF NOT EXISTS 'RETURN';
ALTER TYPE "AppointmentStatus" ADD VALUE IF NOT EXISTS 'FIT_IN';

ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'PENDING';
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'PAID';
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'CANCELED';
