import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const body = await request.json();
    
    // 👈 NOVIDADE: Recebendo o contractToken do frontend
    const { patientId, items, subtotal, discount, total, payments, contractToken } = body;

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
          patientId, serviceId: treat.id, professionalId: prof.id, price: subtotal,
          discount: discount || 0, finalPrice: total,
          payments: {
            create: payments && payments.length > 0 ? payments.map((p: any) => ({ amount: p.amount, method: p.method })) : []
          }
        },
      });

      await Promise.all(
        items.map((item: any) => 
          tx.saleItem.create({
            data: {
              saleId: sale.id, productName: `${item.description} ${item.observation ? `(${item.observation})` : ''}`,
              quantity: item.quantity, unitPrice: item.price, totalPrice: item.price * item.quantity,
              commission: (item.price * item.quantity) * 0.25, 
            }
          })
        )
      );

      const financialTransaction = await tx.financialTransaction.create({
        data: {
          type: "INCOME",
          category: "PROCEDIMENTO",
          description: `Venda Multi: ${generalTreatmentName}`,
          amount: total,
          grossAmount: total,
          feeAmount: 0,
          netAmount: lucroReal,
          commissionAmount: repasse,
          profit: lucroReal,
          patientId,
          saleId: sale.id,
          date: new Date(),
          status: payments && payments.length > 0 ? "PAID" : "PENDING",
          paidAt: payments && payments.length > 0 ? new Date() : null,
        }
      });

      if (payments && payments.length > 0) {
        await Promise.all(payments.map((p: any, index: number) =>
          (tx as any).financialInstallment.create({
            data: {
              transactionId: financialTransaction.id,
              saleId: sale.id,
              patientId,
              description: `Venda Multi: ${generalTreatmentName} (${index + 1}/${payments.length})`,
              installmentNumber: index + 1,
              totalInstallments: payments.length,
              amount: Number(p.amount || 0),
              feeAmount: 0,
              netAmount: Number(p.amount || 0),
              dueDate: new Date(),
              status: "PAID",
              paidAt: new Date(),
              paymentMethod: p.method || null,
            }
          })
        ));
      }

      await tx.patientContract.create({
        data: {
          patientId,
          title: `Contrato Múltiplo - ${dataAtual()}`,
          content: `Contrato de prestação de serviços estéticos gerado via PDV.`,
          total: total,
          token: contractToken || `CTR-${Math.random().toString(36).substr(2, 9).toUpperCase()}`, // 👈 Salva o Token do Frontend
          itemsJson: items,
          status: "PENDING",
          signatureName: null,
          signatureImage: null,
        }
      });

      await Promise.all(
        items.map((item: any) => 
          tx.clinicalEvolutionPlan.create({
            data: {
              patientId, treatmentName: item.description, packageName: item.observation || "Sessão Avulsa",
              totalSessions: item.quantity, completedSessions: 0, status: "ACTIVE",
              goals: "Definido no fechamento da venda (PDV)."
            }
          })
        )
      );

      await tx.clinicalEvolution.create({
        data: { patientId, content: `CONTRATO FECHADO: ${generalTreatmentName}. Valor: R$ ${total.toLocaleString('pt-BR')}. Protocolos iniciados.`, type: "SALE_RECORD", }
      });

      await (tx as any).auditLog.create({
        data: {
          action: "CREATE",
          entity: "Sale",
          entityId: sale.id,
          description: `Venda fechada: ${generalTreatmentName}`,
          userName: "Dra. Mariana",
          afterJson: { saleId: sale.id, patientId, total, items } as any,
        }
      });

      return sale;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Erro:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function dataAtual() {
  const d = new Date();
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth()+1).toString().padStart(2, '0')}/${d.getFullYear()}`;
}