import { prisma } from "@/lib/prisma";
import { assertNotBlocked } from "@/services/blockedTimeService";

type AppointmentStatus = "SCHEDULED" | "CONFIRMED" | "COMPLETED" | "NO_SHOW" | "RESCHEDULED" | "CANCELED" | "RETURN" | "FIT_IN";
type PaymentStatus = "PENDING" | "PAID" | "CANCELED";
type DurationMinutes = 30 | 60 | 90 | 120;
type Room = "A" | "B";

type CreateAppointmentInput = {
  patientId: string;
  date: Date | string;
  status?: AppointmentStatus;
  durationMinutes?: DurationMinutes;
  notes?: string | null;
  procedureName?: string | null;
  price?: number | null;
  paymentStatus?: PaymentStatus;
  room?: Room;
};

type GetAppointmentsFilters = {
  patientId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  status?: AppointmentStatus;
};

type UpdateAppointmentInput = {
  patientId?: string;
  date?: Date | string;
  status?: AppointmentStatus;
  durationMinutes?: DurationMinutes;
  notes?: string | null;
  procedureName?: string | null;
  price?: number | null;
  paymentStatus?: PaymentStatus;
  room?: Room;
};

export class AppointmentConflictError extends Error {
  constructor(message = "Conflito de horário") {
    super(message);
    this.name = "AppointmentConflictError";
  }
}

function toDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function rangesOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && bStart < aEnd;
}

function normalizeDuration(d?: number): DurationMinutes {
  if (d === 60) return 60;
  if (d === 90) return 90;
  if (d === 120) return 120;
  return 30;
}

// 🛡️ REFINAMENTO: Agora a função exige a Sala (room) para verificar o conflito corretamente
async function assertNoConflictRange(
  start: Date,
  durationMinutes: DurationMinutes,
  room: Room,
  excludeId?: string
) {
  const end = addMinutes(start, durationMinutes);
  const windowStart = addMinutes(start, -120);

  const candidates = await prisma.appointment.findMany({
    where: {
      id: excludeId ? { not: excludeId } : undefined,
      status: { not: "CANCELED" },
      room: room, // 🛡️ AQUI ESTÁ A MÁGICA: Filtra os conflitos apenas na mesma sala!
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
      `Já existe uma consulta nesse horário na Sala ${room}. Escolha outro horário ou sala.`
    );
  }
}

export async function createAppointment(data: CreateAppointmentInput) {
  const date = toDate(data.date);
  const durationMinutes = normalizeDuration(data.durationMinutes);
  const end = addMinutes(date, durationMinutes);
  const room = data.room ?? "A"; // 🛡️ Define a sala

  await assertNotBlocked(date, end);
  
  // 🛡️ Passa a sala para a verificação de conflito
  await assertNoConflictRange(date, durationMinutes, room);

  const appointment = await prisma.appointment.create({
    data: {
      patientId: data.patientId,
      date,
      status: data.status ?? "SCHEDULED",
      durationMinutes,
      notes: data.notes ?? null,
      procedureName: data.procedureName ?? null,
      price: data.price ?? null,
      paymentStatus: data.paymentStatus ?? "PENDING",
      room: room,
    },
    include: { patient: true },
  });

  return appointment;
}

export async function getAppointments(filters: GetAppointmentsFilters = {}) {
  const { patientId, status, dateFrom, dateTo } = filters;

  return prisma.appointment.findMany({
    where: {
      ...(patientId ? { patientId } : {}),
      ...(status ? { status } : {}),
      ...(dateFrom || dateTo
        ? {
            date: {
              ...(dateFrom ? { gte: dateFrom } : {}),
              ...(dateTo ? { lte: dateTo } : {}),
            },
          }
        : {}),
    },
    orderBy: { date: "asc" },
    include: { patient: true },
  });
}

export async function listAppointments() {
  return prisma.appointment.findMany({
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
    include: {
      patient: true,
    },
  });

  if (!current) {
    throw new Error("Consulta não encontrada");
  }

  const nextStatus: AppointmentStatus =
    (data.status ?? current.status) as AppointmentStatus;

  const nextDate = data.date ? toDate(data.date) : current.date;
  const nextDuration = normalizeDuration(
    data.durationMinutes ?? current.durationMinutes
  );
  
  // 🛡️ Identifica qual será a sala após a atualização
  const nextRoom: Room = (data.room ?? current.room ?? "A") as Room;

  if (nextStatus !== "CANCELED") {
    const nextEnd = addMinutes(nextDate, nextDuration);
    await assertNotBlocked(nextDate, nextEnd);
    
    // 🛡️ Passa a sala para a verificação de conflito na edição
    await assertNoConflictRange(nextDate, nextDuration, nextRoom, id);
  }

  const durationMinutes =
    data.durationMinutes !== undefined
      ? normalizeDuration(data.durationMinutes)
      : undefined;

  const updated = await prisma.appointment.update({
    where: { id },
    data: {
      ...(data.patientId !== undefined ? { patientId: data.patientId } : {}),
      ...(data.date !== undefined ? { date: nextDate } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(durationMinutes !== undefined ? { durationMinutes } : {}),
      ...(data.notes !== undefined ? { notes: data.notes } : {}),
      ...(data.procedureName !== undefined
        ? { procedureName: data.procedureName }
        : {}),
      ...(data.price !== undefined ? { price: data.price } : {}),
      ...(data.paymentStatus !== undefined
        ? { paymentStatus: data.paymentStatus }
        : {}),
      ...(data.room !== undefined ? { room: data.room } : {}),
    },
    include: { patient: true },
  });

  const becamePaid =
    current.paymentStatus !== "PAID" &&
    updated.paymentStatus === "PAID" &&
    (updated.price ?? 0) > 0;

  if (becamePaid) {
    const patientName = updated.patient?.name ?? "Paciente";
    const procedure = updated.procedureName?.trim() || "Consulta";

    // AQUI ESTAVA O BUG: Removemos a busca pela nota que não existe mais
    const existingAutoTransaction = await prisma.financialTransaction.findFirst({
      where: {
        type: "INCOME",
        category: "ATENDIMENTO",
        description: `${procedure} - ${patientName}`,
        amount: updated.price ?? 0,
      },
    });

    if (!existingAutoTransaction) {
      // AQUI ESTAVA O BUG: Removemos a criação da nota que não existe mais
      await prisma.financialTransaction.create({
        data: {
          date: updated.date,
          description: `${procedure} - ${patientName}`,
          category: "ATENDIMENTO",
          amount: updated.price ?? 0,
          type: "INCOME",
        },
      });
    }
  }

  return updated;
}

export async function deleteAppointment(id: string) {
  return prisma.appointment.delete({
    where: { id },
  });
}