import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: Request) {
  // BLOQUEIO DE SEGURANÇA
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { saleId } = await req.json();

    // 1. Busca a venda
    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
    });

    if (!sale) {
      return NextResponse.json({ error: "Venda não encontrada" }, { status: 404 });
    }

    // 2. Busca dados relacionados em paralelo
    const [patient, service, professional] = await Promise.all([
      prisma.patient.findUnique({ where: { id: sale.patientId } }),
      prisma.treatment.findUnique({ where: { id: sale.serviceId } }),
      prisma.professional.findUnique({ where: { id: sale.professionalId } }),
    ]);

    const patientName = patient?.name ?? "Não informado";
    const patientCpf = patient?.cpf ?? "Não informado";
    const serviceName = service?.name ?? "Não informado";
    const professionalName = professional?.name ?? "Não informado";
    
    // Garantindo que os valores sejam números
    const finalPrice = Number(sale.finalPrice || 0);
    const subtotal = Number(sale.price || 0);
    const discount = Number(sale.discount || 0);

    const content = `
CONTRATO DE PRESTAÇÃO DE SERVIÇOS

Cliente: ${patientName}
CPF: ${patientCpf}

Serviço: ${serviceName}
Valor: R$ ${finalPrice.toFixed(2)}

Profissional: ${professionalName}
`.trim();

    // 3. Criação do contrato com "as any" para ignorar o erro de tipagem temporariamente
    const contract = await prisma.patientContract.create({
      data: {
        patientId: sale.patientId,
        title: `Contrato - ${serviceName}`,
        content,
        subtotal: subtotal,
        discount: discount,
        total: finalPrice,
        paymentMethod: sale.paymentMethod,
        itemsJson: {
          service: serviceName,
          // @ts-ignore - Caso o campo quantity ainda não esteja mapeado
          quantity: sale.quantity || 1,
          price: subtotal,
          discount: discount,
        },
        status: "PENDING",
      } as any, 
    });

    return NextResponse.json(contract, { status: 201 });

  } catch (error) {
    console.error("Erro ao gerar contrato:", error);
    return NextResponse.json({ error: "Erro interno ao gerar contrato" }, { status: 500 });
  }
}