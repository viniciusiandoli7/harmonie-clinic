import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from '@/lib/prisma';
import { ensureProductionSchema } from '@/lib/productionSchemaSql';


async function listSalesRaw(patientId?: string | null) {
  const where = patientId ? `WHERE s."patientId" = $1` : "";
  const params = patientId ? [patientId] : [];

  const rows = await (prisma as any).$queryRawUnsafe(
    `
      SELECT
        s.*,
        json_build_object('id', p."id", 'name', p."name", 'phone', p."phone") AS "patient",
        COALESCE((
          SELECT json_agg(json_build_object(
            'id', si."id",
            'productName', si."productName",
            'quantity', si."quantity",
            'unitPrice', si."unitPrice",
            'totalPrice', si."totalPrice"
          ))
          FROM "SaleItem" si
          WHERE si."saleId" = s."id"
        ), '[]'::json) AS "saleItems",
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
      ${where}
      ORDER BY s."createdAt" DESC
    `,
    ...params
  );

  return Array.isArray(rows) ? rows : [];
}


export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  await ensureProductionSchema(prisma as any);

  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get('patientId');

  try {
    const sales = await prisma.sale.findMany({
      where: patientId ? { patientId } : undefined,
      include: {
        service: true,
        payments: true,
        installments: { orderBy: { dueDate: 'asc' } },
        saleItems: true,
        patient: { select: { id: true, name: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(sales);
  } catch (error) {
    console.warn("GET /api/sales via Prisma falhou; usando consulta segura:", error);
    try {
      return NextResponse.json(await listSalesRaw(patientId));
    } catch (rawError) {
      console.error("GET /api/sales fallback error:", rawError);
      return NextResponse.json({ error: "Erro ao listar vendas." }, { status: 500 });
    }
  }
}
