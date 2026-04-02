import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

type SaleItem = {
  description: string;
  quantity: number;
  unitPrice: number;
};

function buildContractContent(params: {
  patientName: string;
  cpf?: string | null;
  rg?: string | null;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  paymentDetails?: string | null;
}) {
  const itemsText = params.items
    .map(
      (item, index) =>
        `${index + 1}. ${item.description} - Qtd: ${item.quantity} - Valor unitário: R$ ${item.unitPrice.toFixed(
          2
        )} - Total: R$ ${(item.quantity * item.unitPrice).toFixed(2)}`
    )
    .join("\n");

  return `
CONTRATO DE PRESTAÇÃO DE SERVIÇOS ESTÉTICOS

Paciente: ${params.patientName}
CPF: ${params.cpf || "Não informado"}
RG: ${params.rg || "Não informado"}

ITENS CONTRATADOS
${itemsText}

RESUMO FINANCEIRO
Subtotal: R$ ${params.subtotal.toFixed(2)}
Desconto: R$ ${params.discount.toFixed(2)}
Total: R$ ${params.total.toFixed(2)}

FORMA DE PAGAMENTO
${params.paymentMethod}${params.paymentDetails ? ` - ${params.paymentDetails}` : ""}

Declaro estar de acordo com os serviços contratados, valores, orientações e condições apresentadas neste documento.
`.trim();
}

function mapPaymentMethod(value: string) {
  const normalized = String(value || "").toUpperCase();

  if (normalized === "CREDIT_CARD") return "CREDIT_CARD";
  if (normalized === "DEBIT_CARD") return "DEBIT_CARD";
  if (normalized === "PIX") return "PIX";
  if (normalized === "CASH") return "CASH";
  if (normalized === "BANK_SLIP") return "BANK_SLIP";
  if (normalized === "BANK_TRANSFER") return "BANK_TRANSFER";
  return "OTHER";
}

