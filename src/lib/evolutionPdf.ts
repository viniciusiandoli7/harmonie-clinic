type EvolutionPdfSession = {
  sessionNumber: number;
  sessionDate: string;
  clinicalNotes?: string | null;
  bodyMeasurements?: string | null;
  performedProcedure?: string | null;
  entryType?: string | null;
  images: string[];
  patientSignatureName?: string | null;
  signedAt?: string | null;
  signatureImage?: string | null;
};

type EvolutionPdfInput = {
  patientName: string;
  treatmentName: string;
  totalSessions: number;
  completedSessions: number;
  sessions: EvolutionPdfSession[];
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  });
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
}

function entryLabel(entryType?: string | null) {
  if (entryType === "FOLLOW_UP") return "Acompanhamento";
  if (entryType === "RETURN") return "Retorno";
  return "Sessão realizada";
}

async function imageToDataUrl(url: string): Promise<{ dataUrl: string; format: "PNG" | "JPEG" | "WEBP" } | null> {
  try {
    if (/^data:image\//i.test(url)) {
      const format = /^data:image\/png/i.test(url) ? "PNG" : /^data:image\/webp/i.test(url) ? "WEBP" : "JPEG";
      return { dataUrl: url, format };
    }

    const response = await fetch(url, { mode: "cors", cache: "no-store" });
    if (!response.ok) return null;
    const blob = await response.blob();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    const format = blob.type.includes("png") ? "PNG" : blob.type.includes("webp") ? "WEBP" : "JPEG";
    return { dataUrl, format };
  } catch {
    return null;
  }
}

function safeFilePart(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

export async function downloadEvolutionPdf(input: EvolutionPdfInput) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  let y = 18;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - 16) {
      doc.addPage();
      y = 18;
    }
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(90, 31, 43);
  doc.text("THOMAZ & CARMONA LTDA. — PRONTUÁRIO CLÍNICO", margin, y);
  y += 9;

  doc.setTextColor(30, 26, 24);
  doc.setFontSize(17);
  doc.text(`Evolução & Fotos — ${input.patientName}`, margin, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`${input.treatmentName}  |  Sessões: ${input.completedSessions}/${input.totalSessions}`, margin, y);
  y += 8;
  doc.setDrawColor(225, 218, 207);
  doc.line(margin, y, pageWidth - margin, y);
  y += 7;

  const ordered = [...input.sessions].sort((a, b) => a.sessionNumber - b.sessionNumber);

  for (const session of ordered) {
    ensureSpace(34);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(90, 31, 43);
    doc.text(`Evolução ${session.sessionNumber} — ${entryLabel(session.entryType)} — ${formatDate(session.sessionDate)}`, margin, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setTextColor(44, 39, 36);
    doc.setFontSize(9.5);
    const description = session.clinicalNotes || session.bodyMeasurements || session.performedProcedure || "Registro clínico.";
    const lines = doc.splitTextToSize(description, contentWidth);
    ensureSpace(lines.length * 4.5 + 8);
    doc.text(lines, margin, y);
    y += lines.length * 4.5 + 4;

    if (session.images.length) {
      const thumbWidth = 54;
      const thumbHeight = 40;
      const gap = 5;
      const perRow = 3;
      for (let i = 0; i < session.images.length; i += perRow) {
        ensureSpace(thumbHeight + 5);
        const row = session.images.slice(i, i + perRow);
        const loaded = await Promise.all(row.map(imageToDataUrl));
        loaded.forEach((image, rowIndex) => {
          if (!image) return;
          const x = margin + rowIndex * (thumbWidth + gap);
          try {
            doc.addImage(image.dataUrl, image.format, x, y, thumbWidth, thumbHeight, undefined, "FAST");
          } catch {
            // Uma imagem inválida não deve impedir a geração do restante do prontuário.
          }
        });
        y += thumbHeight + 5;
      }
    }

    if (session.signedAt) {
      ensureSpace(18);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 120, 80);
      doc.setFontSize(8.5);
      doc.text(`CIÊNCIA DA PACIENTE — ${session.patientSignatureName || input.patientName} — ${formatDateTime(session.signedAt)}`, margin, y);
      y += 5;
      if (session.signatureImage) {
        try {
          doc.addImage(session.signatureImage, "PNG", margin, y, 38, 13, undefined, "FAST");
          y += 15;
        } catch {
          y += 2;
        }
      }
    }

    doc.setDrawColor(235, 230, 222);
    doc.line(margin, y, pageWidth - margin, y);
    y += 7;
  }

  const fileName = `evolucao-${safeFilePart(input.patientName)}-${safeFilePart(input.treatmentName)}.pdf`;
  doc.save(fileName);
}
