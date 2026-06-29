import { prisma } from "@/lib/prisma";
import { createAppointment, AppointmentConflictError } from "@/services/appointmentService";

const RETURN_ROOM = "B" as const;
const DEFAULT_RETURN_TIME = "10:00";
const RETURN_DURATION_MINUTES = 30;

type SchedulePatientReturnInput = {
  patientId: string;
  procedureName: string;
  returnDate?: string | Date | null;
  returnTime?: string | null;
  notes?: string | null;
  sourceRef?: string | null;
};

function parseTime(value?: string | null) {
  const time = String(value || DEFAULT_RETURN_TIME).trim();
  return /^\d{2}:\d{2}$/.test(time) ? time : DEFAULT_RETURN_TIME;
}

function toDateOnly(value?: string | Date | null) {
  if (!value) return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return value.toISOString().slice(0, 10);
  }

  const text = String(value).trim();
  if (!text) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return null;

  return parsed.toISOString().slice(0, 10);
}

function combineDateAndTime(date: string, time: string) {
  const parsed = new Date(`${date}T${time}:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function toTime(date: Date) {
  return date.toTimeString().slice(0, 5);
}

export async function schedulePatientReturn(input: SchedulePatientReturnInput) {
  const returnDate = toDateOnly(input.returnDate);
  if (!returnDate) return null;

  const requestedTime = parseTime(input.returnTime);
  const requestedDateTime = combineDateAndTime(returnDate, requestedTime);
  if (!requestedDateTime) return null;

  const patient = await prisma.patient.findUnique({
    where: { id: input.patientId },
    select: { id: true, name: true },
  });

  if (!patient) {
    throw new Error("Paciente não encontrado para criar retorno na agenda.");
  }

  const procedureName = String(input.procedureName || "Retorno").trim();
  const baseNotes = [
    "Retorno criado automaticamente pelo prontuário.",
    `Origem: ${procedureName}`,
    input.sourceRef ? `Referência interna: ${input.sourceRef}` : null,
    input.notes ? `Observação: ${input.notes}` : null,
  ].filter(Boolean).join("\n");

  const existing = await prisma.appointment.findFirst({
    where: {
      patientId: input.patientId,
      status: { not: "CANCELED" },
      room: RETURN_ROOM,
      procedureName: { contains: "Retorno", mode: "insensitive" },
      date: {
        gte: new Date(`${returnDate}T00:00:00`),
        lte: new Date(`${returnDate}T23:59:59`),
      },
    },
    orderBy: { date: "asc" },
  });

  if (existing) {
    return existing;
  }

  const maxAttempts = 18; // tenta o horário pedido e os próximos 30 em 30 min por até 9h
  let lastConflict: unknown = null;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const candidate = addMinutes(requestedDateTime, attempt * RETURN_DURATION_MINUTES);

    try {
      return await createAppointment({
        patientId: input.patientId,
        date: candidate,
        status: "RETURN",
        durationMinutes: RETURN_DURATION_MINUTES,
        procedureName: `Retorno - ${procedureName}`,
        price: null,
        paymentStatus: "PENDING",
        room: RETURN_ROOM,
        notes: attempt === 0
          ? baseNotes
          : `${baseNotes}\n\nHorário ajustado automaticamente para ${toTime(candidate)} porque a Sala B estava ocupada no horário solicitado.`,
      });
    } catch (error) {
      if (error instanceof AppointmentConflictError) {
        lastConflict = error;
        continue;
      }
      throw error;
    }
  }

  throw lastConflict instanceof Error
    ? new Error("Não foi possível criar o retorno na Sala B neste dia. A agenda da Sala B está ocupada nos horários próximos.")
    : new Error("Não foi possível criar o retorno na agenda.");
}

export { DEFAULT_RETURN_TIME, RETURN_ROOM };
