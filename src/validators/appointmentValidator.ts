import { z } from "zod";

export const appointmentStatusSchema = z.enum([
  "SCHEDULED",
  "COMPLETED",
  "CANCELED",
]);

export const createAppointmentSchema = z.object({
  patientId: z.string().uuid("patientId deve ser UUID"),
  date: z.string().datetime("date deve ser ISO string (ex: 2026-02-26T18:30:00.000Z)"),
  status: appointmentStatusSchema.optional(),
});

export const updateAppointmentSchema = z.object({
  patientId: z.string().uuid().optional(),
  date: z.string().datetime().optional(),
  status: appointmentStatusSchema.optional(),
});