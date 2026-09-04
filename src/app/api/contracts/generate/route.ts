import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { buildContractHtml } from "@/lib/contracts";
import { CONTRACTOR_INFO, formatContractNumber, getContractUseByDate } from "@/lib/contractLegalCore";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { saleId } = await req.json();
    const sale = await prisma.sale.findUnique({ where: { id: String(saleId || "") } });

    if (!sale) {
      return NextResponse.json({ error: "Venda não encontrada" }, { status: 404 });
    }

    const [patient, service] = await Promise.all([
      prisma.patient.findUnique({ where: { id: sale.patientId } }),
      prisma.treatment.findUnique({ where: { id: sale.serviceId } }),
    ]);

    if (!patient) {
      return NextResponse.json({ error: "Paciente não encontrado" }, { status: 404 });
    }

    const serviceName = service?.name ?? "Procedimento estético";
    const subtotal = Math.round(Number(sale.price || 0) * 100) / 100;
    const total = Math.round(Number(sale.finalPrice || 0) * 100) / 100;
    const discount = Math.round(Math.max(0, subtotal - total) * 100) / 100;
    const contractDate = new Date();
    const token = `CTR-${crypto.randomUUID().replace(/-/g, "").toUpperCase()}`;
    const contractNumber = formatContractNumber(token, contractDate);
    const validUntil = getContractUseByDate(contractDate);
    const items = [{
      description: serviceName,
      quantity: 1,
      unitPrice: subtotal,
      total: subtotal,
      observation: "",
    }];

    const content = buildContractHtml({
      patient: {
        name: patient.name,
        cpf: patient.cpf,
        rg: patient.rg,
        phone: patient.phone,
        birthDate: patient.birthDate,
        email: patient.email,
        address: patient.address,
        addressNumber: patient.addressNumber,
        addressComplement: patient.addressComplement,
        neighborhood: patient.neighborhood,
        city: patient.city,
        state: patient.state,
        zipCode: patient.zipCode,
      },
      clinic: CONTRACTOR_INFO,
      items,
      subtotal,
      discount,
      total,
      paymentMethodLabel: "Conforme venda registrada",
      paymentDetails: "Contrato gerado a partir da venda registrada no sistema.",
      contractDate,
      contractToken: token,
      contractNumber,
      validUntil,
    });

    const contract = await prisma.patientContract.create({
      data: {
        patientId: sale.patientId,
        title: "Contrato de Prestação de Serviços Estéticos",
        content,
        total,
        itemsJson: items,
        status: "PENDING",
        token,
        contractNumber,
        validUntil,
      },
    });

    return NextResponse.json(contract, { status: 201 });
  } catch (error) {
    console.error("Erro ao gerar contrato:", error);
    return NextResponse.json({ error: "Erro interno ao gerar contrato" }, { status: 500 });
  }
}
