import { NextResponse } from "next/server";
import { createAppointment, getAppointments } from "@/services/appointmentService";
import { createAppointmentSchema } from "@/validators/appointmentValidator";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const patientId = url.searchParams.get("patientId") ?? undefined;

    const data = await getAppointments({
      patientId: patientId || undefined,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("ERRO GET /api/appointments:", error);
    return NextResponse.json({ error: "Erro ao listar" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = createAppointmentSchema.parse(body);

    const appointment = await createAppointment({
      patientId: parsed.patientId,
      date: new Date(parsed.date),
      status: parsed.status,
    });

    return NextResponse.json(appointment, { status: 201 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("ERRO POST /api/appointments:", error);
    return NextResponse.json({ error: "Erro ao criar" }, { status: 500 });
  }
}