import { prisma } from "@/lib/prisma";

type AuditInput = {
  action: string;
  entity: string;
  entityId?: string | null;
  description?: string | null;
  userName?: string | null;
  beforeJson?: unknown;
  afterJson?: unknown;
  contextJson?: unknown;
};

export async function createAuditLog(input: AuditInput) {
  try {
    return await (prisma as any).auditLog.create({
      data: {
        action: input.action,
        entity: input.entity,
        entityId: input.entityId || null,
        description: input.description || null,
        userName: input.userName || "Dra. Mariana",
        beforeJson: input.beforeJson === undefined ? undefined : (input.beforeJson as any),
        afterJson: input.afterJson === undefined ? undefined : (input.afterJson as any),
        contextJson: input.contextJson === undefined ? undefined : (input.contextJson as any),
      },
    });
  } catch (error) {
    console.error("Falha ao registrar auditoria:", error);
    return null;
  }
}
