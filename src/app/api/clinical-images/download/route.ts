import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

function safeFileName(value: string) {
  const cleaned = value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return cleaned || "foto-clinica.jpg";
}

function isAllowedClinicalImage(rawUrl: string) {
  try {
    const parsed = new URL(rawUrl);
    return parsed.protocol === "https:" && parsed.hostname === "res.cloudinary.com" && parsed.pathname.includes("/image/upload/");
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const url = req.nextUrl.searchParams.get("url") || "";
  const requestedName = req.nextUrl.searchParams.get("name") || "foto-clinica.jpg";

  if (!isAllowedClinicalImage(url)) {
    return NextResponse.json({ error: "Imagem clínica inválida." }, { status: 400 });
  }

  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      return NextResponse.json({ error: "Não foi possível localizar a imagem." }, { status: 502 });
    }

    const bytes = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "image/jpeg";
    const extension = contentType.includes("png") ? ".png" : contentType.includes("webp") ? ".webp" : ".jpg";
    let fileName = safeFileName(requestedName);
    if (!/\.(png|jpe?g|webp)$/i.test(fileName)) fileName += extension;

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("Erro ao baixar foto clínica:", error);
    return NextResponse.json({ error: "Não foi possível baixar a imagem." }, { status: 500 });
  }
}
