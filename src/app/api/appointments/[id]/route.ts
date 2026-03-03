// src/app/api/appointments/[id]/route.ts
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import {
  getAppointmentById,
  updateAppointment,
  deleteAppointment,
} from "@/services/appointmentService";

const paramsSchema = z.object({
  id: z.string().uuid("ID inválido (esperado UUID)"),
});

const updateAppointmentSchema = z.object({
  patientId: z.string().uuid("patientId inválido").optional(),
  date: z.string().optional(), // ISO string
  status: z.enum(["SCHEDULED", "COMPLETED", "CANCELED"]).optional(),
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
    console.log("GET /api/appointments/[id] =>", id);

    const appointment = await getAppointmentById(id);

    if (!appointment) {
      return NextResponse.json({ error: "Consulta não encontrada" }, { status: 404 });
    }

    return NextResponse.json(appointment);
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientValidationError) {
      console.error("VALIDATION ERROR GET /api/appointments/[id]:", { id, error });
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
    console.log("PATCH /api/appointments/[id] =>", id);

    const body = await req.json();
    const parsed = updateAppointmentSchema.parse(body);

    const updated = await updateAppointment(id, {
      ...(parsed.patientId ? { patientId: parsed.patientId } : {}),
      ...(parsed.date ? { date: new Date(parsed.date) } : {}),
      ...(parsed.status ? { status: parsed.status } : {}),
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Consulta não encontrada" }, { status: 404 });
    }
    if (error instanceof Prisma.PrismaClientValidationError) {
      console.error("VALIDATION ERROR PATCH /api/appointments/[id]:", { id, error });
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
    console.log("DELETE /api/appointments/[id] =>", id);

    await deleteAppointment(id);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Consulta não encontrada" }, { status: 404 });
    }
    if (error instanceof Prisma.PrismaClientValidationError) {
      console.error("VALIDATION ERROR DELETE /api/appointments/[id]:", { id, error });
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    console.error("ERRO DELETE /api/appointments/[id]:", { id, error });
    return NextResponse.json({ error: "Erro ao deletar" }, { status: 500 });
  }
}