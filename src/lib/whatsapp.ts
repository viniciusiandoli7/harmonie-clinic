export function normalizeBrazilPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");

  if (!digits) return "";

  if (digits.startsWith("55")) return digits;

  return `55${digits}`;
}

export function buildWhatsappMessage(params: {
  patientName?: string;
  procedureName?: string | null;
  date?: string | Date | null;
  room?: "A" | "B" | null;
}) {
  const { patientName, procedureName, date, room } = params;

  const formattedDate = date
    ? new Date(date).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return [
    `Olá${patientName ? `, ${patientName}` : ""}! Tudo bem? 😊`,
    "",
    "Aqui é da clínica.",
    procedureName ? `Seu atendimento: ${procedureName}` : "Seu atendimento foi agendado.",
    formattedDate ? `Data e horário: ${formattedDate}` : "",
    room ? `Sala: ${room}` : "",
    "",
    "Qualquer dúvida, estou à disposição.",
  ]
    .filter(Boolean)
    .join("\n");
}

export function getWhatsappLink(phone: string, message: string) {
  const normalizedPhone = normalizeBrazilPhone(phone);
  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
}