const HARMONIE_WHATSAPP_BUSINESS = "5511967239595";

export function normalizeWhatsappPhone(phone?: string | null) {
  if (!phone) return "";
  return phone.replace(/\D/g, "");
}

export function getWhatsappLink(phone?: string | null, message?: string) {
  const normalized = normalizeWhatsappPhone(phone);
  if (!normalized) return "";
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message ?? "")}`;
}

export function getClinicWhatsappLink(message?: string) {
  return `https://wa.me/${HARMONIE_WHATSAPP_BUSINESS}?text=${encodeURIComponent(
    message ?? ""
  )}`;
}

export function buildWhatsappAppointmentMessage(params: {
  patientName?: string | null;
  procedureName?: string | null;
  date?: string | null;
  room?: string | null;
}) {
  const patientName = params.patientName || "paciente";
  const procedureName = params.procedureName || "atendimento";
  const room = params.room || "A";

  const formattedDate = params.date
    ? new Date(params.date).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return `Olá ${patientName}, tudo bem? 👋

Seu agendamento está confirmado.

Procedimento: ${procedureName}
Data: ${formattedDate}
Sala: ${room}

Qualquer dúvida, estamos à disposição.
Harmonie Clinic`;
}

export function buildWhatsappConsentMessage(params: {
  patientName?: string | null;
  treatmentName: string;
  documentLink: string;
}) {
  const patientName = params.patientName || "paciente";

  return `Olá ${patientName}, tudo bem? 👋

Segue seu termo de consentimento referente ao tratamento de ${params.treatmentName} para leitura e assinatura:

${params.documentLink}

Assim que finalizar, me avise por aqui.
Harmonie Clinic`;
}

export function buildWhatsappContractMessage(params: {
  patientName?: string | null;
  contractLink: string;
}) {
  const patientName = params.patientName || "paciente";

  return `Olá ${patientName}, tudo bem? 👋

Segue seu contrato para leitura e assinatura:

${params.contractLink}

Assim que finalizar, me avise por aqui.
Harmonie Clinic`;
}

export function buildWhatsappMessage(params: {
  patientName?: string | null;
  procedureName?: string | null;
  date?: string | null;
  room?: string | null;
}) {
  return buildWhatsappAppointmentMessage(params);
}