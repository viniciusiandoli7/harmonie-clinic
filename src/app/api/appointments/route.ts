import { NextResponse } from "next/server";
import {
  createAppointment,
  getAppointments,
  AppointmentConflictError,
} from "@/services/appointmentService";
import { createAppointmentSchema } from "@/validators/appointmentValidator";
import { z } from "zod";

const statusSchema = z.enum(["SCHEDULED", "COMPLETED", "CANCELED"]);

export async function GET(req: Request) {
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
      patientId: patientId || undefined,
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
  try {
    const body = await req.json();
    const parsed = createAppointmentSchema.parse(body);

    const date = new Date(parsed.date);

    if (isNaN(date.getTime())) {
      return NextResponse.json({ error: "date inválida" }, { status: 400 });
    }

    const appointment = await createAppointment({
      patientId: parsed.patientId,
      date,
      status: parsed.status,
      durationMinutes: parsed.durationMinutes,
      notes: parsed.notes,
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