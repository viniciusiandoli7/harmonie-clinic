import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const paramsSchema = z.object({
  id: z.string().uuid("ID inválido (esperado UUID)"),
});

const updatePatientSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Ctx) {
  const resolvedParams = await params;
  const parsedParams = paramsSchema.safeParse(resolvedParams);

  if (!parsedParams.success) {
    return NextResponse.json(
      { error: parsedParams.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { id } = parsedParams.data;

  try {
    console.log("GET /api/patients/[id] =>", id);

    const patient = await prisma.patient.findUnique({
      where: { id },
      include: { appointments: true },
    });

    if (!patient) {
      return NextResponse.json({ error: "Paciente não encontrado" }, { status: 404 });
    }

    return NextResponse.json(patient);
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientValidationError) {
      console.error("VALIDATION ERROR GET /api/patients/[id]:", { id, error });
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    console.error("ERRO GET /api/patients/[id]:", { id, error });
    return NextResponse.json({ error: "Erro ao buscar" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: Ctx) {
  const resolvedParams = await params;
  const parsedParams = paramsSchema.safeParse(resolvedParams);

  if (!parsedParams.success) {
    return NextResponse.json(
      { error: parsedParams.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { id } = parsedParams.data;

  try {
    console.log("PATCH /api/patients/[id] =>", id);

    const body = await req.json();
    const parsed = updatePatientSchema.parse(body);

    const updated = await prisma.patient.update({
      where: { id },
      data: parsed,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Email já cadastrado" }, { status: 409 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Paciente não encontrado" }, { status: 404 });
    }
    if (error instanceof Prisma.PrismaClientValidationError) {
      console.error("VALIDATION ERROR PATCH /api/patients/[id]:", { id, error });
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    console.error("ERRO PATCH /api/patients/[id]:", { id, error });
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: Ctx) {
  const resolvedParams = await params;
  const parsedParams = paramsSchema.safeParse(resolvedParams);

  if (!parsedParams.success) {
    return NextResponse.json(
      { error: parsedParams.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { id } = parsedParams.data;

  try {
    console.log("DELETE /api/patients/[id] =>", id);

    // ✅ BLOQUEIA deletar paciente com consultas
    const hasAppointments = await prisma.appointment.count({
      where: { patientId: id },
    });

    if (hasAppointments > 0) {
      return NextResponse.json(
        {
          error: "Não é possível deletar paciente com consultas. Delete as consultas primeiro.",
        },
        { status: 409 }
      );
    }

    await prisma.patient.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Paciente não encontrado" }, { status: 404 });
    }
    if (error instanceof Prisma.PrismaClientValidationError) {
      console.error("VALIDATION ERROR DELETE /api/patients/[id]:", { id, error });
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    console.error("ERRO DELETE /api/patients/[id]:", { id, error });
    return NextResponse.json({ error: "Erro ao deletar" }, { status: 500 });
  }
}