import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    
    const sales = await prisma.sale.findMany({
      where: patientId ? { patientId } : undefined,
      include: { 
        service: true,
        payments: true // Retorna a nova lista de pagamentos divididos!
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json(sales);
}