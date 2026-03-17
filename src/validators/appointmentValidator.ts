import { z } from "zod";

export const appointmentStatusSchema = z.enum([
  "SCHEDULED",
  "COMPLETED",
  "CANCELED",
]);

export const paymentStatusSchema = z.enum([
  "PENDING",
  "PAID",
  "CANCELED",
]);

export const durationMinutesSchema = z.union([
  z.literal(30),
  z.literal(60),
  z.literal(90),
  z.literal(120),
]);

export const createAppointmentSchema = z.object({
  patientId: z.string().uuid("Paciente inválido"),
  date: z.string().datetime("Data inválida"),
  status: appointmentStatusSchema.optional(),
  durationMinutes: durationMinutesSchema.optional(),
  notes: z.string().max(500, "Máximo de 500 caracteres").nullable().optional(),
  procedureName: z.string().max(200, "Máximo de 200 caracteres").nullable().optional(),
  price: z.number().min(0, "Preço inválido").nullable().optional(),
  paymentStatus: paymentStatusSchema.optional(),
});

export const updateAppointmentSchema = z
  .object({
    patientId: z.string().uuid("Paciente inválido").optional(),
    date: z.string().datetime("Data inválida").optional(),
    status: appointmentStatusSchema.optional(),
    durationMinutes: durationMinutesSchema.optional(),
    notes: z.string().max(500, "Máximo de 500 caracteres").nullable().optional(),
    procedureName: z.string().max(200, "Máximo de 200 caracteres").nullable().optional(),
    price: z.number().min(0, "Preço inválido").nullable().optional(),
    paymentStatus: paymentStatusSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Envie ao menos um campo para atualizar",
  });