function buildWhatsAppUrl(phone: string, message: string) {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

export async function POST(req: NextRequest) {
  // BLOQUEIO DE SEGURANÇA
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();

    const patientId = String(body.patientId || "").trim();
    const cpf = String(body.cpf || "").trim() || null;
    const rg = String(body.rg || "").trim() || null;
    const treatmentName = String(body.treatmentName || "").trim();
    const packageName = String(body.packageName || "").trim() || null;
    const totalSessions = Number(body.totalSessions || 1);
    const goals = String(body.goals || "").trim() || null;
    const notes = String(body.notes || "").trim() || null;
    const paymentMethod = mapPaymentMethod(body.paymentMethod);
    const paymentDetails = String(body.paymentDetails || "").trim() || null;
    const discount = Number(body.discount || 0);

    const receivedAmountInput = Number(body.receivedAmount || 0);
    const clinicCommissionPctInput = Number(body.clinicCommissionPct || 25);
    const operationalCostInput = Number(body.operationalCost || 0);

    const items = Array.isArray(body.items) ? body.items : [];

    if (!patientId) {
      return NextResponse.json(
        { error: "patientId é obrigatório." },
        { status: 400 }
      );
    }

    if (!items.length) {
      return NextResponse.json(
        { error: "Informe ao menos um item." },
        { status: 400 }
      );
    }

    const normalizedItems: SaleItem[] = items
      .map((item: SaleItem) => ({
        description: String(item.description || "").trim(),
        quantity: Number(item.quantity || 0),
        unitPrice: Number(item.unitPrice || 0),
      }))
      .filter((item) => item.description && item.quantity > 0);

    if (!normalizedItems.length) {
      return NextResponse.json({ error: "Itens inválidos." }, { status: 400 });
    }

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      return NextResponse.json(
        { error: "Paciente não encontrado." },
        { status: 404 }
      );
    }

    const subtotal = normalizedItems.reduce(
      (acc, item) => acc + item.quantity * item.unitPrice,
      0
    );

    const grossAmount = round2(Math.max(0, subtotal - discount));
    const receivedAmount = round2(
      Math.min(grossAmount, Math.max(0, receivedAmountInput || grossAmount))
    );
    const pendingAmount = round2(Math.max(0, grossAmount - receivedAmount));

    const clinicCommissionPct = round2(
      Math.max(0, clinicCommissionPctInput || 25)
    );
    const clinicCommissionValue = round2(
      receivedAmount * (clinicCommissionPct / 100)
    );
    const professionalValue = round2(
      Math.max(0, receivedAmount - clinicCommissionValue)
    );

    const operationalCost = round2(Math.max(0, operationalCostInput || 0));
    const clinicProfit = round2(clinicCommissionValue - operationalCost);

    const saleDescription =
      normalizedItems.length === 1
        ? normalizedItems[0].description
        : `${normalizedItems[0].description} + ${
            normalizedItems.length - 1
          } item(ns)`;

    const contractToken = randomUUID();

    const contractContent = buildContractContent({
      patientName: patient.name,
      cpf,
      rg,
      items: normalizedItems,
      subtotal,
      discount,
      total: grossAmount,
      paymentMethod,
      paymentDetails,
    });

    const result = await prisma.$transaction(async (tx) => {
      const transaction = await tx.financialTransaction.create({
        data: {
          date: new Date(),
          description: `Venda - ${patient.name} - ${saleDescription}`,
          category: "VENDA",
          amount: receivedAmount,
          type: "INCOME",
          grossAmount,
          receivedAmount,
          pendingAmount,
          clinicCommissionPct,
          clinicCommissionValue,
          professionalValue,
          operationalCost,
          clinicProfit,
          notes: notes || null,
        },
      });

      const contract = await tx.patientContract.create({
        data: {
          token: contractToken,
          patientId: patient.id,
          title: `Contrato - ${patient.name} - ${saleDescription}`,
          content: contractContent,
          subtotal,
          discount,
          total: grossAmount,
          paymentMethod,
          paymentDetails,
          itemsJson: normalizedItems,
        },
      });

      let evolutionPlan = null;

      if (treatmentName) {
        evolutionPlan = await tx.clinicalEvolutionPlan.create({
          data: {
            patientId: patient.id,
            treatmentName,
            packageName,
            totalSessions: totalSessions > 0 ? totalSessions : 1,
            goals,
            notes,
          },
        });
      }

      return {
        transaction,
        contract,
        evolutionPlan,
      };
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
    const contractLink = `${baseUrl}/sign/contract/${result.contract.token}`;

    const contractMessage = [
      `Olá ${patient.name}, segue o seu contrato para conferência e assinatura:`,
      contractLink,
    ].join("\n\n");

    const reminderMessage = [
      `Olá ${patient.name}, seu plano foi cadastrado com sucesso.`,
      treatmentName ? `Tratamento: ${treatmentName}` : "",
      totalSessions ? `Total de sessões: ${totalSessions}` : "",
      "Em breve entraremos em contato para o agendamento das próximas sessões.",
    ]
      .filter(Boolean)
      .join("\n");

    return NextResponse.json({
      success: true,
      transactionId: result.transaction.id,
      contractId: result.contract.id,
      evolutionPlanId: result.evolutionPlan?.id ?? null,
      contractLink,
      whatsappContractLink: patient.phone
        ? buildWhatsAppUrl(patient.phone, contractMessage)
        : null,
      whatsappReminderLink: patient.phone
        ? buildWhatsAppUrl(patient.phone, reminderMessage)
        : null,
      clinicWhatsappLink: "https://wa.me/5511967239595",
      finance: {
        grossAmount,
        receivedAmount,
        pendingAmount,
        clinicCommissionPct,
        clinicCommissionValue,
        professionalValue,
        operationalCost,
        clinicProfit,
      },
    });
  } catch (error) {
    console.error("Erro ao fechar venda:", error);
    return NextResponse.json(
      { error: "Erro ao fechar venda automática." },
      { status: 500 }
    );
  }
}