import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

type NotificationItem = {
  id: string;
  type: "alert" | "activity";
  severity: "danger" | "warning" | "success" | "info" | "neutral";
  title: string;
  message: string;
  href?: string;
  createdAt: string;
  dueAt?: string | null;
  group: string;
};

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function safeDate(date?: Date | string | null) {
  if (!date) return new Date().toISOString();
  return new Date(date).toISOString();
}

function firstName(name?: string | null) {
  return name?.split(" ").filter(Boolean)[0] || "Paciente";
}

function hrefForAudit(entity?: string | null, entityId?: string | null) {
  const normalized = (entity || "").toLowerCase();
  if (normalized.includes("patient") && entityId) return `/patients/${entityId}`;
  if (normalized.includes("appointment")) return "/appointments";
  if (normalized.includes("financial") || normalized.includes("sale") || normalized.includes("installment")) return "/finance";
  if (normalized.includes("inventory")) return "/inventory";
  if (normalized.includes("treatment") || normalized.includes("procedure")) return "/procedures";
  if (normalized.includes("backup") || normalized.includes("goal") || normalized.includes("template")) return "/settings";
  return undefined;
}

function actionTitle(action?: string | null, entity?: string | null) {
  const label = entity || "registro";
  const actionUpper = (action || "").toUpperCase();
  if (actionUpper.includes("CREATE")) return "Novo registro criado";
  if (actionUpper.includes("UPDATE")) return "Registro atualizado";
  if (actionUpper.includes("DELETE")) return "Registro removido";
  if (actionUpper.includes("CLOSE")) return "Fechamento realizado";
  if (actionUpper.includes("PAID") || actionUpper.includes("PAY")) return "Pagamento atualizado";
  if (actionUpper.includes("BACKUP")) return "Backup realizado";
  return `Atividade em ${label}`;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const url = new URL(req.url);
  const inactiveDays = Number(url.searchParams.get("inactiveDays") || 90);
  const take = Math.min(Number(url.searchParams.get("take") || 30), 80);
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const inactiveLimit = addDays(now, -inactiveDays);
  const expiringLimit = addDays(now, 60);
  const tomorrowLimit = addDays(now, 2);
  const followUpLimit = addDays(now, 15);
  const birthdayLimit = addDays(now, 30);

  const [patients, overdueInstallments, lowStockItems, expiringItems, upcomingAppointments, followUpTasks, auditLogs] = await Promise.all([
    prisma.patient.findMany({
      where: { isActive: true },
      include: {
        appointments: { orderBy: { date: "desc" }, take: 1 },
        transactions: { orderBy: { date: "desc" }, take: 1 },
      },
      orderBy: { name: "asc" },
      take: 300,
    }),
    (prisma as any).financialInstallment.findMany({
      where: { status: "PENDING", dueDate: { lt: now } },
      include: { patient: { select: { id: true, name: true, phone: true } } },
      orderBy: { dueDate: "asc" },
      take: 20,
    }),
    prisma.inventoryItem.findMany({ orderBy: { product: "asc" }, take: 200 }).then((all) =>
      all.filter((item) => item.quantity <= item.minimumQuantity).slice(0, 20)
    ),
    prisma.inventoryItem.findMany({
      where: { expiresAt: { not: null, lte: expiringLimit } },
      orderBy: { expiresAt: "asc" },
      take: 20,
    }),
    prisma.appointment.findMany({
      where: {
        status: { in: ["SCHEDULED", "CONFIRMED", "RETURN", "FIT_IN"] },
        date: { gte: now, lte: tomorrowLimit },
      },
      include: { patient: { select: { id: true, name: true, phone: true } } },
      orderBy: { date: "asc" },
      take: 20,
    }),
    (prisma as any).postProcedureTask.findMany({
      where: { status: "PENDING", dueDate: { gte: addDays(now, -2), lte: followUpLimit } },
      include: { patient: { select: { id: true, name: true, phone: true } }, treatment: true },
      orderBy: { dueDate: "asc" },
      take: 20,
    }),
    (prisma as any).auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const items: NotificationItem[] = [];

  patients
    .map((patient) => {
      const lastAppointment = patient.appointments[0]?.date || null;
      const lastTransaction = patient.transactions[0]?.date || null;
      const lastInteraction = [lastAppointment, lastTransaction, patient.createdAt]
        .filter(Boolean)
        .sort((a, b) => new Date(b as Date).getTime() - new Date(a as Date).getTime())[0] as Date;
      return { id: patient.id, name: patient.name, lastInteraction };
    })
    .filter((patient) => new Date(patient.lastInteraction).getTime() <= inactiveLimit.getTime())
    .slice(0, 12)
    .forEach((patient) => {
      items.push({
        id: `reactivation-${patient.id}-${safeDate(patient.lastInteraction).slice(0, 10)}`,
        type: "alert",
        severity: "info",
        title: "Paciente para reativação",
        message: `${patient.name} está há ${inactiveDays}+ dias sem nova interação.`,
        href: `/patients/${patient.id}`,
        createdAt: safeDate(patient.lastInteraction),
        dueAt: safeDate(patient.lastInteraction),
        group: "Relacionamento",
      });
    });

  patients
    .filter((patient) => {
      if (!patient.birthDate) return false;
      const birth = new Date(patient.birthDate);
      const birthdayThisYear = new Date(now.getFullYear(), birth.getMonth(), birth.getDate());
      return birthdayThisYear >= startOfToday && birthdayThisYear <= birthdayLimit;
    })
    .slice(0, 12)
    .forEach((patient) => {
      const birth = new Date(patient.birthDate as Date);
      const birthdayThisYear = new Date(now.getFullYear(), birth.getMonth(), birth.getDate());
      items.push({
        id: `birthday-${patient.id}-${now.getFullYear()}`,
        type: "alert",
        severity: "success",
        title: "Aniversário próximo",
        message: `${firstName(patient.name)} faz aniversário em ${birthdayThisYear.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}.`,
        href: `/patients/${patient.id}`,
        createdAt: now.toISOString(),
        dueAt: birthdayThisYear.toISOString(),
        group: "Relacionamento",
      });
    });

  overdueInstallments.forEach((installment: any) => {
    items.push({
      id: `installment-overdue-${installment.id}`,
      type: "alert",
      severity: "danger",
      title: "Parcela vencida",
      message: `${installment.description} ${installment.patient?.name ? `• ${installment.patient.name}` : ""}`.trim(),
      href: installment.patientId ? `/patients/${installment.patientId}` : "/finance",
      createdAt: safeDate(installment.createdAt),
      dueAt: safeDate(installment.dueDate),
      group: "Financeiro",
    });
  });

  lowStockItems.forEach((item) => {
    items.push({
      id: `low-stock-${item.id}-${item.quantity}`,
      type: "alert",
      severity: "warning",
      title: "Estoque baixo",
      message: `${item.product}: ${item.quantity} em estoque. Mínimo: ${item.minimumQuantity}.`,
      href: "/inventory",
      createdAt: safeDate(item.updatedAt),
      group: "Estoque",
    });
  });

  expiringItems.forEach((item) => {
    items.push({
      id: `expiring-item-${item.id}-${safeDate(item.expiresAt).slice(0, 10)}`,
      type: "alert",
      severity: "warning",
      title: "Produto perto do vencimento",
      message: `${item.product} vence em ${item.expiresAt ? new Date(item.expiresAt).toLocaleDateString("pt-BR") : "breve"}.`,
      href: "/inventory",
      createdAt: safeDate(item.updatedAt),
      dueAt: safeDate(item.expiresAt),
      group: "Estoque",
    });
  });

  upcomingAppointments.forEach((appointment) => {
    items.push({
      id: `appointment-${appointment.id}`,
      type: "alert",
      severity: "info",
      title: "Consulta próxima",
      message: `${appointment.patient?.name || "Paciente"} • ${appointment.procedureName || "Consulta"}`,
      href: "/appointments",
      createdAt: safeDate(appointment.createdAt),
      dueAt: safeDate(appointment.date),
      group: "Agenda",
    });
  });

  followUpTasks.forEach((task: any) => {
    items.push({
      id: `follow-up-${task.id}`,
      type: "alert",
      severity: "info",
      title: "Acompanhamento pendente",
      message: `${task.title}${task.patient?.name ? ` • ${task.patient.name}` : ""}`,
      href: task.patientId ? `/patients/${task.patientId}` : "/patients",
      createdAt: safeDate(task.createdAt),
      dueAt: safeDate(task.dueDate),
      group: "Pós-procedimento",
    });
  });

  auditLogs.forEach((log: any) => {
    items.push({
      id: `audit-${log.id}`,
      type: "activity",
      severity: "neutral",
      title: actionTitle(log.action, log.entity),
      message: log.description || `${log.userName || "Sistema"} registrou uma atividade em ${log.entity}.`,
      href: hrefForAudit(log.entity, log.entityId),
      createdAt: safeDate(log.createdAt),
      group: "Atividades",
    });
  });

  const severityWeight: Record<NotificationItem["severity"], number> = {
    danger: 5,
    warning: 4,
    info: 3,
    success: 2,
    neutral: 1,
  };

  const ordered = items
    .sort((a, b) => {
      const severityDiff = severityWeight[b.severity] - severityWeight[a.severity];
      if (severityDiff !== 0) return severityDiff;
      return new Date(b.dueAt || b.createdAt).getTime() - new Date(a.dueAt || a.createdAt).getTime();
    })
    .slice(0, take);

  return NextResponse.json({
    generatedAt: now.toISOString(),
    inactiveDays,
    count: ordered.length,
    items: ordered,
  });
}
