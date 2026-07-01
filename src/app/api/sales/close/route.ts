import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureProductionSchema } from "@/lib/productionSchemaSql";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { buildContractHtml } from "@/lib/contracts";
import { closeSaleRaw } from "@/lib/salesCloseSql";
import { getPatientDetailRaw } from "@/lib/patientRaw";

type RawSaleItem = {
  description?: string;
  productName?: string;
  observation?: string;
  professional?: string;
  quantity?: number | string;
  qty?: number | string;
  price?: number | string;
  unitPrice?: number | string;
  totalPrice?: number | string;
};

type RawPayment = {
  method?: string;
  paymentMethod?: string;
  amount?: number | string;
  installments?: number | string;
};

function toNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const normalized = value.replace(/\./g, "").replace(",", ".").trim();
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function round2(value: number) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function normalizePaymentMethod(method?: string) {
  const key = String(method || "").trim().toUpperCase();
  const map: Record<string, "CREDIT_CARD" | "DEBIT_CARD" | "PIX" | "CASH" | "BANK_SLIP" | "BANK_TRANSFER" | "OTHER"> = {
    PIX: "PIX",
    CARTAO_CREDITO: "CREDIT_CARD",
    CARTÃO_CREDITO: "CREDIT_CARD",
    CARTAO_DE_CREDITO: "CREDIT_CARD",
    CARTÃO_DE_CRÉDITO: "CREDIT_CARD",
    CREDIT_CARD: "CREDIT_CARD",
    CREDITO: "CREDIT_CARD",
    CRÉDITO: "CREDIT_CARD",
    CARTAO_DEBITO: "DEBIT_CARD",
    CARTÃO_DEBITO: "DEBIT_CARD",
    CARTAO_DE_DEBITO: "DEBIT_CARD",
    CARTÃO_DE_DÉBITO: "DEBIT_CARD",
    DEBIT_CARD: "DEBIT_CARD",
    DEBITO: "DEBIT_CARD",
    DÉBITO: "DEBIT_CARD",
    DINHEIRO: "CASH",
    CASH: "CASH",
    BOLETO: "BANK_SLIP",
    BANK_SLIP: "BANK_SLIP",
    TRANSFERENCIA: "BANK_TRANSFER",
    TRANSFERÊNCIA: "BANK_TRANSFER",
    BANK_TRANSFER: "BANK_TRANSFER",
  };
  return map[key] || "OTHER";
}

function normalizePaymentMethodLabel(method?: string) {
  const enumValue = normalizePaymentMethod(method);
  const map: Record<string, string> = {
    CREDIT_CARD: "Cartão de crédito",
    DEBIT_CARD: "Cartão de débito",
    PIX: "Pix",
    CASH: "Dinheiro",
    BANK_SLIP: "Boleto",
    BANK_TRANSFER: "Transferência",
    OTHER: "Outro",
  };
  return map[enumValue] || "Outro";
}

function sanitizeItems(items: RawSaleItem[]) {
  return items
    .map((item) => {
      const description = String(item.description || item.productName || "Procedimento").trim();
      const quantity = Math.max(1, Math.floor(toNumber(item.quantity ?? item.qty, 1)));
      const unitPrice = round2(toNumber(item.price ?? item.unitPrice, 0));
      const totalPrice = round2(toNumber(item.totalPrice, unitPrice * quantity) || unitPrice * quantity);
      const observation = item.observation ? String(item.observation).trim() : "";
      return { description, quantity, unitPrice, totalPrice, observation };
    })
    .filter((item) => item.description && item.quantity > 0 && item.unitPrice >= 0 && item.totalPrice > 0);
}

function sanitizePayments(payments: RawPayment[] | undefined, receivedAmount: number | undefined, paymentMethod: string | undefined, total: number) {
  const explicitPayments = Array.isArray(payments)
    ? payments
        .map((payment) => ({
          method: normalizePaymentMethod(payment.method || payment.paymentMethod),
          originalMethod: payment.method || payment.paymentMethod || "PIX",
          amount: round2(toNumber(payment.amount, 0)),
          installments: Math.max(1, Math.floor(toNumber(payment.installments, 1))),
        }))
        .filter((payment) => payment.amount > 0)
    : [];

  if (explicitPayments.length > 0) return explicitPayments;

  const received = round2(toNumber(receivedAmount, total));
  if (received > 0) {
    return [{ method: normalizePaymentMethod(paymentMethod), originalMethod: paymentMethod || "PIX", amount: Math.min(received, total), installments: 1 }];
  }

  return [];
}

