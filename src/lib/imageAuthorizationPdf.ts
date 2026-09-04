import { CONTRACTOR_INFO } from "./contractLegalCore";
import {
  IMAGE_AUTHORIZATION_SECTIONS,
  IMAGE_AUTHORIZATION_TITLE,
  IMAGE_CHANNEL_OPTIONS,
  IMAGE_CONTENT_OPTIONS,
  imageAuthorizationIntro,
  selectedLabels,
} from "./imageAuthorizationLegal";

type Params = {
  patient: { name?: string | null; cpf?: string | null };
  authorization: {
    status?: string | null;
    contentTypesJson?: unknown;
    channelsJson?: unknown;
    signatureName?: string | null;
    signatureImage?: string | null;
    signedAt?: string | Date | null;
    revokedAt?: string | Date | null;
    createdAt?: string | Date | null;
  };
  filename?: string;
};

function fmt(value?: string | Date | null) {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleString("pt-BR");
}

export async function generateImageAuthorizationPdf({ patient, authorization, filename }: Params) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  const mx = 16;
  const contentW = width - mx * 2;
  let y = 16;

  const selectedContent = selectedLabels(authorization.contentTypesJson, IMAGE_CONTENT_OPTIONS);
  const selectedChannels = selectedLabels(authorization.channelsJson, IMAGE_CHANNEL_OPTIONS);

  function page(required = 8) {
    if (y + required > height - 16) {
      doc.addPage();
      y = 16;
    }
  }
  function font(style: "normal" | "bold" = "normal", size = 9, color: [number, number, number] = [30, 26, 24]) {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    doc.setTextColor(...color);
  }
  function text(value: string, opts?: { bold?: boolean; size?: number; gap?: number; color?: [number, number, number] }) {
    const lines = doc.splitTextToSize(String(value || ""), contentW);
    font(opts?.bold ? "bold" : "normal", opts?.size || 8.8, opts?.color);
    for (const line of lines) {
      page(4.8);
      doc.text(line, mx, y);
      y += 4.5;
    }
    y += opts?.gap ?? 1.5;
  }
  function section(title: string) {
    page(9);
    y += 2;
    font("bold", 9.2, [90, 31, 43]);
    doc.text(title, mx, y);
    y += 5;
  }
  function checkboxList(labels: string[]) {
    if (!labels.length) {
      text("Nenhuma opção registrada.", { color: [100, 116, 139] });
      return;
    }
    for (const label of labels) text(`☒ ${label}`, { gap: 0.5 });
  }

  font("bold", 9, [90, 31, 43]);
  doc.text(CONTRACTOR_INFO.companyName, width / 2, y, { align: "center" });
  y += 7;
  doc.setFont("times", "bold");
  doc.setFontSize(15);
  doc.setTextColor(30, 26, 24);
  doc.text(IMAGE_AUTHORIZATION_TITLE, width / 2, y, { align: "center", maxWidth: contentW });
  y += 9;
  font("normal", 8.5, [91, 58, 46]);
  doc.text(`Paciente: ${patient.name || "Não informado"}`, mx, y); y += 4.5;
  doc.text(`CPF: ${patient.cpf || "Não informado"}`, mx, y); y += 7;

  text(imageAuthorizationIntro(patient.name, patient.cpf));

  for (const s of IMAGE_AUTHORIZATION_SECTIONS) {
    section(s.title);
    if ("type" in s && s.type === "content-options") {
      text(s.paragraphs[0]);
      checkboxList(selectedContent);
      text(s.paragraphs[1]);
    } else if ("type" in s && s.type === "channel-options") {
      text(s.paragraphs[0]);
      checkboxList(selectedChannels);
      text(s.paragraphs[1]);
    } else {
      for (const p of s.paragraphs) text(p);
    }
  }

  section("IDENTIFICAÇÃO E ASSINATURAS");
  text(`Paciente: ${patient.name || "Não informado"}`);
  text(`CPF: ${patient.cpf || "Não informado"}`);
  if (authorization.signedAt) text(`Data e horário da autorização: ${fmt(authorization.signedAt)}`);
  if (authorization.revokedAt) text(`Revogada em: ${fmt(authorization.revokedAt)}`, { color: [185, 28, 28] });

  page(48);
  y += 4;
  doc.setFont("times", "italic");
  doc.setFontSize(15);
  doc.setTextColor(30, 26, 24);
  doc.text(CONTRACTOR_INFO.professionalName, width / 2, y, { align: "center" });
  y += 3;
  doc.setDrawColor(30, 26, 24);
  doc.line(width / 2 - 38, y, width / 2 + 38, y);
  y += 5;
  font("bold", 8.5);
  doc.text(CONTRACTOR_INFO.companyName, width / 2, y, { align: "center" });
  y += 4;
  font("normal", 8, [91, 58, 46]);
  doc.text(`CNPJ nº ${CONTRACTOR_INFO.cnpj}`, width / 2, y, { align: "center" });
  y += 4;
  doc.text(`Responsável profissional: ${CONTRACTOR_INFO.professionalName} – ${CONTRACTOR_INFO.professionalCredential}`, width / 2, y, { align: "center", maxWidth: contentW });
  y += 8;

  if (authorization.signatureImage) {
    page(35);
    try {
      doc.addImage(authorization.signatureImage, "PNG", mx, y, 55, 22);
      y += 25;
    } catch {}
  }
  font("normal", 8.5);
  doc.text(`Assinado por: ${authorization.signatureName || patient.name || "Paciente"}`, mx, y); y += 5;
  if (authorization.signedAt) doc.text(`Assinado em: ${fmt(authorization.signedAt)}`, mx, y);

  const safe = (patient.name || "paciente").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  doc.save(filename || `autorizacao-uso-imagem-${safe || "paciente"}.pdf`);
}
