import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

const defaultTemplates = [
  {
    category: "Confirmação",
    title: "Confirmação de consulta",
    content:
      "Oi, [primeiroNome]. Tudo bem? Passando para confirmar sua consulta com a Dra. Mariana no dia [data], às [horario]. Qualquer dúvida, pode me chamar por aqui.",
    defaultTime: "",
  },
  {
    category: "Pré-procedimento",
    title: "Orientações pré-procedimento",
    content:
      "Oi, [primeiroNome]. Para o seu [procedimento], venha sem maquiagem na região e avise caso tenha usado algum medicamento novo, vacina recente, infecção, herpes ativa ou alguma alteração de saúde.",
    defaultTime: "",
  },
  {
    category: "Pós-procedimento",
    title: "Acompanhamento pós",
    content:
      "Oi, [primeiroNome]. Tudo bem? A Dra. Mariana pediu para saber como você está depois do [procedimento]. Caso tenha qualquer desconforto fora do esperado, nos avise por aqui.",
    defaultTime: "",
  },
  {
    category: "Retorno",
    title: "Lembrete de retorno",
    content:
      "Oi, [primeiroNome]. Tudo bem? Está chegando o momento do seu retorno/acompanhamento de [procedimento]. Podemos verificar um horário para você?",
    defaultTime: "",
  },
  {
    category: "Reativação",
    title: "Paciente inativa",
    content:
      "Oi, [primeiroNome]. Tudo bem? Aqui é da clínica da Dra. Mariana. Faz um tempinho desde seu último atendimento e queríamos saber como você está. Podemos agendar uma avaliação para acompanhar sua evolução e ajustar seu plano de cuidados?",
    defaultTime: "",
  },
  {
    category: "Avaliação",
    title: "Avaliação que não fechou",
    content:
      "Oi, [primeiroNome]. Tudo bem? Passando para saber se ficou alguma dúvida sobre o plano que a Dra. Mariana montou para você. Podemos conversar e ajustar as etapas conforme seu momento.",
    defaultTime: "",
  },
  {
    category: "Feedback",
    title: "Pedido de feedback",
    content:
      "Oi, [primeiroNome]. Como você se sentiu com sua experiência na clínica? Seu feedback ajuda muito a Dra. Mariana a manter um atendimento cada vez mais cuidadoso.",
    defaultTime: "",
  },
  {
    category: "Cobrança",
    title: "Cobrança delicada",
    content:
      "Oi, [primeiroNome]. Tudo bem? Identificamos uma pendência em aberto no sistema da clínica. Pode nos chamar por aqui para conferirmos juntas a melhor forma de regularizar?",
    defaultTime: "",
  },
];

type WhatsAppTemplateRow = {
  id: string;
  category: string;
  title: string;
  content: string;
  defaultTime: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function cleanText(value: unknown, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function normalizeTime(value: unknown) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const match = text.match(/^(?:[01]\d|2[0-3]):[0-5]\d$/);
  return match ? text : null;
}

function serializeTemplate(row: WhatsAppTemplateRow) {
  return {
    ...row,
    defaultTime: row.defaultTime || "",
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : row.updatedAt,
  };
}

async function ensureWhatsAppTemplateStorage() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "WhatsAppTemplate" (
      "id" TEXT NOT NULL,
      "category" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "content" TEXT NOT NULL,
      "defaultTime" TEXT,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "WhatsAppTemplate_pkey" PRIMARY KEY ("id")
    )
  `);

  await prisma.$executeRawUnsafe(`ALTER TABLE "WhatsAppTemplate" ADD COLUMN IF NOT EXISTS "defaultTime" TEXT`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "WhatsAppTemplate_category_idx" ON "WhatsAppTemplate"("category")`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "WhatsAppTemplate_isActive_idx" ON "WhatsAppTemplate"("isActive")`);
}

async function ensureDefaults() {
  await ensureWhatsAppTemplateStorage();
  const result = await prisma.$queryRaw<{ count: bigint }[]>`SELECT COUNT(*)::bigint AS count FROM "WhatsAppTemplate"`;
  const count = Number(result[0]?.count || 0);
  if (count > 0) return;

  for (const template of defaultTemplates) {
    await prisma.$executeRaw`
      INSERT INTO "WhatsAppTemplate" ("id", "category", "title", "content", "defaultTime", "isActive", "createdAt", "updatedAt")
      VALUES (${randomUUID()}, ${template.category}, ${template.title}, ${template.content}, ${template.defaultTime || null}, true, NOW(), NOW())
    `;
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    await ensureDefaults();

    const url = new URL(req.url);
    const category = url.searchParams.get("category");

    const templates = category
      ? await prisma.$queryRaw<WhatsAppTemplateRow[]>`
          SELECT "id", "category", "title", "content", "defaultTime", "isActive", "createdAt", "updatedAt"
          FROM "WhatsAppTemplate"
          WHERE "isActive" = true AND "category" = ${category}
          ORDER BY "category" ASC, "title" ASC
        `
      : await prisma.$queryRaw<WhatsAppTemplateRow[]>`
          SELECT "id", "category", "title", "content", "defaultTime", "isActive", "createdAt", "updatedAt"
          FROM "WhatsAppTemplate"
          WHERE "isActive" = true
          ORDER BY "category" ASC, "title" ASC
        `;

    return NextResponse.json(templates.map(serializeTemplate));
  } catch (error) {
    console.error("Erro ao carregar mensagens do WhatsApp:", error);
    return NextResponse.json(
      { error: "Não foi possível carregar as mensagens do WhatsApp." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    await ensureWhatsAppTemplateStorage();

    const body = await req.json().catch(() => ({}));
    const category = cleanText(body.category, "Geral");
    const title = cleanText(body.title);
    const content = cleanText(body.content);
    const defaultTime = normalizeTime(body.defaultTime);

    if (!title) {
      return NextResponse.json({ error: "Informe um título para a mensagem." }, { status: 400 });
    }

    if (!content) {
      return NextResponse.json({ error: "Informe o texto da mensagem." }, { status: 400 });
    }

    if (body.defaultTime && !defaultTime) {
      return NextResponse.json({ error: "Informe um horário válido no formato HH:mm." }, { status: 400 });
    }

    const id = randomUUID();

    const inserted = await prisma.$queryRaw<WhatsAppTemplateRow[]>`
      INSERT INTO "WhatsAppTemplate" ("id", "category", "title", "content", "defaultTime", "isActive", "createdAt", "updatedAt")
      VALUES (${id}, ${category}, ${title}, ${content}, ${defaultTime}, ${body.isActive ?? true}, NOW(), NOW())
      RETURNING "id", "category", "title", "content", "defaultTime", "isActive", "createdAt", "updatedAt"
    `;

    const template = serializeTemplate(inserted[0]);

    await createAuditLog({
      action: "CREATE",
      entity: "WhatsAppTemplate",
      entityId: template.id,
      description: `Mensagem pronta criada: ${template.title}`,
      afterJson: template,
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error("Erro ao salvar mensagem do WhatsApp:", error);
    return NextResponse.json(
      { error: "Não foi possível salvar a mensagem. Verifique os campos e tente novamente." },
      { status: 500 }
    );
  }
}
