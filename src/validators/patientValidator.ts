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

  cpf: z.union([
    z.string().trim().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "CPF deve estar no formato XXX.XXX.XXX-XX"),
    z.literal(""),
    z.undefined(),
    z.null(),
  ]),

  rg: z.union([
    z.string().trim().max(20, "RG muito longo"),
    z.literal(""),
    z.undefined(),
    z.null(),
  ]),

  address: z.union([
    z.string().trim().max(200, "Endereço muito longo"),
    z.literal(""),
    z.undefined(),
    z.null(),
  ]),

  addressNumber: z.union([
    z.string().trim().max(20, "Número muito longo"),
    z.literal(""),
    z.undefined(),
    z.null(),
  ]),

  addressComplement: z.union([
    z.string().trim().max(100, "Complemento muito longo"),
    z.literal(""),
    z.undefined(),
    z.null(),
  ]),

  neighborhood: z.union([
    z.string().trim().max(100, "Bairro muito longo"),
    z.literal(""),
    z.undefined(),
    z.null(),
  ]),

  city: z.union([
    z.string().trim().max(100, "Cidade muito longa"),
    z.literal(""),
    z.undefined(),
    z.null(),
  ]),

  state: z.union([
    z.string().trim().max(2, "Estado deve ter 2 caracteres"),
    z.literal(""),
    z.undefined(),
    z.null(),
  ]),

  zipCode: z.union([
    z.string().trim().regex(/^\d{5}-\d{3}$/, "CEP deve estar no formato XXXXX-XXX"),
    z.literal(""),
    z.undefined(),
    z.null(),
  ]),

  crmSource: z.union([
    z.string().trim().max(100, "Origem do CRM muito longa"),
    z.literal(""),
    z.undefined(),
    z.null(),
  ]),

  interestProcedure: z.union([
    z.string().trim().max(200, "Procedimento de interesse muito longo"),
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