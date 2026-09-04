import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { buildContractHtml } from "@/lib/contracts";
import { CONTRACTOR_INFO, formatContractNumber, getContractUseByDate } from "@/lib/contractLegalCore";
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



async function listContractsRaw() {
  const rows = await (prisma as any).$queryRawUnsafe(`
    SELECT
      c.*,
      json_build_object('id', p."id", 'name', p."name", 'phone', p."phone") AS "patient"
    FROM "PatientContract" c
    LEFT JOIN "Patient" p ON p."id" = c."patientId"
    ORDER BY c."createdAt" DESC
  `);

  return Array.isArray(rows) ? rows : [];
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const contracts = await prisma.patientContract.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        patient: { select: { id: true, name: true, phone: true } },
      },
    });

    return NextResponse.json(contracts);
  } catch (error) {
    console.warn("Listagem de contratos via Prisma falhou; usando consulta segura:", error);
    try {
      return NextResponse.json(await listContractsRaw());
    } catch (rawError) {
      console.error("Erro ao listar contratos:", rawError);
      return NextResponse.json({ error: "Erro ao listar contratos." }, { status: 500 });
    }
  }
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
    const rawItems = Array.isArray(body.items) ? body.items : [];
    const items = rawItems.map((item: any) => {
      const quantity = Math.max(1, Math.floor(Number(item.quantity || 1)));
      const unitPrice = Number(item.unitPrice ?? item.price ?? 0) || 0;
      const lineTotal = unitPrice * quantity;
      return {
        description: String(item.description || item.productName || "Procedimento"),
        quantity,
        unitPrice,
        total: Math.round(lineTotal * 100) / 100,
        observation: item.observation ? String(item.observation) : "",
      };
    });
    const subtotal = Math.round(items.reduce((sum: number, item: any) => sum + Number(item.total || 0), 0) * 100) / 100;
    const discount = Math.round(Math.min(subtotal, Math.max(0, Number(body.discount || 0))) * 100) / 100;
    const total = Math.round(Math.max(0, subtotal - discount) * 100) / 100;
    const paymentMethod = String(body.paymentMethod || "OTHER");
    const paymentDetails = String(body.paymentDetails || "");
    const title = String(body.title || "Contrato de Prestação de Serviços Estéticos");

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

    const token = randomUUID().replace(/-/g, "");
    const contractDate = new Date();
    const contractNumber = formatContractNumber(token, contractDate);
    const validUntil = getContractUseByDate(contractDate);

    // Gera o HTML do contrato usando a mesma fonte de valores que será persistida.
    const content = buildContractHtml({
      patient: {
        name: patient.name,
        email: patient.email,
        phone: patient.phone,
        birthDate: patient.birthDate,
        cpf: patient.cpf || (body.cpf as string) || "",
        rg: patient.rg || (body.rg as string) || "",
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
      paymentMethodLabel: paymentMethodLabel(paymentMethod),
      paymentDetails,
      contractDate,
      contractToken: token,
      contractNumber,
      validUntil,
    });

    const contract = await prisma.patientContract.create({
      data: {
        patientId,
        title,
        content,
        total,
        token: token,
        contractNumber,
        validUntil,
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