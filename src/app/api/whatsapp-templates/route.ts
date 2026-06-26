import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

const defaultTemplates = [
  { category: "Confirmação", title: "Confirmação de consulta", content: "Oi, [primeiroNome]. Tudo bem? Passando para confirmar sua consulta com a Dra. Mariana no dia [data]. Qualquer dúvida, pode me chamar por aqui." },
  { category: "Pré-procedimento", title: "Orientações pré-procedimento", content: "Oi, [primeiroNome]. Para o seu [procedimento], venha sem maquiagem na região e avise caso tenha usado algum medicamento novo, vacina recente, infecção, herpes ativa ou alguma alteração de saúde." },
  { category: "Pós-procedimento", title: "Acompanhamento pós", content: "Oi, [primeiroNome]. Tudo bem? A Dra. Mariana pediu para saber como você está depois do [procedimento]. Caso tenha qualquer desconforto fora do esperado, nos avise por aqui." },
  { category: "Retorno", title: "Lembrete de retorno", content: "Oi, [primeiroNome]. Tudo bem? Está chegando o momento do seu retorno/acompanhamento de [procedimento]. Podemos verificar um horário para você?" },
  { category: "Reativação", title: "Paciente inativa", content: "Oi, [primeiroNome]. Tudo bem? Aqui é da clínica da Dra. Mariana. Faz um tempinho desde seu último atendimento e queríamos saber como você está. Podemos agendar uma avaliação para acompanhar sua evolução e ajustar seu plano de cuidados?" },
  { category: "Avaliação", title: "Avaliação que não fechou", content: "Oi, [primeiroNome]. Tudo bem? Passando para saber se ficou alguma dúvida sobre o plano que a Dra. Mariana montou para você. Podemos conversar e ajustar as etapas conforme seu momento." },
  { category: "Feedback", title: "Pedido de feedback", content: "Oi, [primeiroNome]. Como você se sentiu com sua experiência na clínica? Seu feedback ajuda muito a Dra. Mariana a manter um atendimento cada vez mais cuidadoso." },
  { category: "Cobrança", title: "Cobrança delicada", content: "Oi, [primeiroNome]. Tudo bem? Identificamos uma pendência em aberto no sistema da clínica. Pode nos chamar por aqui para conferirmos juntas a melhor forma de regularizar?" },
];

async function ensureDefaults() {
  const count = await (prisma as any).whatsAppTemplate.count();
  if (count === 0) {
    await (prisma as any).whatsAppTemplate.createMany({ data: defaultTemplates, skipDuplicates: true });
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  await ensureDefaults();
  const url = new URL(req.url);
  const category = url.searchParams.get("category");
  const templates = await (prisma as any).whatsAppTemplate.findMany({
    where: { isActive: true, ...(category ? { category } : {}) },
    orderBy: [{ category: "asc" }, { title: "asc" }],
  });
  return NextResponse.json(templates);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const body = await req.json();
  const template = await (prisma as any).whatsAppTemplate.create({
    data: {
      category: body.category || "Geral",
      title: body.title || "Nova mensagem",
      content: body.content || "",
      isActive: body.isActive ?? true,
    },
  });
  await createAuditLog({ action: "CREATE", entity: "WhatsAppTemplate", entityId: template.id, description: `Mensagem pronta criada: ${template.title}`, afterJson: template });
  return NextResponse.json(template, { status: 201 });
}
