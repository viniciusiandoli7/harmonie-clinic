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
import { prisma } from "@/lib/prisma";
import { reserveInventoryForAppointmentRaw } from "@/lib/inventorySql";


function normalizeProcedureName(value?: string | null) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function splitProcedures(value?: string | null) {
  return String(value || "")
    .split("+")
    .map((item) => item.trim())
    .filter(Boolean);
}

async function linkInventoryToAppointment(params: {
  patientId: string;
  procedureName?: string | null;
  appointmentDate: Date;
}) {
  const procedures = splitProcedures(params.procedureName)
    .filter((procedure) => !["consulta", "retorno"].includes(normalizeProcedureName(procedure)));

  if (procedures.length === 0) return;

  const patient = await prisma.patient.findUnique({
    where: { id: params.patientId },
    select: { name: true },
  });

  if (!patient) return;

  for (const procedure of procedures) {
    try {
      const updated = await reserveInventoryForAppointmentRaw(prisma as any, {
        patientName: patient.name,
        procedureName: procedure,
        appointmentDate: params.appointmentDate,
      });

      if (updated) {
        await (prisma as any).auditLog.create({
          data: {
            action: "UPDATE",
            entity: "InventoryItem",
            entityId: updated.id,
            description: `Estoque reservado pela agenda: ${updated.product} • ${patient.name}`,
            userName: "Dra. Mariana",
            afterJson: updated,
          },
        });
      }
    } catch (error) {
      console.warn("Não foi possível vincular estoque ao agendamento:", procedure, error);
    }
  }
}

const statusSchema = z.enum(["SCHEDULED", "CONFIRMED", "COMPLETED", "NO_SHOW", "RESCHEDULED", "CANCELED", "RETURN", "FIT_IN"]);

export async function GET(req: Request) {
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
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();

    // 🛡️ REFINAMENTO: Log para debugar o que o frontend está enviando
    const parsed = createAppointmentSchema
      .extend({
        room: z.enum(["A", "B"]).optional(),
      })
      .parse(body);

    const appointment = await createAppointment({
      patientId: parsed.patientId,
      date: parsed.date, // O validator deve garantir que é uma data válida ISO-8601
      status: parsed.status,
      durationMinutes: parsed.durationMinutes,
      notes: parsed.notes ?? null,
      procedureName: parsed.procedureName ?? null,
      price: parsed.price ?? null,
      paymentStatus: parsed.paymentStatus,
      room: parsed.room ?? "A",
    });

    await linkInventoryToAppointment({
      patientId: parsed.patientId,
      procedureName: parsed.procedureName ?? null,
      appointmentDate: new Date(parsed.date),
    });

    return NextResponse.json(appointment, { status: 201 });
  } catch (error: any) {
    if (error?.name === "ZodError") {
      console.error("Erro de Validação (Zod):", error.errors);
      return NextResponse.json({ error: "Dados inválidos", details: error.errors }, { status: 400 });
    }

    if (error instanceof AppointmentConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    console.error("ERRO POST /api/appointments:", error);
    return NextResponse.json({ error: "Erro interno ao criar agendamento" }, { status: 500 });
  }
}