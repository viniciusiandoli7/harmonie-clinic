import { z } from "zod";

export const createPatientSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Nome deve ter pelo menos 3 caracteres")
    .max(120, "Nome muito longo"),

  email: z.union([
    z.string().trim().email("E-mail inválido"),
    z.literal(""),
    z.undefined(),
    z.null(),
  ]),

  phone: z.union([
    z.string().trim().max(20, "Telefone muito longo"),
    z.literal(""),
    z.undefined(),
    z.null(),
  ]),

  birthDate: z.union([
    z.string(),
    z.literal(""),
    z.undefined(),
    z.null(),
  ]),

  notes: z.union([
    z.string().max(2000, "Observações muito longas"),
    z.literal(""),
    z.undefined(),
    z.null(),
  ]),

  isActive: z.union([z.boolean(), z.undefined()]),
});

export const updatePatientSchema = createPatientSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Envie ao menos um campo para atualizar",
  });

export type CreatePatientInput = z.infer<typeof createPatientSchema>;
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;