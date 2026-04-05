import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const body = await request.json();
    const { patientId, items, subtotal, discount, total, paymentMethod } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Carrinho vazio." }, { status: 400 });
    }

    const repasse = total * 0.25; 
    const lucroReal = total - repasse;

    const generalTreatmentName = items.map((i: any) => i.description).join(" + ").substring(0, 100);

    const result = await prisma.$transaction(async (tx) => {
      
      const prof = await tx.professional.upsert({
        where: { id: "mariana_id" },
        update: {},
        create: { id: "mariana_id", name: "Dra. Mariana", commission: 0.25 }
      });

      const treat = await tx.treatment.upsert({
        where: { name: "Procedimentos Estéticos" },
        update: {},
        create: { name: "Procedimentos Estéticos", template: `Contrato Múltiplo` }
      });

      const sale = await tx.sale.create({
        data: {
          patientId,
          serviceId: treat.id,
          professionalId: prof.id,
          price: subtotal,
          discount: discount || 0,
          finalPrice: total,
          paymentMethod,
        },
      });

      await Promise.all(
        items.map((item: any) => 
          tx.saleItem.create({
            data: {
              saleId: sale.id,
              productName: `${item.description} ${item.observation ? `(${item.observation})` : ''}`,
              quantity: item.quantity,
              unitPrice: item.price,
              totalPrice: item.price * item.quantity,
              commission: (item.price * item.quantity) * 0.25, 
            }
          })
        )
      );

      // Limpamos profit e patientId que não pertencem mais a essa tabela isolada
      await tx.financialTransaction.create({
        data: {
          type: "INCOME",
          category: "PROCEDIMENTO",
          description: `Venda Multi: ${generalTreatmentName}`,
          amount: total,
          date: new Date(),
        }
      });

      // Limpamos status e total e aplicamos o connect no paciente
      await tx.patientContract.create({
        data: {
          patient: { connect: { id: patientId } },
          title: `Contrato Múltiplo - ${dataAtual()}`,
          content: `Contrato de prestação de serviços estéticos gerado via PDV.`,
          token: `CTR-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          itemsJson: items,
        }
      });

      await Promise.all(
        items.map((item: any) => 
          tx.clinicalEvolutionPlan.create({
            data: {
              patientId,
              treatmentName: item.description,
              packageName: item.observation || "Sessão Avulsa",
              totalSessions: item.quantity, 
              completedSessions: 0,
              status: "ACTIVE",
              goals: "Definido no fechamento da venda (PDV)."
            }
          })
        )
      );

      await tx.clinicalEvolution.create({
        data: {
          patientId,
          content: `CONTRATO FECHADO: ${generalTreatmentName}. Valor: R$ ${total.toLocaleString('pt-BR')}. Protocolos iniciados.`,
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

function dataAtual() {
  const d = new Date();
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth()+1).toString().padStart(2, '0')}/${d.getFullYear()}`;
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