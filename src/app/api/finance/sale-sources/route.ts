import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { ensureProductionSchema } from "@/lib/productionSchemaSql";
import { safeQuery } from "@/lib/safeSql";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function asArray(value: any) {
  return Array.isArray(value) ? value : [];
}

function normalizePatient(patient: any, fallbackId?: string | null) {
  if (patient && typeof patient === "object") return patient;
  return fallbackId ? { id: fallbackId, name: "Paciente" } : null;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    await ensureProductionSchema(prisma as any);

    const contracts = await safeQuery<any>(prisma as any, `
      SELECT
        c."id",
        c."patientId",
        COALESCE(c."title", 'Contrato') AS "title",
        COALESCE(c."content", '') AS "content",
        COALESCE(c."total", 0) AS "total",
        COALESCE(c."status"::text, 'PENDING') AS "status",
        COALESCE(c."itemsJson", '[]'::jsonb) AS "itemsJson",
        c."createdAt",
        json_build_object('id', p."id", 'name', p."name", 'phone', p."phone") AS "patient"
      FROM "PatientContract" c
      LEFT JOIN "Patient" p ON p."id" = c."patientId"
      ORDER BY c."createdAt" DESC
      LIMIT 500
    `);

    const sales = await safeQuery<any>(prisma as any, `
      SELECT
        s."id",
        s."patientId",
        COALESCE(s."price", 0) AS "price",
        COALESCE(s."discount", 0) AS "discount",
        COALESCE(s."finalPrice", s."price", 0) AS "finalPrice",
        s."createdAt",
        json_build_object('id', p."id", 'name', p."name", 'phone', p."phone") AS "patient",
        COALESCE((
          SELECT json_agg(json_build_object(
            'id', si."id",
            'description', si."productName",
            'productName', si."productName",
            'quantity', si."quantity",
            'unitPrice', si."unitPrice",
            'total', si."totalPrice",
            'totalPrice', si."totalPrice"
          ) ORDER BY si."productName")
          FROM "SaleItem" si
          WHERE si."saleId" = s."id"
        ), '[]'::json) AS "itemsJson",
        COALESCE((
          SELECT json_agg(json_build_object(
            'id', sp."id",
            'amount', sp."amount",
            'method', sp."method"::text
          ))
          FROM "SalePayment" sp
          WHERE sp."saleId" = s."id"
        ), '[]'::json) AS "payments"
      FROM "Sale" s
      LEFT JOIN "Patient" p ON p."id" = s."patientId"
      ORDER BY s."createdAt" DESC
      LIMIT 500
    `);

    const normalizedContracts = asArray(contracts).map((contract: any) => ({
      id: `contract:${contract.id}`,
      sourceType: "CONTRACT",
      contractId: contract.id,
      saleId: null,
      createdAt: contract.createdAt,
      patientId: contract.patientId,
      patient: normalizePatient(contract.patient, contract.patientId),
      title: contract.title || "Contrato",
      content: contract.content || "",
      total: Number(contract.total || 0),
      status: contract.status || "PENDING",
      itemsJson: asArray(contract.itemsJson),
      payments: [],
    }));

    const normalizedSales = asArray(sales).map((sale: any) => ({
      id: `sale:${sale.id}`,
      sourceType: "SALE",
      contractId: null,
      saleId: sale.id,
      createdAt: sale.createdAt,
      patientId: sale.patientId,
      patient: normalizePatient(sale.patient, sale.patientId),
      title: "Venda lançada",
      content: "",
      total: Number(sale.finalPrice ?? sale.price ?? 0),
      status: "SALE",
      itemsJson: asArray(sale.itemsJson),
      payments: asArray(sale.payments),
    }));

    return NextResponse.json([...normalizedContracts, ...normalizedSales], {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error: any) {
    console.error("Erro ao listar contratos/vendas para financeiro:", error);
    return NextResponse.json({ error: error?.message || "Erro ao listar contratos/vendas." }, { status: 500 });
  }
}
