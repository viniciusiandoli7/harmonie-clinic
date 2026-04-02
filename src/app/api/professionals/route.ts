import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request: NextRequest) {
  // BLOQUEIO DE SEGURANÇA
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const activeOnly = searchParams.get('activeOnly') === 'true';

    if (id) {
      // Busca um profissional específico com histórico de vendas
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
        return NextResponse.json({ error: 'Profissional não encontrado' }, { status: 404 });
      }

      return NextResponse.json(professional);
    } else {
      // Lista todos os profissionais
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
    console.error('Erro ao buscar profissionais:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // BLOQUEIO DE SEGURANÇA
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, commission, isActive } = body;

    if (!name) {
      return NextResponse.json({ error: 'O nome é obrigatório' }, { status: 400 });
    }

    const professional = await prisma.professional.create({
      data: {
        name,
        commission: commission ?? 0.25, // Padrão de 25% de comissão
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json(professional, { status: 201 });
  } catch (error: any) {
    console.error('Erro ao criar profissional:', error);
    if (error?.message?.includes('Unique constraint')) {
      return NextResponse.json({ error: 'Este e-mail ou identificador já existe' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erro interno ao criar profissional' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  // BLOQUEIO DE SEGURANÇA
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, name, commission, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID do profissional é obrigatório' }, { status: 400 });
    }

    if (!name) {
      return NextResponse.json({ error: 'O nome é obrigatório' }, { status: 400 });
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
  } catch (error: any) {
    console.error('Erro ao atualizar profissional:', error);
    if (error?.message?.includes('Record to update not found')) {
      return NextResponse.json({ error: 'Profissional não encontrado' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Erro interno ao atualizar profissional' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  // BLOQUEIO DE SEGURANÇA
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID do profissional é obrigatório' }, { status: 400 });
    }

    // Verifica se o profissional tem vendas vinculadas para evitar quebra de integridade
    const saleItemsCount = await prisma.saleItem.count({
      where: { professionalId: id },
    });

    if (saleItemsCount > 0) {
      return NextResponse.json({
        error: 'Não é possível excluir: profissional possui vendas. Recomenda-se inativar o cadastro.'
      }, { status: 400 });
    }

    await prisma.professional.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Profissional removido com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir profissional:', error);
    return NextResponse.json({ error: 'Erro interno ao excluir profissional' }, { status: 500 });
  }
}