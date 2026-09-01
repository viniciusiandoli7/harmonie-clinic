import { prisma } from "@/lib/prisma";

export class BlockedTimeConflictError extends Error {
  constructor(message = "Horário bloqueado") {
    super(message);
    this.name = "BlockedTimeConflictError";
  }
}

type CreateBlockedTimeInput = {
  start: Date | string;
  end: Date | string;
  reason?: string | null;
};

type UpdateBlockedTimeInput = Partial<CreateBlockedTimeInput>;

function toDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function rangesOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && bStart < aEnd;
}

async function assertNoBlockedOverlap(
  start: Date,
  end: Date,
  excludeId?: string
) {
  const existing = await prisma.blockedTime.findMany({
    where: {
      id: excludeId ? { not: excludeId } : undefined,
      start: { lt: end },
      end: { gt: start },
    },
    orderBy: { start: "asc" },
  });

  const hasOverlap = existing.some((b) =>
    rangesOverlap(b.start, b.end, start, end)
  );

  if (hasOverlap) {
    throw new BlockedTimeConflictError("Já existe um bloqueio nesse intervalo.");
  }
}

async function assertNoAppointmentOverlap(start: Date, end: Date) {
  // As consultas têm no máximo 120 minutos. Abrimos a janela para trás para
  // capturar uma consulta iniciada antes do bloqueio e que ainda esteja ativa.
  const candidates = await prisma.appointment.findMany({
    where: {
      status: { not: "CANCELED" },
      date: {
        gte: addMinutes(start, -120),
        lt: end,
      },
    },
    select: {
      date: true,
      durationMinutes: true,
      patient: { select: { name: true } },
    },
    orderBy: { date: "asc" },
  });

  const conflict = candidates.find((appointment) => {
    const appointmentEnd = addMinutes(appointment.date, Math.max(30, appointment.durationMinutes || 30));
    return rangesOverlap(appointment.date, appointmentEnd, start, end);
  });

  if (conflict) {
    const time = conflict.date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Sao_Paulo",
    });
    throw new BlockedTimeConflictError(
      `Existe uma consulta agendada às ${time}${conflict.patient?.name ? ` para ${conflict.patient.name}` : ""}. Reagende ou cancele essa consulta antes de bloquear o período.`
    );
  }
}

export async function createBlockedTime(data: CreateBlockedTimeInput) {
  const start = toDate(data.start);
  const end = toDate(data.end);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error("Data ou horário inválido.");
  }

  if (end <= start) {
    throw new Error("O horário final deve ser maior que o inicial.");
  }

  await Promise.all([
    assertNoBlockedOverlap(start, end),
    assertNoAppointmentOverlap(start, end),
  ]);

  return prisma.blockedTime.create({
    data: {
      start,
      end,
      reason: data.reason?.trim() || null,
    },
  });
}

export async function getBlockedTimes(dateFrom?: Date, dateTo?: Date) {
  return prisma.blockedTime.findMany({
    where:
      dateFrom || dateTo
        ? {
            start: dateTo ? { lt: dateTo } : undefined,
            end: dateFrom ? { gt: dateFrom } : undefined,
          }
        : undefined,
    orderBy: { start: "asc" },
  });
}

export async function listBlockedTimes(dateFrom?: string, dateTo?: string) {
  return prisma.blockedTime.findMany({
    where:
      dateFrom || dateTo
        ? {
            start: dateTo ? { lt: new Date(dateTo) } : undefined,
            end: dateFrom ? { gt: new Date(dateFrom) } : undefined,
          }
        : undefined,
    orderBy: { start: "asc" },
  });
}

export async function getBlockedTimeById(id: string) {
  return prisma.blockedTime.findUnique({
    where: { id },
  });
}

export async function updateBlockedTime(id: string, data: UpdateBlockedTimeInput) {
  const current = await prisma.blockedTime.findUnique({
    where: { id },
  });

  if (!current) {
    throw new Error("Bloqueio não encontrado");
  }

  const nextStart = data.start ? toDate(data.start) : current.start;
  const nextEnd = data.end ? toDate(data.end) : current.end;

  if (Number.isNaN(nextStart.getTime()) || Number.isNaN(nextEnd.getTime())) {
    throw new Error("Data ou horário inválido.");
  }

  if (nextEnd <= nextStart) {
    throw new Error("O horário final deve ser maior que o inicial.");
  }

  await Promise.all([
    assertNoBlockedOverlap(nextStart, nextEnd, id),
    assertNoAppointmentOverlap(nextStart, nextEnd),
  ]);

  return prisma.blockedTime.update({
    where: { id },
    data: {
      ...(data.start !== undefined ? { start: nextStart } : {}),
      ...(data.end !== undefined ? { end: nextEnd } : {}),
      ...(data.reason !== undefined ? { reason: data.reason?.trim() || null } : {}),
    },
  });
}

export async function deleteBlockedTime(id: string) {
  return prisma.blockedTime.delete({
    where: { id },
  });
}

export async function assertNotBlocked(start: Date, end: Date) {
  const blockedTimes = await prisma.blockedTime.findMany({
    where: {
      start: { lt: end },
      end: { gt: start },
    },
    orderBy: { start: "asc" },
  });

  const conflict = blockedTimes.find((b) =>
    rangesOverlap(b.start, b.end, start, end)
  );

  if (conflict) {
    throw new BlockedTimeConflictError(
      conflict.reason
        ? `Horário bloqueado: ${conflict.reason}`
        : "Horário bloqueado."
    );
  }
}
