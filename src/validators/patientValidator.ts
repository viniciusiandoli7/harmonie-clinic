import { z } from "zod";

export const createPatientSchema = z.object({
  name: z
    .string()
    .min(3, "Nome precisa ter no mínimo 3 caracteres"),

  email: z
    .string()
    .email("Email inválido"),

  phone: z
    .string()
    .min(8, "Telefone inválido")
    .optional(),
});

export const updatePatientSchema = createPatientSchema.partial();
