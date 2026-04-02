import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const body = await request.json();
    const { patientId, treatmentName, price, discount, paymentMethod } = body;

    const finalPrice = Number(price) - (Number(discount) || 0);
    const repasse = finalPrice * 0.25; 
    const lucroReal = finalPrice - repasse;

    const result = await prisma.$transaction(async (tx) => {
      
      // 1. Garante Profissional e Tratamento
      const prof = await tx.professional.upsert({
        where: { id: "mariana_id" },
        update: {},
        create: { id: "mariana_id", name: "Dra. Mariana", commission: 0.25 }
      });

      const treat = await tx.treatment.upsert({
        where: { name: treatmentName },
        update: {},
        create: { name: treatmentName, template: `Contrato padrão para ${treatmentName}` }
      });

      // 2. Registra a VENDA
      const sale = await tx.sale.create({
        data: {
          patientId,
          serviceId: treat.id,
          professionalId: prof.id,
          price: Number(price),
          discount: Number(discount) || 0,
          finalPrice,
          paymentMethod,
        },
      });

      // 3. Registra no FINANCEIRO (Dashboard)
      await tx.financialTransaction.create({
        data: {
          type: "INCOME",
          category: "PROCEDIMENTO",
          description: `Venda: ${treatmentName}`,
          amount: finalPrice,
          profit: lucroReal,
          patientId,
          date: new Date(),
        }
      });

      // 4. Gera o CONTRATO DIGITAL (Aparece na ficha)
      await tx.patientContract.create({
        data: {
          patientId,
          title: `Contrato - ${treatmentName}`,
          content: `Contrato de prestação de serviços estéticos para o procedimento ${treatmentName}...`,
          total: finalPrice,
          token: `CTR-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          itemsJson: { treatment: treatmentName, value: finalPrice },
          status: "SIGNED"
        }
      });

      // 5. Cria o PROTOCOLO CLÍNICO (Aba Protocolo)
      await tx.clinicalEvolutionPlan.create({
        data: {
          patientId,
          treatmentName,
          totalSessions: 1, // Pode ajustar conforme sua lógica
          completedSessions: 0,
          status: "ACTIVE",
          goals: "Definido no fechamento da venda."
        }
      });

      // 6. Registra no PRONTUÁRIO (Aba Prontuário)
      await tx.clinicalEvolution.create({
        data: {
          patientId,
          content: `CONTRATO FECHADO: ${treatmentName}. Valor: R$ ${finalPrice.toLocaleString('pt-BR')}. Protocolo de tratamento iniciado.`,
          type: "SALE_RECORD",
        }
      });

      return sale;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Erro na integração master:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const sales = await prisma.sale.findMany({
      where: patientId ? { patientId } : undefined,
      include: { service: true },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(sales);
}