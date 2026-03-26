"use client";

import { useEffect, useState } from "react";

type Contract = {
  title: string;
  content: string;
  status: "PENDING" | "SIGNED" | "CANCELED";
};

export default function ContractPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const [contract, setContract] = useState<Contract | null>(null);
  const [token, setToken] = useState("");
  const [signatureName, setSignatureName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function run() {
      const resolved = await params;
      setToken(resolved.token);

      const res = await fetch(`/api/public/contracts/${resolved.token}`, {
        cache: "no-store",
      });

      if (!res.ok) return;
      const data = await res.json();
      setContract(data);
    }

    run();
  }, [params]);

  async function handleSign() {
    if (!token || !signatureName.trim()) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/public/contracts/${token}/sign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          signatureName,
        }),
      });

      if (!res.ok) return;

      const updated = await fetch(`/api/public/contracts/${token}`, {
        cache: "no-store",
      });
      const data = await updated.json();
      setContract(data);
    } finally {
      setSaving(false);
    }
  }

  if (!contract) {
    return <div className="min-h-screen bg-[#FAF8F3] p-10">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-[#FAF8F3] px-6 py-12">
      <div className="mx-auto max-w-5xl border border-[#ECE7DD] bg-white p-8 md:p-10">
        <div
          dangerouslySetInnerHTML={{ __html: contract.content }}
          className="text-[#1f3552]"
        />

        {contract.status !== "SIGNED" ? (
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
              {saving ? "Assinando..." : "Assinar contrato"}
            </button>
          </div>
        ) : (
          <div className="mt-10 border border-green-200 bg-green-50 p-5 text-green-700">
            Contrato assinado com sucesso.
          </div>
        )}
      </div>
    </div>
  );
}