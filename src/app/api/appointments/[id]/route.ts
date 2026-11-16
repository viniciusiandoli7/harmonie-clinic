import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
  getAppointmentById,
  updateAppointment,
  deleteAppointment,
  AppointmentConflictError,
} from "@/services/appointmentService";
import { updateAppointmentSchema } from "@/validators/appointmentValidator";
import { BlockedTimeConflictError } from "@/services/blockedTimeService";
import { isAppointmentStatusSchemaError, repairAppointmentStatusSchema } from "@/lib/appointmentStatusSchema";

const paramsSchema = z.object({
  id: z.string().uuid("ID inválido (esperado UUID)"),
});

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Ctx) {
  // BLOQUEIO DE SEGURANÇA
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

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
  // BLOQUEIO DE SEGURANÇA
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

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

    const updateData = {
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
    };

    try {
      const updated = await updateAppointment(id, updateData);
      return NextResponse.json(updated);
    } catch (error) {
      if (!isAppointmentStatusSchemaError(error)) throw error;

      console.warn("Enums da agenda ausentes/incompletos. Aplicando reparo restrito aos status e repetindo a atualização.");
      await repairAppointmentStatusSchema();
      const updated = await updateAppointment(id, updateData);
      return NextResponse.json(updated);
    }
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    if (error instanceof AppointmentConflictError || error instanceof BlockedTimeConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Consulta não encontrada" }, { status: 404 });
    }

    if (error instanceof Prisma.PrismaClientValidationError) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    if (isAppointmentStatusSchemaError(error)) {
      console.error("Não foi possível reparar automaticamente os enums da agenda:", { id, error });
      return NextResponse.json(
        {
          error:
            "Não foi possível atualizar os status da agenda agora. Execute npm run db:deploy no banco de produção e tente novamente.",
        },
        { status: 503 }
      );
    }

    console.error("ERRO PATCH /api/appointments/[id]:", { id, error });
    return NextResponse.json({ error: "Erro ao atualizar consulta. Tente novamente." }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: Ctx) {
  // BLOQUEIO DE SEGURANÇA
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

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