import {
  CONTRACT_ACCEPTANCE_TEXT,
  CONTRACTOR_INFO,
  GENERAL_CONTRACT_CLAUSES,
  formatContractNumber,
  getContractUseByDate,
} from "./contractLegalCore";

type ContractPdfItem = {
  description?: string;
  productName?: string;
  quantity?: number | string;
  unitPrice?: number | string;
  price?: number | string;
  total?: number | string;
  totalPrice?: number | string;
  observation?: string | null;
};

type ContractPdfParams = {
  filename?: string;
  title?: string;
  patient: {
    name?: string | null;
    cpf?: string | null;
    rg?: string | null;
    phone?: string | null;
    birthDate?: string | Date | null;
    email?: string | null;
    address?: string | null;
    addressNumber?: string | null;
    addressComplement?: string | null;
    neighborhood?: string | null;
    city?: string | null;
    state?: string | null;
    zipCode?: string | null;
  };
  clinic?: {
    companyName?: string | null;
    cnpj?: string | null;
    address?: string | null;
    email?: string | null;
  };
  items?: ContractPdfItem[];
  subtotal?: number;
  discount?: number;
  total?: number;
  paymentMethodLabel?: string;
  paymentDetails?: string;
  contentHtml?: string | null;
  contractDate?: string | Date | null;
  contractToken?: string | null;
  contractNumber?: string | null;
  validUntil?: string | Date | null;
  status?: string | null;
  signatureName?: string | null;
  signatureImage?: string | null;
  signedAt?: string | Date | null;
};

function toNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/\./g, "").replace(",", ".").trim());
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function formatCurrency(value: unknown) {
  return toNumber(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(value?: string | Date | null) {
  if (!value) return "Não informado";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Não informado";
  return date.toLocaleDateString("pt-BR");
}

function formatDateTime(value?: string | Date | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("pt-BR");
}

function formatPatientAddress(patient: ContractPdfParams["patient"]) {
  const street = [patient.address, patient.addressNumber].filter(Boolean).join(", ");
  const locality = [patient.neighborhood, patient.city, patient.state].filter(Boolean).join(" - ");
  const parts = [street, patient.addressComplement, locality, patient.zipCode ? `CEP ${patient.zipCode}` : ""].filter(Boolean);
  return parts.join(" • ") || "Não informado";
}

function cleanText(value?: string | null) {
  return String(value || "")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function htmlToPlainText(html?: string | null) {
  const raw = String(html || "");
  if (!raw) return "";

  if (typeof window !== "undefined" && typeof DOMParser !== "undefined") {
    const parser = new DOMParser();
    const documentHtml = parser.parseFromString(raw, "text/html");
    documentHtml.querySelectorAll("style, script").forEach((el) => el.remove());
    documentHtml.querySelectorAll("br").forEach((el) => el.replaceWith("\n"));
    documentHtml.querySelectorAll("p, div, section, h1, h2, h3, h4, li, tr").forEach((el) => {
      el.appendChild(documentHtml.createTextNode("\n"));
    });

    return cleanText(documentHtml.body.textContent || "");
  }

  return cleanText(
    raw
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|section|h1|h2|h3|h4|li|tr)>/gi, "\n")
      .replace(/<[^>]+>/g, "")
  );
}

function extractProcedureTexts(contentHtml?: string | null) {
  const raw = String(contentHtml || "");
  if (!raw) return [];

  if (typeof window !== "undefined" && typeof DOMParser !== "undefined") {
    const parser = new DOMParser();
    const documentHtml = parser.parseFromString(raw, "text/html");
    const sections = Array.from(documentHtml.querySelectorAll(".procedure-section"));

    if (sections.length > 0) {
      return sections.map((section) => htmlToPlainText(section.outerHTML)).filter(Boolean);
    }
  }

  const fullText = htmlToPlainText(raw);
  const markers = ["Termos específicos dos procedimentos", "Especificações dos procedimentos"];
  const marker = markers.find((candidate) => fullText.toLowerCase().includes(candidate.toLowerCase()));
  const markerIndex = marker ? fullText.toLowerCase().indexOf(marker.toLowerCase()) : -1;

  if (marker && markerIndex >= 0) {
    const text = fullText.slice(markerIndex + marker.length).trim();
    return text ? [text] : [];
  }

  return [];
}

function genericContractDescription(value: string) {
  const normalized = String(value || "")
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
  return normalized.startsWith("PREENCHEDOR") ? "Preenchedor" : value;
}

function normalizeItems(items?: ContractPdfItem[]) {
  const normalized = Array.isArray(items) ? items : [];
  return normalized.map((item) => {
    const quantity = Math.max(1, Math.floor(toNumber(item.quantity, 1)));
    const unitPrice = toNumber(item.unitPrice ?? item.price, 0);
    const total = toNumber(item.total ?? item.totalPrice, unitPrice * quantity);
    return {
      description: genericContractDescription(cleanText(item.description || item.productName || "Procedimento")),
      quantity,
      unitPrice,
      total,
      observation: cleanText(item.observation || ""),
    };
  }).filter((item) => item.description);
}

function safeFilename(value?: string) {
  return String(value || "contrato")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function generateContractPdf(params: ContractPdfParams) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 16;
  const marginTop = 16;
  const marginBottom = 16;
  const contentWidth = pageWidth - marginX * 2;
  let y = marginTop;

  const clinic = {
    companyName: params.clinic?.companyName || CONTRACTOR_INFO.companyName,
    cnpj: params.clinic?.cnpj || CONTRACTOR_INFO.cnpj,
    address: params.clinic?.address || CONTRACTOR_INFO.address,
    email: params.clinic?.email || CONTRACTOR_INFO.email,
  };

  const items = normalizeItems(params.items);
  const itemsSubtotal = Math.round(items.reduce((sum, item) => sum + item.total, 0) * 100) / 100;
  const total = Math.round(Math.max(0, Number(params.total ?? Math.max(0, itemsSubtotal - Number(params.discount || 0)))) * 100) / 100;
  const subtotal = Math.round(Math.max(itemsSubtotal, Number(params.subtotal || 0), total) * 100) / 100;
  const discount = Math.round(Math.max(0, subtotal - total) * 100) / 100;
  const rawContractDate = params.contractDate || new Date();
  const contractDate = formatDate(rawContractDate);
  const contractNumber = params.contractNumber || formatContractNumber(params.contractToken, rawContractDate);
  const useByDate = formatDate(params.validUntil ?? getContractUseByDate(rawContractDate));
  const patientAddress = formatPatientAddress(params.patient);

  function addPageIfNeeded(requiredHeight = 8) {
    if (y + requiredHeight > pageHeight - marginBottom) {
      doc.addPage();
      y = marginTop;
    }
  }

  function setFont(style: "normal" | "bold" = "normal", size = 10, color: [number, number, number] = [30, 26, 24]) {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);
  }

  function addWrappedText(text: string, options?: { size?: number; style?: "normal" | "bold"; color?: [number, number, number]; lineHeight?: number; gapAfter?: number; indent?: number }) {
    const size = options?.size ?? 9.5;
    const lineHeight = options?.lineHeight ?? 5;
    const gapAfter = options?.gapAfter ?? 2.5;
    const indent = options?.indent ?? 0;
    setFont(options?.style ?? "normal", size, options?.color ?? [30, 26, 24]);

    const paragraphs = cleanText(text).split(/\n{2,}/).filter(Boolean);

    paragraphs.forEach((paragraph) => {
      const lines = doc.splitTextToSize(paragraph.replace(/\n/g, " "), contentWidth - indent);
      lines.forEach((line: string) => {
        addPageIfNeeded(lineHeight);
        doc.text(line, marginX + indent, y);
        y += lineHeight;
      });
      y += gapAfter;
    });
  }

  function addSectionTitle(title: string) {
    addPageIfNeeded(12);
    y += 3;
    setFont("bold", 10, [90, 31, 43]);
    doc.text(title.toUpperCase(), marginX, y);
    y += 6;
    doc.setDrawColor(216, 196, 174);
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 5;
  }

  function addInfoBox(title: string, lines: string[], x: number, width: number) {
    const boxHeight = 56;
    doc.setFillColor(247, 242, 234);
    doc.setDrawColor(228, 216, 202);
    doc.roundedRect(x, y, width, boxHeight, 1.5, 1.5, "FD");

    setFont("bold", 8, [90, 31, 43]);
    doc.text(title.toUpperCase(), x + 4, y + 7);

    setFont("normal", 8.3, [30, 26, 24]);
    let localY = y + 13;
    lines.forEach((line) => {
      const wrapped = doc.splitTextToSize(line, width - 8);
      doc.text(wrapped, x + 4, localY);
      localY += Math.max(1, wrapped.length) * 4.15;
    });
  }

  // Cabeçalho
  setFont("bold", 9, [90, 31, 43]);
  doc.text("MARIANA THOMAZ CARMONA", pageWidth / 2, y, { align: "center" });
  y += 8;

  setFont("bold", 14, [30, 26, 24]);
  doc.text("CONTRATO DE PRESTAÇÃO DE SERVIÇOS ESTÉTICOS", pageWidth / 2, y, { align: "center" });
  y += 6;

  setFont("normal", 8, [91, 58, 46]);
  doc.text(`Documento emitido em ${contractDate} • Contrato nº ${contractNumber}`, pageWidth / 2, y, { align: "center" });
  y += 6;

  doc.setDrawColor(216, 196, 174);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 8;

  const boxGap = 4;
  const boxWidth = (contentWidth - boxGap) / 2;
  addInfoBox("Contratante", [
    `Nome: ${params.patient?.name || "Não informado"}`,
    `CPF: ${params.patient?.cpf || "Não informado"}`,
    `RG: ${params.patient?.rg || "Não informado"}`,
    `Nascimento: ${formatDate(params.patient?.birthDate)}`,
    `Telefone: ${params.patient?.phone || "Não informado"}`,
    `E-mail: ${params.patient?.email || "Não informado"}`,
    `Endereço: ${patientAddress}`,
  ], marginX, boxWidth);

  addInfoBox("Contratada", [
    `Nome/Razão Social: ${clinic.companyName}`,
    `CNPJ: ${clinic.cnpj}`,
    `Profissional responsável: ${CONTRACTOR_INFO.responsibleProfessional}`,
    `Endereço: ${clinic.address}`,
    `E-mail: ${clinic.email}`,
    `Contrato nº: ${contractNumber}`,
  ], marginX + boxWidth + boxGap, boxWidth);

  y += 64;

  addWrappedText(
    "As partes identificadas acima firmam o presente contrato para prestação de serviços estéticos, conforme procedimentos, valores, condições de pagamento, orientações e termos de consentimento descritos neste documento.",
    { size: 9.3, lineHeight: 4.8, gapAfter: 2 }
  );

  addSectionTitle("Procedimentos contratados");

  autoTable(doc, {
    startY: y,
    margin: { left: marginX, right: marginX },
    head: [["#", "Produto / Serviço", "Qtd.", "Valor unitário", "Total"]],
    body: items.length
      ? items.map((item, index) => [
          String(index + 1),
          `${item.description}${item.observation ? `\nObservação: ${item.observation}` : ""}`,
          String(item.quantity),
          formatCurrency(item.unitPrice),
          formatCurrency(item.total),
        ])
      : [["1", "Procedimento estético", "1", formatCurrency(total), formatCurrency(total)]],
    styles: {
      font: "helvetica",
      fontSize: 8.4,
      cellPadding: 2.2,
      lineColor: [228, 216, 202],
      lineWidth: 0.1,
      overflow: "linebreak",
      valign: "top",
      textColor: [30, 26, 24],
    },
    headStyles: {
      fillColor: [239, 229, 218],
      textColor: [30, 26, 24],
      fontStyle: "bold",
      halign: "center",
      fontSize: 7.8,
    },
    columnStyles: {
      0: { cellWidth: 12, halign: "center" },
      1: { cellWidth: 78 },
      2: { cellWidth: 16, halign: "center" },
      3: { cellWidth: 35, halign: "right" },
      4: { cellWidth: 37, halign: "right" },
    },
    pageBreak: "auto",
    rowPageBreak: "avoid",
  });

  y = ((doc as any).lastAutoTable?.finalY || y) + 8;

  addPageIfNeeded(26);
  const totalsX = pageWidth - marginX - 72;
  setFont("normal", 9, [30, 26, 24]);
  doc.text("Subtotal", totalsX, y);
  doc.text(formatCurrency(subtotal), pageWidth - marginX, y, { align: "right" });
  y += 5;
  doc.text("Desconto", totalsX, y);
  doc.text(formatCurrency(discount), pageWidth - marginX, y, { align: "right" });
  y += 3;
  doc.setDrawColor(216, 196, 174);
  doc.line(totalsX, y, pageWidth - marginX, y);
  y += 6;
  setFont("bold", 10, [30, 26, 24]);
  doc.text("Total a pagar", totalsX, y);
  doc.text(formatCurrency(total), pageWidth - marginX, y, { align: "right" });
  y += 8;

  addPageIfNeeded(28);
  doc.setFillColor(247, 242, 234);
  doc.setDrawColor(228, 216, 202);
  doc.roundedRect(marginX, y, contentWidth, 25, 1.5, 1.5, "FD");
  setFont("bold", 8.5, [30, 26, 24]);
  doc.text(`Forma de pagamento: ${params.paymentMethodLabel || "Conforme venda registrada"}`, marginX + 4, y + 7);
  setFont("normal", 8.5, [30, 26, 24]);
  doc.text(doc.splitTextToSize(`Detalhes: ${params.paymentDetails || "Pagamento registrado na data de fechamento da venda."}`, contentWidth - 8), marginX + 4, y + 13);
  doc.text(`Prazo para utilização dos serviços contratados: até ${useByDate}`, marginX + 4, y + 20);
  y += 31;

  addSectionTitle("Cláusulas gerais e termos");

  GENERAL_CONTRACT_CLAUSES.forEach((clause) => {
    addWrappedText(`${clause.number}. ${clause.title}`, { size: 8.9, style: "bold", lineHeight: 4.6, gapAfter: 0.5 });
    clause.paragraphs.forEach((paragraph) => {
      addWrappedText(paragraph, { size: 8.8, lineHeight: 4.6, gapAfter: 1.2 });
    });
  });

  const procedureTexts = extractProcedureTexts(params.contentHtml);
  if (procedureTexts.length > 0) {
    addSectionTitle("Termos específicos dos procedimentos");

    addWrappedText(
      "A CONTRATANTE declara estar ciente das indicações, contraindicações, possíveis efeitos colaterais e orientações pré e pós-procedimento aplicáveis ao(s) serviço(s) contratado(s).",
      { size: 8.8, lineHeight: 4.6, color: [91, 58, 46] }
    );

    procedureTexts.forEach((sectionText) => {
      const lines = cleanText(sectionText).split("\n").map((line) => line.trim()).filter(Boolean);
      const [termTitle, ...termBody] = lines;
      addSectionTitle(termTitle || "Termo específico");
      addWrappedText(termBody.join("\n\n"), { size: 8.4, lineHeight: 4.4, gapAfter: 1.5, indent: 2 });
    });
  }

  addSectionTitle("Ciência e assinatura");
  addPageIfNeeded(72);

  setFont("normal", 9, [30, 26, 24]);
  doc.text(`São Paulo, ${contractDate}`, pageWidth / 2, y, { align: "center" });
  y += 12;

  doc.setFont("times", "italic");
  doc.setFontSize(16);
  doc.setTextColor(30, 26, 24);
  doc.text(CONTRACTOR_INFO.professionalName, pageWidth / 2, y, { align: "center" });
  y += 3;
  doc.setDrawColor(30, 26, 24);
  doc.line(pageWidth / 2 - 38, y, pageWidth / 2 + 38, y);
  y += 5;
  setFont("bold", 8.5, [30, 26, 24]);
  doc.text(CONTRACTOR_INFO.companyName, pageWidth / 2, y, { align: "center" });
  y += 4;
  setFont("normal", 8, [91, 58, 46]);
  doc.text(`CNPJ: ${CONTRACTOR_INFO.cnpj}`, pageWidth / 2, y, { align: "center" });
  y += 4;
  doc.text(CONTRACTOR_INFO.professionalCredential, pageWidth / 2, y, { align: "center" });
  y += 10;

  addWrappedText(CONTRACT_ACCEPTANCE_TEXT, { size: 8.7, lineHeight: 4.6, gapAfter: 3 });

  addPageIfNeeded(42);
  setFont("bold", 9, [90, 31, 43]);
  doc.text("CONTRATANTE — ASSINATURA DIGITAL", marginX, y);
  y += 7;

  if (params.status === "SIGNED" || params.signatureImage || params.signatureName) {
    if (params.signatureImage) {
      try {
        doc.addImage(params.signatureImage, "PNG", marginX, y, 52, 20);
        y += 23;
      } catch {
        // Mantém o registro textual se a imagem não puder ser inserida.
      }
    }

    setFont("normal", 8.5, [30, 26, 24]);
    doc.text(`Assinado por: ${params.signatureName || params.patient?.name || "Paciente"}`, marginX, y);
    y += 5;
    if (params.signedAt) {
      doc.text(`Assinado em: ${formatDateTime(params.signedAt)}`, marginX, y);
      y += 5;
    }
  } else {
    setFont("normal", 8.5, [91, 58, 46]);
    doc.text("Aguardando assinatura digital da CONTRATANTE.", marginX, y);
    y += 6;
  }

  const filename = params.filename || `${safeFilename(params.title || "contrato")}-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
}
