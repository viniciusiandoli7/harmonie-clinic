"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FileSignature,
  Send,
  Copy,
  Check,
  ExternalLink,
  Plus,
} from "lucide-react";
import {
  buildWhatsappConsentMessage,
  getWhatsappLink,
} from "@/lib/whatsapp";
import { ULTRASSOM_MICRO_MACROFOCADO_TEMPLATE } from "@/lib/consent-templates";

type Patient = {
  id: string;
  name: string;
  phone?: string | null;
};

type ConsentDocument = {
  id: string;
  treatmentName: string;
  token: string;
  status: "PENDING" | "SIGNED";
  createdAt: string;
  signedAt?: string | null;
};

type Props = {
  patient: Patient;
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("pt-BR");
}

export default function PatientConsentSection({ patient }: Props) {
  const [treatmentName, setTreatmentName] = useState(
    ULTRASSOM_MICRO_MACROFOCADO_TEMPLATE.treatmentName
  );

  const [documents, setDocuments] = useState<ConsentDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState("");
  const [error, setError] = useState("");

  async function loadDocuments() {
    try {
      const res = await fetch(`/api/patient-consent-documents?patientId=${patient.id}`, {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error ?? "Erro ao carregar documentos.");
        return;
      }

      setDocuments(data);
    } catch {
      setError("Erro ao carregar documentos.");
    }
  }

  useEffect(() => {
    loadDocuments();
  }, [patient.id]);

  async function handleGenerateDocument() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/patient-consent-documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patientId: patient.id,
          treatmentName,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error ?? "Erro ao gerar documento.");
        return;
      }

      await loadDocuments();
    } catch {
      setError("Erro ao gerar documento.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy(link: string) {
    await navigator.clipboard.writeText(link);
    setCopied(link);
    setTimeout(() => setCopied(""), 1500);
  }

  return (
    <section className="border border-[#F0ECE4] bg-white">
      <div className="flex items-start justify-between border-b border-[#ECE7DD] bg-[#FCFAF6] px-7 py-6">
        <div>
          <p className="text-[10px] uppercase tracking-[0.32em] text-[#C8A35F]">
            Documentos
          </p>

          <h3
            className="mt-2 text-[26px] text-[#111111]"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            Termos de consentimento
          </h3>
        </div>

        <div className="flex h-12 w-12 items-center justify-center border border-[#E9DEC9] text-[#C8A35F]">
          <FileSignature size={18} />
        </div>
      </div>

      <div className="p-7">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[280px]">
            <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.22em] text-[#96A4C1]">
              Tratamento
            </label>

            <select
              value={treatmentName}
              onChange={(e) => setTreatmentName(e.target.value)}
              className="h-11 w-full border border-[#ECE7DD] px-3 outline-none"
            >
              <option value={ULTRASSOM_MICRO_MACROFOCADO_TEMPLATE.treatmentName}>
                {ULTRASSOM_MICRO_MACROFOCADO_TEMPLATE.treatmentName}
              </option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleGenerateDocument}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center gap-2 bg-[#111111] px-5 text-[12px] font-semibold uppercase tracking-[0.14em] text-white disabled:opacity-60"
          >
            <Plus size={14} />
            {loading ? "Gerando..." : "Novo termo"}
          </button>
        </div>

        {error && (
          <div className="mt-5 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-6 space-y-4">
          {documents.length === 0 ? (
            <div className="text-sm text-[#64748B]">
              Nenhum termo gerado para este paciente.
            </div>
          ) : (
            documents.map((doc) => {
              const link = `${window.location.origin}/consent/${doc.token}`;

              const whatsappLink = patient.phone
                ? getWhatsappLink(
                    patient.phone,
                    buildWhatsappConsentMessage({
                      patientName: patient.name,
                      treatmentName: doc.treatmentName,
                      documentLink: link,
                    })
                  )
                : "";

              return (
                <div
                  key={doc.id}
                  className="flex flex-col gap-4 border border-[#ECE7DD] bg-[#FCFAF6] p-5 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <div className="text-[16px] font-semibold text-[#111111]">
                      {doc.treatmentName}
                    </div>

                    <div className="mt-1 text-sm text-[#64748B]">
                      Criado em {formatDate(doc.createdAt)}
                    </div>

                    <div className="mt-2">
                      <span
                        className={[
                          "inline-flex items-center border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]",
                          doc.status === "SIGNED"
                            ? "border-green-200 bg-green-50 text-green-700"
                            : "border-yellow-200 bg-yellow-50 text-yellow-700",
                        ].join(" ")}
                      >
                        {doc.status === "SIGNED" ? "Assinado" : "Pendente"}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => handleCopy(link)}
                      className="inline-flex h-10 items-center gap-2 border border-[#ECE7DD] bg-white px-4 text-[12px] font-semibold uppercase tracking-[0.14em]"
                    >
                      {copied === link ? <Check size={14} /> : <Copy size={14} />}
                      {copied === link ? "Copiado" : "Copiar"}
                    </button>

                    <a
                      href={link}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-10 items-center gap-2 border border-[#ECE7DD] bg-white px-4 text-[12px] font-semibold uppercase tracking-[0.14em]"
                    >
                      <ExternalLink size={14} />
                      Abrir
                    </a>

                    {whatsappLink && (
                      <a
                        href={whatsappLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-10 items-center gap-2 bg-[#111111] px-4 text-[12px] font-semibold uppercase tracking-[0.14em] text-white"
                      >
                        <Send size={14} />
                        WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}