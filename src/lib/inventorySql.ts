import { randomUUID } from "crypto";

type PrismaLike = {
  $executeRawUnsafe: (query: string, ...values: any[]) => Promise<any>;
  $queryRawUnsafe: (query: string, ...values: any[]) => Promise<any>;
};

export type InventoryItemPayload = {
  product: string;
  category?: string | null;
  linkedProcedure?: string | null;
  supplier?: string | null;
  entryQuantity?: number;
  quantity: number;
  entryDate?: string | Date | null;
  batch?: string | null;
  expiresAt?: string | Date | null;
  minimumQuantity: number;
  unitValue: number;
  applicationMaterials?: string | null;
  applicationMaterialsValue?: number;
  status?: string | null;
  patientName?: string | null;
  exitDate?: string | Date | null;
  notes?: string | null;
};

function toDateOrNull(value?: string | Date | null) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function ensureInventoryItemExtendedColumns(client: PrismaLike) {
  await client.$executeRawUnsafe(`
    ALTER TABLE "InventoryItem"
    ADD COLUMN IF NOT EXISTS "category" TEXT,
    ADD COLUMN IF NOT EXISTS "linkedProcedure" TEXT,
    ADD COLUMN IF NOT EXISTS "entryQuantity" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "entryDate" TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS "applicationMaterials" TEXT,
    ADD COLUMN IF NOT EXISTS "applicationMaterialsValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'DISPONIVEL',
    ADD COLUMN IF NOT EXISTS "patientName" TEXT,
    ADD COLUMN IF NOT EXISTS "exitDate" TIMESTAMP(3)
  `);

  await client.$executeRawUnsafe(`
    UPDATE "InventoryItem"
    SET "entryQuantity" = "quantity"
    WHERE "entryQuantity" = 0 AND "quantity" > 0
  `);
}

export async function findInventoryItemsRaw(client: PrismaLike) {
  await ensureInventoryItemExtendedColumns(client);

  return client.$queryRawUnsafe(`
    SELECT
      "id",
      "product",
      "category",
      "linkedProcedure",
      "supplier",
      "entryQuantity",
      "quantity",
      "entryDate",
      "batch",
      "expiresAt",
      "minimumQuantity",
      "unitValue",
      "applicationMaterials",
      "applicationMaterialsValue",
      "status",
      "patientName",
      "exitDate",
      "notes",
      "createdAt",
      "updatedAt"
    FROM "InventoryItem"
    ORDER BY "expiresAt" ASC NULLS LAST, "product" ASC
  `);
}

export async function createInventoryItemRaw(client: PrismaLike, payload: InventoryItemPayload) {
  await ensureInventoryItemExtendedColumns(client);

  const entryQuantity = payload.entryQuantity ?? payload.quantity;
  const id = randomUUID();

  const rows = await client.$queryRawUnsafe(
    `
      INSERT INTO "InventoryItem" (
        "id",
        "product",
        "category",
        "linkedProcedure",
        "supplier",
        "entryQuantity",
        "quantity",
        "entryDate",
        "batch",
        "expiresAt",
        "minimumQuantity",
        "unitValue",
        "applicationMaterials",
        "applicationMaterialsValue",
        "status",
        "patientName",
        "exitDate",
        "notes",
        "createdAt",
        "updatedAt"
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, NOW(), NOW()
      )
      RETURNING *
    `,
    id,
    payload.product,
    payload.category ?? null,
    payload.linkedProcedure ?? null,
    payload.supplier ?? null,
    entryQuantity,
    payload.quantity,
    toDateOrNull(payload.entryDate),
    payload.batch ?? null,
    toDateOrNull(payload.expiresAt),
    payload.minimumQuantity,
    payload.unitValue,
    payload.applicationMaterials ?? null,
    payload.applicationMaterialsValue ?? 0,
    payload.status || "DISPONIVEL",
    payload.patientName ?? null,
    toDateOrNull(payload.exitDate),
    payload.notes ?? null
  );

  return Array.isArray(rows) ? rows[0] : rows;
}

export async function updateInventoryItemRaw(client: PrismaLike, id: string, payload: Partial<InventoryItemPayload>) {
  await ensureInventoryItemExtendedColumns(client);

  const allowed = [
    "product",
    "category",
    "linkedProcedure",
    "supplier",
    "entryQuantity",
    "quantity",
    "entryDate",
    "batch",
    "expiresAt",
    "minimumQuantity",
    "unitValue",
    "applicationMaterials",
    "applicationMaterialsValue",
    "status",
    "patientName",
    "exitDate",
    "notes",
  ] as const;

  const values: any[] = [];
  const sets: string[] = [];

  for (const key of allowed) {
    if (!(key in payload)) continue;

    let value: any = (payload as any)[key];
    if (key === "entryDate" || key === "expiresAt" || key === "exitDate") {
      value = toDateOrNull(value);
    }

    values.push(value ?? null);
    sets.push(`"${key}" = $${values.length}`);
  }

  if (sets.length === 0) {
    const rows = await client.$queryRawUnsafe(`SELECT * FROM "InventoryItem" WHERE "id" = $1`, id);
    return Array.isArray(rows) ? rows[0] : rows;
  }

  values.push(id);

  const rows = await client.$queryRawUnsafe(
    `
      UPDATE "InventoryItem"
      SET ${sets.join(", ")}, "updatedAt" = NOW()
      WHERE "id" = $${values.length}
      RETURNING *
    `,
    ...values
  );

  return Array.isArray(rows) ? rows[0] : rows;
}

export async function reserveInventoryForAppointmentRaw(client: PrismaLike, params: {
  patientName: string;
  procedureName: string;
  appointmentDate: Date;
}) {
  await ensureInventoryItemExtendedColumns(client);

  const procedure = params.procedureName.trim();
  if (!procedure) return null;

  const rows = await client.$queryRawUnsafe(
    `
      SELECT *
      FROM "InventoryItem"
      WHERE
        "quantity" > 0
        AND COALESCE("status", 'DISPONIVEL') IN ('DISPONIVEL', 'RESERVADO')
        AND (
          "linkedProcedure" ILIKE $1
          OR "product" ILIKE $1
        )
      ORDER BY "expiresAt" ASC NULLS LAST, "createdAt" ASC
      LIMIT 1
    `,
    `%${procedure}%`
  );

  const item = Array.isArray(rows) ? rows[0] : null;
  if (!item) return null;

  const updateRows = await client.$queryRawUnsafe(
    `
      UPDATE "InventoryItem"
      SET
        "status" = 'RESERVADO',
        "patientName" = $1,
        "exitDate" = $2,
        "linkedProcedure" = COALESCE("linkedProcedure", $3),
        "notes" = CASE
          WHEN "notes" IS NULL OR "notes" = '' THEN $4
          ELSE "notes" || E'\n\n' || $4
        END,
        "updatedAt" = NOW()
      WHERE "id" = $5
      RETURNING *
    `,
    params.patientName,
    params.appointmentDate,
    procedure,
    `Reservado automaticamente pela agenda para ${params.patientName} em ${params.appointmentDate.toLocaleDateString("pt-BR")} - ${procedure}.`,
    item.id
  );

  return Array.isArray(updateRows) ? updateRows[0] : updateRows;
}
