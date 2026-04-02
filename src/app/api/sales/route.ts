import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const patientId = searchParams.get('patientId');

    if (id) {
      // Get single sale
      const sale = await prisma.sale.findUnique({
        where: { id },
        include: {
          patient: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          service: {
            select: {
              id: true,
              name: true,
            },
          },
          professional: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!sale) {
        return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
      }

      return NextResponse.json(sale);
    } else {
      // Get all sales, optionally filtered by patient
      const sales = await prisma.sale.findMany({
        where: patientId ? { patientId } : undefined,
        include: {
          patient: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          service: {
            select: {
              id: true,
              name: true,
            },
          },
          professional: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return NextResponse.json(sales);
    }
  } catch (error) {
    console.error('Error fetching sales:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { patientId, serviceId, professionalId, quantity, price, discount, paymentMethod } = body;

    if (!patientId || !serviceId || !professionalId) {
      return NextResponse.json({ error: 'Dados obrigatórios faltando' }, { status: 400 });
    }

    const finalPrice = (price * (quantity || 1)) - (discount || 0);

    const sale = await prisma.sale.create({
      data: {
        patientId,
        serviceId,
        professionalId,
        quantity: quantity || 1,
        price,
        discount: discount || 0,
        finalPrice,
        paymentMethod,
      },
    });

    return NextResponse.json(sale);
  } catch (error) {
    console.error('Erro ao criar venda:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}