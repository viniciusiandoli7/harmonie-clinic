import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const url = new URL(req.url);
  const inactiveDays = Number(url.searchParams.get("inactiveDays") || 90);
  const now = new Date();
  const inactiveLimit = addDays(now, -inactiveDays);
  const expiringLimit = addDays(now, 60);

  const [patients, overdueInstallments, lowStockItems, expiringItems, pendingAppointments, followUpTasks] = await Promise.all([
    prisma.patient.findMany({
      where: { isActive: true },
      include: { appointments: { orderBy: { date: "desc" }, take: 1 }, transactions: { orderBy: { date: "desc" }, take: 1 } },
      orderBy: { name: "asc" },
    }),
    (prisma as any).financialInstallment.findMany({
      where: { status: "PENDING", dueDate: { lt: now } },
      include: { patient: { select: { id: true, name: true, phone: true } } },
      orderBy: { dueDate: "asc" },
      take: 50,
    }),
    prisma.inventoryItem.findMany({ orderBy: { product: "asc" } }).then((all) =>
      all.filter((item) => item.quantity <= item.minimumQuantity).slice(0, 50)
    ),
    prisma.inventoryItem.findMany({
      where: { expiresAt: { not: null, lte: expiringLimit } },
      orderBy: { expiresAt: "asc" },
      take: 50,
    }),
    prisma.appointment.findMany({
      where: { status: { in: ["SCHEDULED", "CONFIRMED", "RETURN", "FIT_IN"] }, date: { gte: now, lte: addDays(now, 15) } },
      include: { patient: { select: { id: true, name: true, phone: true } } },
      orderBy: { date: "asc" },
      take: 50,
    }),
    (prisma as any).postProcedureTask.findMany({
      where: { status: "PENDING", dueDate: { gte: addDays(now, -2), lte: addDays(now, 15) } },
      include: { patient: { select: { id: true, name: true, phone: true } }, treatment: true },
      orderBy: { dueDate: "asc" },
      take: 50,
    }),
  ]);

  const patientsForReactivation = patients
    .map((patient) => {
      const lastAppointment = patient.appointments[0]?.date || null;
      const lastTransaction = patient.transactions[0]?.date || null;
      const lastInteraction = [lastAppointment, lastTransaction, patient.createdAt].filter(Boolean).sort((a, b) => new Date(b as Date).getTime() - new Date(a as Date).getTime())[0] as Date;
      return { id: patient.id, name: patient.name, phone: patient.phone, crmStatus: patient.crmStatus, lastInteraction };
    })
    .filter((patient) => new Date(patient.lastInteraction).getTime() <= inactiveLimit.getTime())
    .slice(0, 50);

  const birthdays = patients
    .filter((patient) => {
      if (!patient.birthDate) return false;
      const birth = new Date(patient.birthDate);
      const birthdayThisYear = new Date(now.getFullYear(), birth.getMonth(), birth.getDate());
      return birthdayThisYear >= now && birthdayThisYear <= addDays(now, 30);
    })
    .map((patient) => ({ id: patient.id, name: patient.name, phone: patient.phone, birthDate: patient.birthDate }));

  return NextResponse.json({
    generatedAt: now.toISOString(),
    inactiveDays,
    counts: {
      patientsForReactivation: patientsForReactivation.length,
      overdueInstallments: overdueInstallments.length,
      lowStockItems: lowStockItems.length,
      expiringItems: expiringItems.length,
      upcomingAppointments: pendingAppointments.length,
      followUpTasks: followUpTasks.length,
      birthdays: birthdays.length,
    },
    patientsForReactivation,
    overdueInstallments,
    lowStockItems,
    expiringItems,
    upcomingAppointments: pendingAppointments,
    followUpTasks,
    birthdays,
    whatsappTemplates: {
      reactivation: "Oi, [nome]. Tudo bem? Aqui é da clínica da Dra. Mariana. Passamos para saber como você está e te lembrar que já faz um tempinho desde o seu último atendimento. Caso queira, podemos agendar uma avaliação para acompanhar sua evolução e ajustar seu plano de cuidados.",
      overdue: "Oi, [nome]. Tudo bem? Identificamos uma parcela pendente no sistema da clínica. Pode nos chamar por aqui para conferirmos juntas a melhor forma de regularizar?",
      returnReminder: "Oi, [nome]. Tudo bem? A Dra. Mariana pediu para te lembrar do seu retorno/acompanhamento. Podemos verificar um horário para você?",
    },
  });
}
