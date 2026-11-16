import { prisma } from "@/lib/prisma";

const APPOINTMENT_STATUS_VALUES = [
  "SCHEDULED",
  "CONFIRMED",
  "COMPLETED",
  "NO_SHOW",
  "RESCHEDULED",
  "CANCELED",
  "RETURN",
  "FIT_IN",
] as const;

const PAYMENT_STATUS_VALUES = ["PENDING", "PAID", "CANCELED"] as const;

export function isAppointmentStatusSchemaError(error: unknown) {
  const message = String((error as any)?.message ?? error ?? "");
  return (
    /invalid input value for enum/i.test(message) &&
    /(AppointmentStatus|PaymentStatus)/i.test(message)
  );
}

async function addEnumValue(enumName: string, value: string) {
  // Os nomes/valores vêm apenas das constantes acima; não há entrada do usuário aqui.
  await prisma.$executeRawUnsafe(
    `ALTER TYPE "${enumName}" ADD VALUE IF NOT EXISTS '${value}'`
  );
}

/**
 * Reparo restrito aos enums usados pela agenda.
 * Não altera, remove ou recria agendamentos: apenas garante que os rótulos
 * esperados pela aplicação existam nos tipos enum do PostgreSQL.
 */
export async function repairAppointmentStatusSchema() {
  for (const value of APPOINTMENT_STATUS_VALUES) {
    await addEnumValue("AppointmentStatus", value);
  }

  for (const value of PAYMENT_STATUS_VALUES) {
    await addEnumValue("PaymentStatus", value);
  }
}
