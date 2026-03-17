import { prisma } from "@/lib/prisma";

export class BlockedTimeConflictError extends Error {
  constructor(message = "Horário bloqueado") {
    super(message);
    this.name = "BlockedTimeConflictError";
  }
}

type CreateBlockedTimeInput = {
  start: Date | string;
  end: Date | string;
  reason?: string | null;
};

type UpdateBlockedTimeInput = Partial<CreateBlockedTimeInput>;

function toDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}

function rangesOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && bStart < aEnd;
}

async function assertNoBlockedOverlap(
  start: Date,
  end: Date,
  excludeId?: string
) {
  const existing = await prisma.blockedTime.findMany({
    where: {
      id: excludeId ? { not: excludeId } : undefined,
      start: { lt: end },
      end: { gt: start },
    },
    orderBy: { start: "asc" },
  });

  const hasOverlap = existing.some((b) =>
    rangesOverlap(b.start, b.end, start, end)
  );

  if (hasOverlap) {
    throw new BlockedTimeConflictError("Já existe um bloqueio nesse intervalo.");
  }
}

export async function createBlockedTime(data: CreateBlockedTimeInput) {
  const start = toDate(data.start);
  const end = toDate(data.end);

  if (end <= start) {
    throw new Error("O horário final deve ser maior que o inicial.");
  }

  await assertNoBlockedOverlap(start, end);

  return prisma.blockedTime.create({
    data: {
      start,
      end,
      reason: data.reason ?? null,
    },
  });
}

export async function getBlockedTimes(dateFrom?: Date, dateTo?: Date) {
  return prisma.blockedTime.findMany({
    where:
      dateFrom || dateTo
        ? {
            start: dateTo ? { lt: dateTo } : undefined,
            end: dateFrom ? { gt: dateFrom } : undefined,
          }
        : undefined,
    orderBy: { start: "asc" },
  });
}

export async function listBlockedTimes(dateFrom?: string, dateTo?: string) {
  return prisma.blockedTime.findMany({
    where:
      dateFrom || dateTo
        ? {
            start: dateTo ? { lt: new Date(dateTo) } : undefined,
            end: dateFrom ? { gt: new Date(dateFrom) } : undefined,
          }
        : undefined,
    orderBy: { start: "asc" },
  });
}

export async function getBlockedTimeById(id: string) {
  return prisma.blockedTime.findUnique({
    where: { id },
  });
}

export async function updateBlockedTime(id: string, data: UpdateBlockedTimeInput) {
  const current = await prisma.blockedTime.findUnique({
    where: { id },
  });

  if (!current) {
    throw new Error("Bloqueio não encontrado");
  }

  const nextStart = data.start ? toDate(data.start) : current.start;
  const nextEnd = data.end ? toDate(data.end) : current.end;

  if (nextEnd <= nextStart) {
    throw new Error("O horário final deve ser maior que o inicial.");
  }

  await assertNoBlockedOverlap(nextStart, nextEnd, id);

  return prisma.blockedTime.update({
    where: { id },
    data: {
      ...(data.start !== undefined ? { start: nextStart } : {}),
      ...(data.end !== undefined ? { end: nextEnd } : {}),
      ...(data.reason !== undefined ? { reason: data.reason ?? null } : {}),
    },
  });
}

export async function deleteBlockedTime(id: string) {
  return prisma.blockedTime.delete({
    where: { id },
  });
}

export async function assertNotBlocked(start: Date, end: Date) {
  const blockedTimes = await prisma.blockedTime.findMany({
    where: {
      start: { lt: end },
      end: { gt: start },
    },
    orderBy: { start: "asc" },
  });

  const conflict = blockedTimes.find((b) =>
    rangesOverlap(b.start, b.end, start, end)
  );

  if (conflict) {
    throw new BlockedTimeConflictError(
      conflict.reason
        ? `Horário bloqueado: ${conflict.reason}`
        : "Horário bloqueado."
    );
  }
}