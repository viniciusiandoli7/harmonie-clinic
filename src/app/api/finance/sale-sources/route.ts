import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { ensureProductionSchema } from "@/lib/productionSchemaSql";
import { ensureFinancialTransactionsForSales } from "@/lib/financeRepairSql";

export const dynamic = "force-dynamic";

function asArray(value: any) {
  return Array.isArray(value) ? value : [];
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    await ensureProductionSchema(prisma as any);
    await ensureFinancialTransactionsForSales(prisma as any);

    const contracts = await (prisma as any).$queryRawUnsafe(`
      SELECT
        c."id",
        c."patientId",
        c."title",
        c."content",
        c."total",
        c."status",
        c."itemsJson",
        c."createdAt",
        json_build_object('id', p."id", 'name', p."name", 'phone', p."phone") AS "patient"
      FROM "PatientContract" c
      LEFT JOIN "Patient" p ON p."id" = c."patientId"
      ORDER BY c."createdAt" DESC
      LIMIT 500
    `);

    const sales = await (prisma as any).$queryRawUnsafe(`
      SELECT
        s."id",
        s."patientId",
        s."price",
        s."discount",
        s."finalPrice",
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
            'method', sp."method"
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
      patient: contract.patient,
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
      patient: sale.patient,
      title: "Venda lançada",
      content: "",
      total: Number(sale.finalPrice ?? sale.price ?? 0),
      status: "SALE",
      itemsJson: asArray(sale.itemsJson),
      payments: asArray(sale.payments),
    }));

    const contractKeys = new Set(
      normalizedContracts.map((contract: any) => `${contract.patientId}|${Number(contract.total || 0).toFixed(2)}|${new Date(contract.createdAt).toISOString().slice(0, 10)}`)
    );

    const salesOnlyWhenNeeded = normalizedSales.filter((sale: any) => {
      const key = `${sale.patientId}|${Number(sale.total || 0).toFixed(2)}|${new Date(sale.createdAt).toISOString().slice(0, 10)}`;
      return !contractKeys.has(key);
    });

    return NextResponse.json([...normalizedContracts, ...salesOnlyWhenNeeded]);
  } catch (error: any) {
    console.error("Erro ao listar contratos/vendas para financeiro:", error);
    return NextResponse.json({ error: error?.message || "Erro ao listar contratos/vendas." }, { status: 500 });
  }
}
