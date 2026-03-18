import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import {
  deletePatient,
  getPatientById,
  updatePatient,
} from "@/services/patientService";
import { updatePatientSchema } from "@/validators/patientValidator";

const paramsSchema = z.object({
  id: z.string().uuid("ID inválido"),
});

type Ctx = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, context: Ctx) {
  try {
    const { id } = paramsSchema.parse(await context.params);

    const patient = await getPatientById(id);

    if (!patient) {
      return NextResponse.json(
        { error: "Paciente não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(patient);
  } catch {
    return NextResponse.json(
      { error: "Erro ao buscar paciente" },
      { status: 400 }
    );
  }
}

export async function PATCH(req: Request, context: Ctx) {
  try {
    const { id } = paramsSchema.parse(await context.params);
    const body = await req.json();
    const data = updatePatientSchema.parse(body);

    const patient = await updatePatient(id, {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.email !== undefined ? { email: data.email ?? null } : {}),
      ...(data.phone !== undefined ? { phone: data.phone ?? null } : {}),
      ...(data.birthDate !== undefined
        ? { birthDate: data.birthDate ?? null }
        : {}),
      ...(data.notes !== undefined ? { notes: data.notes ?? null } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
    });

    return NextResponse.json(patient);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json(
          { error: "Paciente não encontrado" },
          { status: 404 }
        );
      }

      if (error.code === "P2002") {
        return NextResponse.json(
          { error: "Já existe um paciente com este e-mail" },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: "Erro ao atualizar paciente" },
      { status: 400 }
    );
  }
}

export async function DELETE(_: Request, context: Ctx) {
  try {
    const { id } = paramsSchema.parse(await context.params);

    const patient = await getPatientById(id);

    if (!patient) {
      return NextResponse.json(
        { error: "Paciente não encontrado" },
        { status: 404 }
      );
    }

    if (patient.appointments && patient.appointments.length > 0) {
      return NextResponse.json(
        {
          error:
            "Não é possível excluir este paciente porque ele possui consultas cadastradas.",
        },
        { status: 409 }
      );
    }

    await deletePatient(id);

    return NextResponse.json({ message: "Paciente removido com sucesso" });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json(
          { error: "Paciente não encontrado" },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: "Erro ao remover paciente" },
      { status: 400 }
    );
  }
}