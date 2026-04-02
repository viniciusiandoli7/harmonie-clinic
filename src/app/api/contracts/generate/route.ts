import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { saleId } = await req.json();

  // Busca a venda sem include
  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
  });

  if (!sale) {
    return new Response("Venda não encontrada", { status: 404 });
  }

  // Busca os dados relacionados manualmente
  const patient = await prisma.patient.findUnique({ where: { id: sale.patientId } });
  const service = await prisma.treatment.findUnique({ where: { id: sale.serviceId } });
  const professional = await prisma.professional.findUnique({ where: { id: sale.professionalId } });

  const patientName = patient?.name ?? "Não informado";
  const patientCpf = patient?.cpf ?? "Não informado";
  const serviceName = service?.name ?? "Não informado";
  const professionalName = professional?.name ?? "Não informado";
  const finalPrice = typeof sale.finalPrice === 'number' ? sale.finalPrice.toFixed(2) : "0.00";

  const content = `
CONTRATO DE PRESTAÇÃO DE SERVIÇOS\n\nCliente: ${patientName}\nCPF: ${patientCpf}\n\nServiço: ${serviceName}\nValor: R$ ${finalPrice}\n\nProfissional: ${professionalName}\n`;

  const contract = await prisma.patientContract.create({
    data: {
      patientId: sale.patientId,
      title: serviceName,
      content,
      subtotal: sale.price ?? 0,
      discount: sale.discount ?? 0,
      total: sale.finalPrice ?? 0,
      paymentMethod: sale.paymentMethod,
      itemsJson: JSON.stringify({
        service: serviceName,
        quantity: sale.quantity ?? 1,
        price: sale.price ?? 0,
        discount: sale.discount ?? 0,
      }),
      status: "PENDING",
    } as any, // Bypass type checking for now
  });

  return new Response(JSON.stringify(contract), { status: 201 });
}