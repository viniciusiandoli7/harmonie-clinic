import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

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

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

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
