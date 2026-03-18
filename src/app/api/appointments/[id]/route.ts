import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import {
  getAppointmentById,
  updateAppointment,
  deleteAppointment,
  AppointmentConflictError,
} from "@/services/appointmentService";
import { updateAppointmentSchema } from "@/validators/appointmentValidator";

const paramsSchema = z.object({
  id: z.string().uuid("ID inválido (esperado UUID)"),
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
    const appointment = await getAppointmentById(id);

    if (!appointment) {
      return NextResponse.json({ error: "Consulta não encontrada" }, { status: 404 });
    }

    return NextResponse.json(appointment);
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientValidationError) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    console.error("ERRO GET /api/appointments/[id]:", { id, error });
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
    const body = await req.json();
    const parsed = updateAppointmentSchema.parse(body);

    const updated = await updateAppointment(id, {
      ...(parsed.patientId !== undefined ? { patientId: parsed.patientId } : {}),
      ...(parsed.date !== undefined ? { date: parsed.date } : {}),
      ...(parsed.status !== undefined ? { status: parsed.status } : {}),
      ...(parsed.durationMinutes !== undefined
        ? { durationMinutes: parsed.durationMinutes }
        : {}),
      ...(parsed.notes !== undefined ? { notes: parsed.notes ?? null } : {}),
      ...(parsed.procedureName !== undefined
        ? { procedureName: parsed.procedureName ?? null }
        : {}),
      ...(parsed.price !== undefined ? { price: parsed.price ?? null } : {}),
      ...(parsed.paymentStatus !== undefined
        ? { paymentStatus: parsed.paymentStatus }
        : {}),
      ...(parsed.room !== undefined ? { room: parsed.room } : {}),
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    if (error instanceof AppointmentConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Consulta não encontrada" }, { status: 404 });
    }

    if (error instanceof Prisma.PrismaClientValidationError) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    console.error("ERRO PATCH /api/appointments/[id]:", { id, error });
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
    await deleteAppointment(id);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Consulta não encontrada" }, { status: 404 });
    }

    if (error instanceof Prisma.PrismaClientValidationError) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    console.error("ERRO DELETE /api/appointments/[id]:", { id, error });
    return NextResponse.json({ error: "Erro ao deletar" }, { status: 500 });
  }
}