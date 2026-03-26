"use client";

import { useEffect, useState } from "react";

type ConsentDocument = {
  title: string;
  content: string;
  treatmentName: string;
  status: "PENDING" | "SIGNED" | "CANCELED";
  patient: {
    name: string;
  };
};

export default function ConsentPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const [doc, setDoc] = useState<ConsentDocument | null>(null);
  const [token, setToken] = useState("");
  const [signatureName, setSignatureName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function run() {
      const resolved = await params;
      setToken(resolved.token);

      const res = await fetch(`/api/public/consent/${resolved.token}`, {
        cache: "no-store",
      });

      if (!res.ok) return;
      const data = await res.json();
      setDoc(data);
    }

    run();
  }, [params]);

  async function handleSign() {
    if (!token || !signatureName.trim()) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/public/consent/${token}/sign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          signatureName,
        }),
      });

      if (!res.ok) return;

      const updated = await fetch(`/api/public/consent/${token}`, {
        cache: "no-store",
      });
      const data = await updated.json();
      setDoc(data);
    } finally {
      setSaving(false);
    }
  }

  if (!doc) {
    return <div className="min-h-screen bg-[#FAF8F3] p-10">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-[#FAF8F3] px-6 py-12">
      <div className="mx-auto max-w-4xl border border-[#ECE7DD] bg-white p-8 md:p-10">
        <p className="text-[10px] uppercase tracking-[0.32em] text-[#C8A35F]">
          Harmonie Clinic
        </p>

        <h1
          className="mt-3 text-[34px] leading-tight text-[#111111]"
          style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
        >
          {doc.title}
        </h1>

        <div className="mt-6 grid gap-3 border border-[#ECE7DD] bg-[#FCFAF6] p-4 text-sm text-[#111111]">
          <div>
            <strong>Paciente:</strong> {doc.patient.name}
          </div>
          <div>
            <strong>Tratamento:</strong> {doc.treatmentName}
          </div>
          <div>
            <strong>Status:</strong> {doc.status}
          </div>
        </div>

        <div className="mt-8 whitespace-pre-line text-[15px] leading-8 text-[#222]">
          {doc.content}
        </div>

        {doc.status !== "SIGNED" ? (
          <div className="mt-10 border border-[#ECE7DD] bg-[#FCFAF6] p-5">
            <label className="mb-2 block text-sm font-medium text-[#111111]">
              Nome para assinatura
            </label>
            <input
              value={signatureName}
              onChange={(e) => setSignatureName(e.target.value)}
              className="h-11 w-full border border-[#ECE7DD] px-3 outline-none"
            />

            <button
              type="button"
              onClick={handleSign}
              disabled={saving}
              className="mt-4 h-11 bg-[#111111] px-5 text-sm font-semibold uppercase tracking-[0.14em] text-white disabled:opacity-60"
            >
              {saving ? "Assinando..." : "Assinar documento"}
            </button>
          </div>
        ) : (
          <div className="mt-10 border border-green-200 bg-green-50 p-5 text-green-700">
            Documento assinado com sucesso.
          </div>
        )}
      </div>
    </div>
  );
}