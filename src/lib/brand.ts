export const brand = {
  name: "Mariana Thomaz Carmona",
  shortName: "Dra. Mariana",
  systemName: "Mariana Thomaz Carmona Clinic",
  logo: "/mariana-logo-full.png",
  symbol: "/mariana-brand-symbol.png",
  logoOffWhite: "/mariana-carmona-logo-offwhite.png",
  profilePhoto: "/mariana-profile.png",
  colors: {
    primary: "#5A1F2B",
    primaryDark: "#3F1620",
    background: "#F7F2EA",
    backgroundSecondary: "#D8C4AE",
    textPrimary: "#5B3A2E",
    textStrong: "#1E1A18",
    border: "rgba(90,31,43,.12)",
    hover: "rgba(90,31,43,.08)",
    success: "#6D9B73",
    warning: "#C9A227",
    danger: "#A13D3D",
    surface: "#FBF8F2",
    surfaceMuted: "#EFE5D8",
  },
} as const;

export const patientOrigins = [
  "Instagram",
  "Google",
  "Indicação",
  "WhatsApp",
  "TikTok",
  "Facebook",
  "Site",
  "Outros",
] as const;

export const patientStatuses = [
  "Novo Lead",
  "Avaliação agendada",
  "Avaliada",
  "Fechou procedimento",
  "Em tratamento",
  "Retorno",
  "Inativa",
  "VIP",
] as const;

export const patientProfiles = [
  "Conservadora",
  "Gosta de naturalidade",
  "Tem medo de procedimento",
  "Foco em pele",
  "Foco em rejuvenescimento",
  "Sensível a preço",
  "Paciente recorrente",
  "Paciente VIP",
] as const;

export const conversionStatuses = [
  { value: "CLOSED_SAME_DAY", label: "Fechou no dia" },
  { value: "CLOSED_LATER", label: "Fechou depois" },
  { value: "FOLLOW_UP", label: "Vai pensar / acompanhar" },
  { value: "LOST_EXPENSIVE", label: "Achou caro" },
  { value: "LOST_NO_INDICATION", label: "Sem indicação no momento" },
  { value: "LOST_OTHER", label: "Não fechou / outro motivo" },
] as const;

export const treatmentStepStatuses = [
  { value: "SUGGESTED", label: "Sugerido" },
  { value: "ACCEPTED", label: "Aceito" },
  { value: "REFUSED", label: "Recusado" },
  { value: "POSTPONED", label: "Adiado" },
  { value: "DONE", label: "Realizado" },
] as const;

export const incomeCategories = ["Procedimento", "Produto", "Curso", "Outros"] as const;

export const expenseCategories = [
  "Produto",
  "Divulgação / captação",
  "Impostos",
  "Taxa da maquininha",
  "Comissão",
  "Aluguel",
  "Equipamentos",
  "Cursos",
  "Fotógrafo",
  "Materiais",
  "Funcionários",
  "Outros",
] as const;

export const paymentMethods = [
  "Pix",
  "Dinheiro",
  "Cartão de crédito",
  "Cartão de débito",
  "Transferência",
  "Boleto",
  "Outros",
] as const;

export const financialStatuses = ["PENDING", "PARTIAL", "PAID", "CANCELED"] as const;

export const financialStatusLabels: Record<(typeof financialStatuses)[number] | "COMPLETED", string> = {
  PENDING: "Pendente",
  PARTIAL: "Parcial",
  PAID: "Pago",
  CANCELED: "Cancelado",
  COMPLETED: "Pago",
};
