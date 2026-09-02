import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function required(value?: string) {
  const text = String(value || "").trim();
  return text || null;
}

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const cloudName =
    required(process.env.CLOUDINARY_CLOUD_NAME) ||
    required(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) ||
    "domf1tnzd";

  const apiKey = required(process.env.CLOUDINARY_API_KEY);
  const apiSecret = required(process.env.CLOUDINARY_API_SECRET);
  const folder = "harmonie/clinical-records";

  // Preferimos assinatura no servidor: o segredo nunca chega ao navegador e
  // o arquivo segue direto do dispositivo para o Cloudinary (sem passar pelo
  // limite de upload do servidor/Vercel).
  if (apiKey && apiSecret) {
    const timestamp = Math.floor(Date.now() / 1000);
    const signatureBase = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = createHash("sha1").update(signatureBase).digest("hex");

    return NextResponse.json({
      mode: "signed",
      cloudName,
      apiKey,
      timestamp,
      folder,
      signature,
    });
  }

  // Compatibilidade com instalações existentes que já usam preset unsigned.
  const uploadPreset = required(process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET) || "harmonie_fotos";
  return NextResponse.json({
    mode: "unsigned",
    cloudName,
    uploadPreset,
    folder,
  });
}
