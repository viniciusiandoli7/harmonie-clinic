import { prisma } from "@/lib/prisma";

type CreatePatientInput = {
  name: string;
  email: string;
  phone?: string;
};

type UpdatePatientInput = {
  name?: string;
  email?: string;
  phone?: string;
};

export async function createPatient(data: CreatePatientInput) {
  return prisma.patient.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone,
    },
  });
}

export async function getPatients() {
  return prisma.patient.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function getPatientById(id: string) {
  return prisma.patient.findUnique({
    where: { id },
  });
}

export async function updatePatient(id: string, data: UpdatePatientInput) {
  return prisma.patient.update({
    where: { id },
    data,
  });
}

export async function deletePatient(id: string) {
  return prisma.patient.delete({ where: { id } });
}