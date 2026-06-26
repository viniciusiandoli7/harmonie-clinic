import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

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

export async function GET(_: NextRequest, context: Context) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

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

  const timeline = [
    item(patient.createdAt, "Cadastro", "Paciente cadastrada", patient.name, { patientId: patient.id }),
    ...appointments.map((a: any) => item(a.date, "Agenda", a.procedureName || "Consulta", a.status, { id: a.id, price: a.price })),
    ...transactions.map((t: any) => item(t.date, "Financeiro", t.description, `${t.type === "INCOME" ? "Entrada" : "Saída"} • ${t.status}`, { id: t.id, amount: t.amount, netAmount: t.netAmount })),
    ...evolutions.map((e: any) => item(e.createdAt, "Prontuário", e.type || "Evolução clínica", e.content?.slice(0, 160), { id: e.id, important: e.important })),
    ...contracts.map((c: any) => item(c.createdAt, "Documento", c.title || "Contrato", c.status, { id: c.id, total: c.total })),
    ...sales.map((s: any) => item(s.createdAt, "Venda", s.service?.name || "Venda", `R$ ${Number(s.finalPrice || 0).toLocaleString("pt-BR")}`, { id: s.id, items: s.saleItems?.length || 0 })),
    ...photos.map((p: any) => item(p.takenAt, "Foto", p.title || p.procedureName || "Registro clínico", p.imageAuthorized ? "Autorizada" : "Clínica", { id: p.id, photoType: p.photoType })),
    ...installments.map((p: any) => item(p.dueDate, "Parcela", p.description, p.status, { id: p.id, amount: p.amount, paidAt: p.paidAt })),
    ...movements.map((m: any) => item(m.date, "Estoque", `${m.type}: ${m.inventoryItem?.product || "Item"}`, m.reason, { id: m.id, quantity: m.quantity })),
    ...plans.map((p: any) => item(p.createdAt, "Plano", p.title, `${p.steps?.length || 0} etapas • R$ ${Number(p.totalEstimated || 0).toLocaleString("pt-BR")}`, { id: p.id, status: p.status })),
    ...structuredEvolutions.map((e: any) => item(e.createdAt, "Evolução estruturada", e.procedurePerformed, e.bodyArea || e.productUsed, { id: e.id, termSigned: e.termSigned, photosTaken: e.photosTaken })),
    ...tasks.map((t: any) => item(t.dueDate, "Acompanhamento", t.title, t.status, { id: t.id, completedAt: t.completedAt })),
    ...conversions.map((c: any) => item(c.evaluationDate, "Conversão", c.status, `Proposto R$ ${Number(c.proposedValue || 0).toLocaleString("pt-BR")} • Fechado R$ ${Number(c.closedValue || 0).toLocaleString("pt-BR")}`, { id: c.id })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return NextResponse.json({ patient, timeline });
}
