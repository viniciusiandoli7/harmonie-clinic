import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
  createAppointment,
  getAppointments,
  AppointmentConflictError,
} from "@/services/appointmentService";
import { createAppointmentSchema } from "@/validators/appointmentValidator";
import { z } from "zod";

const statusSchema = z.enum(["SCHEDULED", "COMPLETED", "CANCELED"]);

export async function GET(req: Request) {
  // BLOQUEIO DE SEGURANÇA
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const url = new URL(req.url);

    const patientId = url.searchParams.get("patientId") ?? undefined;
    const statusParam = url.searchParams.get("status");
    const dateFromStr = url.searchParams.get("dateFrom");
    const dateToStr = url.searchParams.get("dateTo");

    const status = statusParam ? statusSchema.parse(statusParam) : undefined;

    const dateFrom = dateFromStr ? new Date(dateFromStr) : undefined;
    const dateTo = dateToStr ? new Date(dateToStr) : undefined;

    const data = await getAppointments({
      patientId,
      status,
      dateFrom: dateFrom && !isNaN(dateFrom.getTime()) ? dateFrom : undefined,
      dateTo: dateTo && !isNaN(dateTo.getTime()) ? dateTo : undefined,
    });

    return NextResponse.json(data);
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    console.error("ERRO GET /api/appointments:", error);
    return NextResponse.json({ error: "Erro ao listar" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  // BLOQUEIO DE SEGURANÇA
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();

    // 👇 adiciona suporte a "room" sem quebrar validator base
    const parsed = createAppointmentSchema
      .extend({
        room: z.enum(["A", "B"]).optional(),
      })
      .parse(body);

    const appointment = await createAppointment({
      patientId: parsed.patientId,
      date: parsed.date,
      status: parsed.status,
      durationMinutes: parsed.durationMinutes,
      notes: parsed.notes ?? null,
      procedureName: parsed.procedureName ?? null,
      price: parsed.price ?? null,
      paymentStatus: parsed.paymentStatus,

      // 👇 NOVO (com fallback seguro)
      room: parsed.room ?? "A",
    });

    return NextResponse.json(appointment, { status: 201 });
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    if (error instanceof AppointmentConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    console.error("ERRO POST /api/appointments:", error);
    return NextResponse.json({ error: "Erro ao criar" }, { status: 500 });
  }
}