import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { buildContractHtml } from "@/lib/contracts";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

function paymentMethodLabel(value: string) {
  if (value === "CREDIT_CARD") return "Cartão de Crédito";
  if (value === "DEBIT_CARD") return "Cartão de Débito";
  if (value === "PIX") return "Pix";
  if (value === "CASH") return "Dinheiro";
  if (value === "BANK_SLIP") return "Boleto";
  if (value === "BANK_TRANSFER") return "Transferência";
  return "Outro";
}

export async function POST(req: NextRequest) {
  // BLOQUEIO DE SEGURANÇA
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();

    const patientId = String(body.patientId || "");
    const items = Array.isArray(body.items) ? body.items : [];
    const subtotal = Number(body.subtotal || 0);
    const discount = Number(body.discount || 0);
    const total = Number(body.total || 0);
    const paymentMethod = String(body.paymentMethod || "OTHER");
    const paymentDetails = String(body.paymentDetails || "");
    const title = String(body.title || "Contrato de Prestação de Serviços");

    if (!patientId) {
      return NextResponse.json({ error: "patientId é obrigatório." }, { status: 400 });
    }

    if (items.length === 0) {
      return NextResponse.json({ error: "Itens do contrato são obrigatórios." }, { status: 400 });
    }

    // Busca o paciente para pegar os dados reais para o contrato
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      return NextResponse.json({ error: "Paciente não encontrado." }, { status: 404 });
    }

    // Gera o HTML do contrato usando a sua biblioteca de suporte
    const content = buildContractHtml({
      patient: {
        name: patient.name,
        email: patient.email,
        phone: patient.phone,
        birthDate: patient.birthDate,
        cpf: (body.cpf as string) || "",
        rg: (body.rg as string) || "",
      },
      clinic: {
        companyName: "Thomaz & Carmona LTDA",
        cnpj: "57.007.483/0001-73",
        address: "Avenida Coronel Sezefredo Fagundes, Nº 2168 - Jardim Leonor",
        email: "thomazcarmona1@gmail.com",
      },
      items,
      subtotal,
      discount,
      total,
      paymentMethodLabel: paymentMethodLabel(paymentMethod),
      paymentDetails,
      contractDate: new Date(),
    });

    // Gera um token limpo (sem hífens) para a URL de assinatura
    const token = randomUUID().replace(/-/g, "");

    const contract = await prisma.patientContract.create({
      data: {
        token,
        patientId,
        title,
        content,
        subtotal,
        discount,
        total,
        paymentMethod: paymentMethod as any,
        paymentDetails,
        itemsJson: items,
      },
    });

    return NextResponse.json(contract, { status: 201 });
  } catch (error) {
    console.error("Erro ao gerar contrato:", error);
    return NextResponse.json(
      { error: "Erro ao gerar contrato." },
      { status: 500 }
    );
  }
}