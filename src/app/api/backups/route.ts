import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

async function exportData() {
  const [patients, appointments, transactions, installments, inventory, movements, treatments, plans, evolutions, tasks, templates, goals, auditLogs] = await Promise.all([
    prisma.patient.findMany({ include: { anamnesis: true, photos: true } }),
    prisma.appointment.findMany(),
    prisma.financialTransaction.findMany({ include: { installments: true } }),
    (prisma as any).financialInstallment.findMany(),
    prisma.inventoryItem.findMany(),
    (prisma as any).inventoryMovement.findMany(),
    prisma.treatment.findMany({ include: { costItems: true } }),
    (prisma as any).treatmentPlan.findMany({ include: { steps: true } }),
    (prisma as any).structuredClinicalEvolution.findMany(),
    (prisma as any).postProcedureTask.findMany(),
    (prisma as any).whatsAppTemplate.findMany(),
    (prisma as any).businessGoal.findMany(),
    (prisma as any).auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 500 }),
  ]);
  return { generatedAt: new Date().toISOString(), system: "Mariana Thomaz Carmona Clinic", patients, appointments, transactions, installments, inventory, movements, treatments, plans, evolutions, tasks, templates, goals, auditLogs };
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const url = new URL(req.url);
  if (url.searchParams.get("export") === "json") {
    const data = await exportData();
    return new NextResponse(JSON.stringify(data, null, 2), { headers: { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": `attachment; filename=backup-mariana-${Date.now()}.json` } });
  }
  const backups = await (prisma as any).backupHistory.findMany({ orderBy: { createdAt: "desc" }, take: 30 });
  return NextResponse.json(backups);
}

export async function POST(_: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const data = await exportData();
  const json = JSON.stringify(data);
  const backup = await (prisma as any).backupHistory.create({ data: { type: "MANUAL", target: "LOCAL_JSON", status: "SUCCESS", sizeLabel: `${Math.ceil(Buffer.byteLength(json, "utf8") / 1024)} KB` } });
  await createAuditLog({ action: "BACKUP", entity: "BackupHistory", entityId: backup.id, description: "Backup manual gerado em JSON.", contextJson: { sizeLabel: backup.sizeLabel } });
  return NextResponse.json({ backup, downloadUrl: "/api/backups?export=json" }, { status: 201 });
}
