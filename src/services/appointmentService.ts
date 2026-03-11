import { prisma } from "@/lib/prisma";

type AppointmentStatus = "SCHEDULED" | "COMPLETED" | "CANCELED";
type DurationMinutes = 30 | 60;

type CreateAppointmentInput = {
  patientId: string;
  date: Date;
  status?: AppointmentStatus;
  durationMinutes?: DurationMinutes;
  notes?: string; // ✅ NOVO
};

type GetAppointmentsFilters = {
  patientId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  status?: AppointmentStatus;
};

type UpdateAppointmentInput = {
  patientId?: string;
  date?: Date;
  status?: AppointmentStatus;
  durationMinutes?: DurationMinutes;
  notes?: string; // ✅ NOVO
};

export class AppointmentConflictError extends Error {
  constructor(message = "Conflito de horário") {
    super(message);
    this.name = "AppointmentConflictError";
  }
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function rangesOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && bStart < aEnd;
}

function normalizeDuration(d?: number): DurationMinutes {
  return d === 60 ? 60 : 30;
}

async function assertNoConflictRange(
  start: Date,
  durationMinutes: DurationMinutes,
  excludeId?: string
) {
  const end = addMinutes(start, durationMinutes);

  const windowStart = addMinutes(start, -60);

  const candidates = await prisma.appointment.findMany({
    where: {
      id: excludeId ? { not: excludeId } : undefined,
      status: { not: "CANCELED" },
      date: {
        gte: windowStart,
        lt: end,
      },
    },
    select: {
      id: true,
      date: true,
      durationMinutes: true,
      status: true,
    },
    orderBy: { date: "asc" },
  });

  const conflict = candidates.find((a) => {
    const aStart = a.date;
    const aDur = normalizeDuration(a.durationMinutes);
    const aEnd = addMinutes(aStart, aDur);

    return rangesOverlap(aStart, aEnd, start, end);
  });

  if (conflict) {
    throw new AppointmentConflictError(
      "Já existe uma consulta nesse horário. Escolha outro."
    );
  }
}

export async function createAppointment(data: CreateAppointmentInput) {
  const durationMinutes = normalizeDuration(data.durationMinutes);

  await assertNoConflictRange(data.date, durationMinutes);

  return prisma.appointment.create({
    data: {
      patientId: data.patientId,
      date: data.date,
      status: data.status ?? "SCHEDULED",
      durationMinutes,
      notes: data.notes ?? null, // ✅ NOVO
    },
    include: { patient: true },
  });
}

export async function getAppointments(filters: GetAppointmentsFilters = {}) {
  const { patientId, status, dateFrom, dateTo } = filters;

  return prisma.appointment.findMany({
    where: {
      patientId,
      status,
      date:
        dateFrom || dateTo
          ? {
              gte: dateFrom,
              lte: dateTo,
            }
          : undefined,
    },
    orderBy: { date: "asc" },
    include: { patient: true },
  });
}

export async function getAppointmentById(id: string) {
  return prisma.appointment.findUnique({
    where: { id },
    include: { patient: true },
  });
}

export async function updateAppointment(id: string, data: UpdateAppointmentInput) {
  const current = await prisma.appointment.findUnique({
    where: { id },
    select: {
      id: true,
      date: true,
      status: true,
      durationMinutes: true,
    },
  });

  if (!current) {
    throw new Error("Consulta não encontrada");
  }

  const nextStatus: AppointmentStatus =
    (data.status ?? current.status) as AppointmentStatus;

  if (nextStatus !== "CANCELED") {
    const nextDate = data.date ?? current.date;
    const nextDuration = normalizeDuration(
      data.durationMinutes ?? current.durationMinutes
    );

    await assertNoConflictRange(nextDate, nextDuration, id);
  }

  const durationMinutes =
    data.durationMinutes !== undefined
      ? normalizeDuration(data.durationMinutes)
      : undefined;

  return prisma.appointment.update({
    where: { id },
    data: {
      ...(data.patientId !== undefined && { patientId: data.patientId }),
      ...(data.date !== undefined && { date: data.date }),
      ...(data.status !== undefined && { status: data.status }),
      ...(durationMinutes !== undefined && { durationMinutes }),
      ...(data.notes !== undefined && { notes: data.notes }), // ✅ NOVO
    },
    include: { patient: true },
  });
}

export async function deleteAppointment(id: string) {
  return prisma.appointment.delete({
    where: { id },
  });
}