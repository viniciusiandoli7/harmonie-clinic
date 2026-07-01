import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { ensureProductionSchema } from "@/lib/productionSchemaSql";

type Context = { params: Promise<{ id: string }> };

function item(date: Date | string, type: string, title: string, detail?: string | null, metadata?: unknown) {
  return {
    date: new Date(date).toISOString(),
    type,
    title,
    detail: detail || null,
    metadata: metadata || null,
  };
}

function translateAppointmentStatus(status?: string | null, room?: string | null) {
  const map: Record<string, string> = {
    SCHEDULED: "Agendada",
    CONFIRMED: "Confirmada",
    COMPLETED: "Concluída",
    NO_SHOW: "Falta",
    RESCHEDULED: "Remarcada",
    CANCELED: "Cancelada",
    RETURN: "Retorno automático" + (room ? ` • Sala ${room}` : ""),
    FIT_IN: "Encaixe",
  };
  return map[String(status || "").toUpperCase()] || humanizeText(status || "Agendada");
}

function translatePaymentStatus(status?: string | null) {
  const map: Record<string, string> = {
    PENDING: "Pendente",
    PAID: "Pago",
    CANCELED: "Cancelado",
    CANCELLED: "Cancelado",
    OVERDUE: "Vencido",
  };
  return map[String(status || "").toUpperCase()] || humanizeText(status || "");
}

function translateContractStatus(status?: string | null) {
  const map: Record<string, string> = {
    PENDING: "Pendente",
    SIGNED: "Assinado",
    CANCELED: "Cancelado",
  };
  return map[String(status || "").toUpperCase()] || humanizeText(status || "");
}

function translateTaskStatus(status?: string | null) {
  const map: Record<string, string> = {
    PENDING: "Pendente",
    DONE: "Concluído",
    COMPLETED: "Concluído",
    CANCELED: "Cancelado",
  };
  return map[String(status || "").toUpperCase()] || humanizeText(status || "");
}

function translateMovementType(type?: string | null) {
  const map: Record<string, string> = {
    IN: "Entrada",
    OUT: "Saída",
    USE: "Uso em procedimento",
    LOSS: "Perda",
    EXPIRED: "Vencimento",
    ADJUSTMENT: "Ajuste manual",
    ENTRY: "Entrada",
    EXIT: "Saída",
  };
  return map[String(type || "").toUpperCase()] || humanizeText(type || "Movimentação");
}

function translatePlanStatus(status?: string | null) {
  const map: Record<string, string> = {
    ACTIVE: "Ativo",
    FINISHED: "Finalizado",
    CANCELED: "Cancelado",
    PENDING: "Pendente",
    ACCEPTED: "Aceito",
    DECLINED: "Recusado",
    POSTPONED: "Adiado",
    DONE: "Realizado",
  };
  return map[String(status || "").toUpperCase()] || humanizeText(status || "");
}

function translateConversionStatus(status?: string | null) {
  const map: Record<string, string> = {
    CLOSED_SAME_DAY: "Fechou no dia",
    CLOSED_LATER: "Fechou depois",
    FOLLOW_UP: "Acompanhar depois",
    LOST_EXPENSIVE: "Não fechou: achou caro",
    LOST_NO_INDICATION: "Não fechou: sem indicação no momento",
    LOST_OTHER: "Não fechou",
  };
  return map[String(status || "").toUpperCase()] || humanizeText(status || "Conversão");
}

function humanizeText(value?: string | null) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  const exact: Record<string, string> = {
    SALE_RECORD: "Venda registrada",
    STRUCTURED_RECORD: "Evolução estruturada",
    TREATMENT_PLAN_NOTE: "Observação do plano",
    INCOME: "Entrada",
    EXPENSE: "Saída",
    CREDIT_CARD: "Cartão de crédito",
    DEBIT_CARD: "Cartão de débito",
    BANK_SLIP: "Boleto",
    BANK_TRANSFER: "Transferência bancária",
    CASH: "Dinheiro",
    PIX: "Pix",
    OTHER: "Outros",
  };

  if (exact[raw.toUpperCase()]) return exact[raw.toUpperCase()];

  return raw
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function cleanTimelineText(value?: string | null) {
  const text = String(value || "").trim();
  if (!text) return null;

  return text
    .replace(/\bSALE_RECORD\b/g, "Venda registrada")
    .replace(/\bSTRUCTURED_RECORD\b/g, "Evolução estruturada")
    .replace(/\bTREATMENT_PLAN_NOTE\b/g, "Observação do plano")
    .replace(/\bPENDING\b/g, "Pendente")
    .replace(/\bPAID\b/g, "Pago")
    .replace(/\bSIGNED\b/g, "Assinado")
    .replace(/\bCANCELED\b/g, "Cancelado")
    .replace(/\bCANCELLED\b/g, "Cancelado")
    .replace(/\bACTIVE\b/g, "Ativo")
    .replace(/\bFINISHED\b/g, "Finalizado")
    .replace(/\bRETURN\b/g, "Retorno")
    .replace(/^VENDA FECHADA:/i, "Venda fechada:")
    .replace(/Total: R\$/i, "Total: R$");
}

