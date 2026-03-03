import { prisma } from "@/lib/prisma";

type AppointmentStatus = "SCHEDULED" | "COMPLETED" | "CANCELED";

type CreateAppointmentInput = {
  patientId: string;
  date: Date;
  status?: AppointmentStatus;
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
};

export async function createAppointment(data: CreateAppointmentInput) {
  return prisma.appointment.create({
    data: {
      patientId: data.patientId,
      date: data.date,
      status: data.status ?? "SCHEDULED",
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
      date: dateFrom || dateTo ? { gte: dateFrom, lte: dateTo } : undefined,
    },
    orderBy: { date: "asc" },
    include: { patient: true },
  });
}

export async function getAppointmentById(id: string) {
  // ✅ evita Prisma explodir quando id vier undefined/vazio
  if (!id || typeof id !== "string" || id.trim().length === 0) {
    return null;
  }

  return prisma.appointment.findUnique({
    where: { id },
    include: { patient: true },
  });
}

export async function updateAppointment(id: string, data: UpdateAppointmentInput) {
  return prisma.appointment.update({
    where: { id },
    data,
    include: { patient: true },
  });
}

export async function deleteAppointment(id: string) {
  return prisma.appointment.delete({ where: { id } });
}