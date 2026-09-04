/**
 * Lista canônica de procedimentos exibidos nas seleções do sistema.
 * Mantida genérica de propósito: nomes comerciais de produtos ficam no prontuário/estoque,
 * não no agendamento, venda ou contrato.
 */
export const CLINIC_PROCEDURES = [
  "Consulta",
  "Preenchimento",
  "Skinbooster",
  "PEIM",
  "Intradermoterapia",
  "PDRN",
  "Peeling químico",
  "Ultrassom microfocado e macrofocado",
  "Toxina botulínica",
  "Bioestimulador de colágeno",
  "Laser de CO2 fracionado",
  "Microagulhamento",
  "Subcisão",
  "Limpeza de pele",
  "Laser de thulium",
] as const;

export type ClinicProcedure = (typeof CLINIC_PROCEDURES)[number];