export async function GET(_: NextRequest, context: Context) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  await ensureProductionSchema(prisma as any);

  const { id } = await context.params;
  const patient = await prisma.patient.findUnique({ where: { id }, select: { id: true, name: true, createdAt: true } });
  if (!patient) return NextResponse.json({ error: "Paciente não encontrada." }, { status: 404 });

  const [appointments, transactions, evolutions, contracts, sales, photos, installments, movements, plans, structuredEvolutions, tasks, conversions] = await Promise.all([
    prisma.appointment.findMany({ where: { patientId: id }, orderBy: { date: "desc" } }),
    prisma.financialTransaction.findMany({ where: { patientId: id }, orderBy: { date: "desc" } }),
    prisma.clinicalEvolution.findMany({ where: { patientId: id }, orderBy: { createdAt: "desc" } }),
    prisma.patientContract.findMany({ where: { patientId: id }, orderBy: { createdAt: "desc" } }),
    prisma.sale.findMany({ where: { patientId: id }, include: { service: true, saleItems: true }, orderBy: { createdAt: "desc" } }),
    (prisma as any).patientPhoto.findMany({ where: { patientId: id }, orderBy: { takenAt: "desc" } }),
    (prisma as any).financialInstallment.findMany({ where: { patientId: id }, orderBy: { dueDate: "desc" } }),
    (prisma as any).inventoryMovement.findMany({ where: { patientId: id }, include: { inventoryItem: true }, orderBy: { date: "desc" } }),
    (prisma as any).treatmentPlan.findMany({ where: { patientId: id }, include: { steps: true }, orderBy: { createdAt: "desc" } }),
    (prisma as any).structuredClinicalEvolution.findMany({ where: { patientId: id }, orderBy: { createdAt: "desc" } }),
    (prisma as any).postProcedureTask.findMany({ where: { patientId: id }, orderBy: { dueDate: "desc" } }),
    (prisma as any).evaluationConversion.findMany({ where: { patientId: id }, orderBy: { evaluationDate: "desc" } }),
  ]);

  const visibleTasks = tasks.filter((t: any) => !String(t.title || "").toLowerCase().startsWith("retorno"));

  function formatEvolutionTitle(type?: string | null) {
    if (type === "SALE_RECORD") return "Venda registrada";
    if (type === "STRUCTURED_RECORD") return "Evolução estruturada";
    if (type === "TREATMENT_PLAN_NOTE") return "Observação do plano";
    return cleanTimelineText(type) || "Evolução clínica";
  }

  function formatEvolutionDetail(content?: string | null) {
    return cleanTimelineText(content)?.slice(0, 180) || null;
  }

  const timeline = [
    item(patient.createdAt, "Cadastro", "Paciente cadastrada", patient.name, { patientId: patient.id }),
    ...appointments.map((a: any) => item(a.date, "Agenda", cleanTimelineText(a.procedureName) || "Consulta", translateAppointmentStatus(a.status, a.room), { id: a.id, price: a.price, room: a.room })),
    ...transactions.map((t: any) => item(t.date, "Financeiro", cleanTimelineText(t.description) || "Lançamento financeiro", `${t.type === "INCOME" ? "Entrada" : "Saída"} • ${translatePaymentStatus(t.status)}`, { id: t.id, amount: t.amount, netAmount: t.netAmount })),
    ...evolutions.map((e: any) => item(e.createdAt, "Prontuário", formatEvolutionTitle(e.type), formatEvolutionDetail(e.content), { id: e.id, important: e.important })),
    ...contracts.map((c: any) => item(c.createdAt, "Documento", cleanTimelineText(c.title) || "Contrato", translateContractStatus(c.status), { id: c.id, total: c.total })),
    ...sales.map((s: any) => item(s.createdAt, "Venda", cleanTimelineText(s.service?.name) || "Venda", `R$ ${Number(s.finalPrice || 0).toLocaleString("pt-BR")}`, { id: s.id, items: s.saleItems?.length || 0 })),
    ...photos.map((p: any) => item(p.takenAt, "Foto", cleanTimelineText(p.title || p.procedureName) || "Registro clínico", p.imageAuthorized ? "Autorizada" : "Clínica", { id: p.id, photoType: p.photoType })),
    ...installments.map((p: any) => item(p.dueDate, "Parcela", cleanTimelineText(p.description) || "Parcela", translatePaymentStatus(p.status), { id: p.id, amount: p.amount, paidAt: p.paidAt })),
    ...movements.map((m: any) => item(m.date, "Estoque", `${translateMovementType(m.type)}: ${cleanTimelineText(m.inventoryItem?.product) || "Item"}`, cleanTimelineText(m.reason), { id: m.id, quantity: m.quantity })),
    ...plans.map((p: any) => item(p.createdAt, "Plano", cleanTimelineText(p.title) || "Plano de tratamento", `${p.steps?.length || 0} etapas • ${translatePlanStatus(p.status)} • R$ ${Number(p.totalEstimated || 0).toLocaleString("pt-BR")}`, { id: p.id, status: p.status })),
    ...structuredEvolutions.map((e: any) => item(e.createdAt, "Evolução estruturada", cleanTimelineText(e.procedurePerformed) || "Evolução estruturada", cleanTimelineText(e.bodyArea || e.productUsed), { id: e.id, termSigned: e.termSigned, photosTaken: e.photosTaken })),
    ...visibleTasks.map((t: any) => item(t.dueDate, "Acompanhamento", cleanTimelineText(t.title) || "Acompanhamento", translateTaskStatus(t.status), { id: t.id, completedAt: t.completedAt })),
    ...conversions.map((c: any) => item(c.evaluationDate, "Conversão", translateConversionStatus(c.status), `Proposto R$ ${Number(c.proposedValue || 0).toLocaleString("pt-BR")} • Fechado R$ ${Number(c.closedValue || 0).toLocaleString("pt-BR")}`, { id: c.id })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return NextResponse.json({ patient, timeline });
}
