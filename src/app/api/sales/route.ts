import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get('patientId');

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
}
