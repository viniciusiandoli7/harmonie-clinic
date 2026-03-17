import { prisma } from "@/lib/prisma";
import type {
  CreatePatientInput,
  UpdatePatientInput,
} from "@/validators/patientValidator";

function normalizePatientData(
  data: Partial<CreatePatientInput | UpdatePatientInput>
) {
  return {
    ...(data.name !== undefined && { name: data.name.trim() }),

    ...(data.email !== undefined && {
      email:
        data.email === null || data.email === ""
          ? null
          : String(data.email).trim(),
    }),

    ...(data.phone !== undefined && {
      phone:
        data.phone === null || data.phone === ""
          ? null
          : String(data.phone).trim(),
    }),

    ...(data.notes !== undefined && {
      notes:
        data.notes === null || data.notes === ""
          ? null
          : String(data.notes).trim(),
    }),

    ...(data.birthDate !== undefined && {
      birthDate:
        data.birthDate === null || data.birthDate === ""
          ? null
          : new Date(`${String(data.birthDate)}T00:00:00`),
    }),

    ...(data.isActive !== undefined && {
      isActive: Boolean(data.isActive),
    }),
  };
}

export async function getAllPatients(includeInactive = false) {
  return prisma.patient.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getPatientById(id: string) {
  return prisma.patient.findUnique({
    where: { id },
    include: {
      appointments: {
        orderBy: {
          date: "desc",
        },
      },
    },
  });
}

export async function createPatient(data: CreatePatientInput) {
  return prisma.patient.create({
    data: normalizePatientData(data),
  });
}

export async function updatePatient(id: string, data: UpdatePatientInput) {
  return prisma.patient.update({
    where: { id },
    data: normalizePatientData(data),
  });
}

export async function deletePatient(id: string) {
  return prisma.patient.delete({
    where: { id },
  });
}

export async function deactivatePatient(id: string) {
  return prisma.patient.update({
    where: { id },
    data: {
      isActive: false,
    },
  });
}

export async function activatePatient(id: string) {
  return prisma.patient.update({
    where: { id },
    data: {
      isActive: true,
    },
  });
}