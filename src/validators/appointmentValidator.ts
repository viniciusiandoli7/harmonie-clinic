import { z } from "zod";

const statusSchema = z.enum(["SCHEDULED", "COMPLETED", "CANCELED"]);
const durationSchema = z.union([z.literal(30), z.literal(60)]);

export const createAppointmentSchema = z.object({
  patientId: z.string().uuid("patientId inválido"),
  date: z.string().datetime("date inválida (esperado ISO)"),
  status: statusSchema.optional(),
  durationMinutes: durationSchema.optional(),
  notes: z.string().max(500).optional(),
});