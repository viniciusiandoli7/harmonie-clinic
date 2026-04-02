import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { activatePatient, getPatientById } from "@/services/patientService";

const paramsSchema = z.object({
  id: z.string().uuid("ID inválido"),
});

type Ctx = {
  params: Promise<{ id: string }>;
};

export async function PATCH(_: Request, context: Ctx) {
  // BLOQUEIO DE SEGURANÇA
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { id } = paramsSchema.parse(await context.params);

    const patient = await getPatientById(id);

    if (!patient) {
      return NextResponse.json(
        { error: "Paciente não encontrado" },
        { status: 404 }
      );
    }

    const updated = await activatePatient(id);

    return NextResponse.json(updated);
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
      { error: "Erro ao reativar paciente" },
      { status: 400 }
    );
  }
}