import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const activeOnly = searchParams.get('activeOnly') === 'true';

    if (id) {
      // Get single professional
      const professional = await prisma.professional.findUnique({
        where: { id },
        include: {
          saleItems: {
            include: {
              sale: true,
            },
          },
        },
      });

      if (!professional) {
        return NextResponse.json({ error: 'Professional not found' }, { status: 404 });
      }

      return NextResponse.json(professional);
    } else {
      // Get all professionals
      const professionals = await prisma.professional.findMany({
        where: activeOnly ? { isActive: true } : undefined,
        include: {
          _count: {
            select: {
              saleItems: true,
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      });

      return NextResponse.json(professionals);
    }
  } catch (error) {
    console.error('Error fetching professionals:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, commission, isActive } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const professional = await prisma.professional.create({
      data: {
        name,
        commission: commission ?? 0.25, // Default 25%
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json(professional);
  } catch (error) {
    console.error('Error creating professional:', error);
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, commission, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'Professional ID is required' }, { status: 400 });
    }

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const professional = await prisma.professional.update({
      where: { id },
      data: {
        name,
        commission,
        isActive,
      },
    });

    return NextResponse.json(professional);
  } catch (error) {
    console.error('Error updating professional:', error);
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json({ error: 'Professional not found' }, { status: 404 });
    }
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Professional ID is required' }, { status: 400 });
    }

    // Check if professional has any sales
    const saleItemsCount = await prisma.saleItem.count({
      where: { professionalId: id },
    });

    if (saleItemsCount > 0) {
      return NextResponse.json({
        error: 'Cannot delete professional with existing sales. Deactivate instead.'
      }, { status: 400 });
    }

    await prisma.professional.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Professional deleted successfully' });
  } catch (error) {
    console.error('Error deleting professional:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}