function dataAtual() {
  const d = new Date();
  return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  await ensureProductionSchema(prisma as any);

  try {
    await ensureProductionSchema(prisma as any);
    const body = await request.json();
    const patientId = String(body.patientId || "").trim();

    if (!patientId) {
      return NextResponse.json({ error: "Selecione um paciente para fechar a venda." }, { status: 400 });
    }

    const patient = await getPatientDetailRaw(prisma as any, patientId);

    if (!patient) {
      return NextResponse.json({ error: "Paciente não encontrado. Atualize a página e tente novamente." }, { status: 404 });
    }

    const normalizedItems = sanitizeItems(Array.isArray(body.items) ? body.items : []);

    if (normalizedItems.length === 0) {
      return NextResponse.json({ error: "Adicione pelo menos um procedimento com valor maior que zero." }, { status: 400 });
    }

    const calculatedSubtotal = round2(normalizedItems.reduce((acc, item) => acc + item.totalPrice, 0));
    const subtotal = round2(toNumber(body.subtotal, calculatedSubtotal) || calculatedSubtotal);
    const discount = round2(Math.max(0, toNumber(body.discount, 0)));
    const finalTotal = round2(Math.max(0, toNumber(body.total, subtotal - discount) || subtotal - discount));

    if (finalTotal <= 0) {
      return NextResponse.json({ error: "O total da venda precisa ser maior que zero." }, { status: 400 });
    }

    const payments = sanitizePayments(body.payments, body.receivedAmount, body.paymentMethod, finalTotal);
    const totalPaid = round2(payments.reduce((acc, payment) => acc + payment.amount, 0));

    if (totalPaid - finalTotal > 0.01) {
      return NextResponse.json({ error: "O valor pago não pode ser maior que o total da venda." }, { status: 400 });
    }

    const clinicCommissionPct = Math.max(0, toNumber(body.clinicCommissionPct, 25));
    const commissionValue = round2(finalTotal * (clinicCommissionPct / 100));
    const operationalCost = round2(Math.max(0, toNumber(body.operationalCost, 0)));
    const clinicProfit = round2(commissionValue - operationalCost);
    const professionalValue = round2(finalTotal - commissionValue);
    const pendingAmount = round2(Math.max(0, finalTotal - totalPaid));
    const generalTreatmentName = normalizedItems.map((item) => item.description).join(" + ").substring(0, 120);
    const contractToken = String(body.contractToken || `CTR-${crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`).trim();
    const origin = request.nextUrl.origin;
    const paymentMethodLabel = payments.length
      ? payments.map((payment) => `${normalizePaymentMethodLabel(payment.originalMethod)} (${payment.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })})`).join(" | ")
      : "Bonificação";
    const contractItems = normalizedItems.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.totalPrice,
      observation: item.observation,
    }));
    const contractHtml = buildContractHtml({
      patient: {
        name: patient.name,
        email: patient.email,
        phone: patient.phone,
        birthDate: patient.birthDate,
        cpf: patient.cpf,
        rg: patient.rg,
      },
      clinic: {
        companyName: "Mariana Thomaz Carmona",
        cnpj: "57.007.483/0001-73",
        address: "Avenida Coronel Sezefredo Fagundes, Nº 2168",
        email: "contato@marianathomazcarmona.com",
      },
      items: contractItems,
      subtotal,
      discount,
      total: finalTotal,
      paymentMethodLabel,
      paymentDetails: "Pagamento registrado na data de fechamento da venda.",
      contractDate: new Date(),
    });

    const result = await closeSaleRaw(prisma as any, {
      patientId,
      subtotal,
      discount,
      finalTotal,
      payments,
      normalizedItems,
      clinicCommissionPct,
      commissionValue,
      operationalCost,
      clinicProfit,
      professionalValue,
      pendingAmount,
      generalTreatmentName,
      contractToken,
      contractHtml,
      bodyNotes: body.notes ? String(body.notes) : null,
      goals: body.goals ? String(body.goals) : null,
    });

    const contractLink = `${origin}/assinar-contrato/${result.contract.token}`;
    const phone = patient.phone ? patient.phone.replace(/\D/g, "") : "";
    const firstName = patient.name.split(" ")[0] || patient.name;
    const message = `Olá, ${firstName}! Seu procedimento com a Dra. Mariana Carmona foi registrado com sucesso. Segue o link seguro para assinar o contrato digital: ${contractLink}`;
    const whatsappContractLink = phone ? `https://api.whatsapp.com/send?phone=55${phone}&text=${encodeURIComponent(message)}` : null;

    return NextResponse.json({
      success: true,
      saleId: result.sale.id,
      contractId: result.contract.id,
      contractToken: result.contract.token,
      contractLink,
      whatsappContractLink,
      whatsappReminderLink: null,
      finance: {
        grossAmount: finalTotal,
        receivedAmount: totalPaid,
        pendingAmount,
        clinicCommissionPct,
        clinicCommissionValue: commissionValue,
        professionalValue,
        operationalCost,
        clinicProfit,
      },
    });
  } catch (error) {
    console.error("Erro ao fechar venda:", error);
    const message = error instanceof Error ? error.message : "Erro interno ao finalizar a venda.";
    return NextResponse.json({ error: `Não foi possível finalizar a venda. Detalhe: ${message}` }, { status: 500 });
  }
}
