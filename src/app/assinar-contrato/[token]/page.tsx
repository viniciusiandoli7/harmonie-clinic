"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import SignatureCanvas from "react-signature-canvas";
import { CheckCircle, Eraser, ShieldCheck } from "lucide-react";
import { CONTRACT_ACCEPTANCE_TEXT } from "@/lib/contractLegalCore";

type PublicContract = {
  id: string;
  title: string;
  content: string;
  total: number;
  status: "PENDING" | "SIGNED" | "CANCELED";
  signatureName?: string | null;
  signedAt?: string | null;
  patient?: { name?: string | null } | null;
};

export default function SignContractPage() {
  const params = useParams<{ token: string }>();
  const token = Array.isArray(params?.token) ? params.token[0] : params?.token;
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [contract, setContract] = useState<PublicContract | null>(null);
  const [loadingContract, setLoadingContract] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) return;

    let active = true;

    async function loadContract() {
      setLoadingContract(true);
      setLoadError("");

      try {
        const res = await fetch(`/api/public/contracts/${token}`, {
          cache: "no-store",
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data?.error || "Não foi possível carregar o contrato.");
        }

        if (!active) return;
        setContract(data);
        if (data.status === "SIGNED") setSuccess(true);
      } catch (error) {
        if (!active) return;
        setLoadError(error instanceof Error ? error.message : "Não foi possível carregar o contrato.");
      } finally {
        if (active) setLoadingContract(false);
      }
    }

    void loadContract();

    return () => {
      active = false;
    };
  }, [token]);

  const handleClear = () => sigCanvas.current?.clear();

  const handleSave = async () => {
    if (!token || !contract) return;

    if (sigCanvas.current?.isEmpty()) {
      alert("Por favor, assine no quadro em branco antes de confirmar.");
      return;
    }

    setLoading(true);
    const signatureBase64 = sigCanvas.current?.getTrimmedCanvas().toDataURL("image/png");

    try {
      const res = await fetch(`/api/public/contracts/${token}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signatureImage: signatureBase64,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(data?.error || "Erro ao salvar assinatura");
      setContract(data);
      setSuccess(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      alert(error instanceof Error ? error.message : "Erro ao enviar a assinatura. Verifique sua conexão e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (loadingContract) {
    return (
      <div className="min-h-screen bg-[#F7F2EA] flex items-center justify-center p-6 font-sans text-[#1E1A18]">
        <div className="text-center">
          <ShieldCheck className="mx-auto mb-4 text-[#5A1F2B]" size={28} />
          <p className="text-sm font-semibold">Carregando seu contrato...</p>
        </div>
      </div>
    );
  }

  if (loadError || !contract) {
    return (
      <div className="min-h-screen bg-[#F7F2EA] flex items-center justify-center p-6 font-sans text-[#1E1A18]">
        <div className="w-full max-w-md border border-red-200 bg-white p-7 text-center shadow-sm">
          <p className="font-serif text-2xl">Contrato indisponível</p>
          <p className="mt-3 text-sm leading-relaxed text-[#64748B]">
            {loadError || "Não foi possível localizar este contrato."}
          </p>
        </div>
      </div>
    );
  }

  if (success || contract.status === "SIGNED") {
    return (
      <div className="min-h-screen bg-[#F7F2EA] flex flex-col font-sans">
        <div className="bg-[#1E1A18] py-6 px-6 text-center shadow-md">
          <h1 className="text-xl font-serif uppercase tracking-widest text-[#C8A35F]">Mariana Thomaz Carmona</h1>
          <p className="text-white/70 text-[10px] font-bold uppercase tracking-[0.2em] mt-1 flex items-center justify-center gap-1.5">
            <ShieldCheck size={12} /> Assinatura de Contrato
          </p>
        </div>

        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <div>
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
              <CheckCircle size={40} />
            </div>
            <h2 className="text-3xl font-serif text-[#1E1A18] mb-2">Contrato Assinado!</h2>
            <p className="text-[#60759B] text-sm max-w-sm leading-relaxed">
              Seu contrato foi assinado digitalmente com sucesso e já consta no nosso sistema.
            </p>
            <div className="mt-4 text-[10px] font-bold uppercase tracking-[0.18em] text-[#96A4C1] space-y-1">
              <p>Assinado por: {contract.signatureName || contract.patient?.name || "Contratante"}</p>
              {contract.signedAt && (
                <p>Assinado em: {new Date(contract.signedAt).toLocaleString("pt-BR")}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F2EA] font-sans text-[#1E1A18]">
      <div className="sticky top-0 z-40 bg-[#1E1A18] py-5 px-6 text-center shadow-md">
        <h1 className="text-lg md:text-xl font-serif uppercase tracking-widest text-[#C8A35F]">Mariana Thomaz Carmona</h1>
        <p className="text-white/70 text-[10px] font-bold uppercase tracking-[0.2em] mt-1 flex items-center justify-center gap-1.5">
          <ShieldCheck size={12} /> Leitura e Assinatura de Contrato
        </p>
      </div>

      <main className="mx-auto w-full max-w-5xl px-3 py-5 md:px-6 md:py-10">
        <div className="mb-4 border border-[#E9DEC9] bg-[#FCFAF6] px-5 py-4 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#5A1F2B]">Antes de assinar</p>
          <p className="mt-2 text-sm leading-relaxed text-[#64748B]">
            Leia o contrato completo abaixo. Ao final do documento, faça sua assinatura no quadro indicado.
          </p>
        </div>

        <section className="overflow-hidden border border-[#ECE7DD] bg-white shadow-sm">
          <div
            dangerouslySetInnerHTML={{ __html: contract.content }}
            className="contract-content-wrapper overflow-x-auto p-3 md:p-8"
          />
        </section>

        <section className="mt-6 border border-[#ECE7DD] bg-white p-5 md:p-8 shadow-sm">
          <div className="text-center mb-7">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#5A1F2B]">Confirmação de Contrato</p>
            <h2 className="mt-2 text-xl md:text-2xl font-serif text-[#1E1A18]">Assinatura da paciente</h2>
            <p className="text-sm text-[#64748B] mt-2 leading-relaxed">
              Utilize o dedo ou uma caneta touch para assinar no quadro em branco abaixo.
            </p>
          </div>

          <div className="mx-auto max-w-xl">
            <div className="mb-6 border border-[#D8C4AE] bg-[#F7F2EA] p-4 text-sm leading-relaxed text-[#3F342F]">
              {CONTRACT_ACCEPTANCE_TEXT}
            </div>

            <div className="flex justify-between items-end mb-2 px-1">
              <span className="text-[10px] font-bold text-[#96A4C1] uppercase tracking-widest">Sua Assinatura</span>
              <button
                type="button"
                onClick={handleClear}
                className="text-[10px] font-bold text-red-400 uppercase tracking-widest hover:text-red-600 flex items-center gap-1"
              >
                <Eraser size={12} /> Limpar
              </button>
            </div>

            <div className="bg-white border-2 border-dashed border-[#5A1F2B]/50 rounded-xl shadow-inner overflow-hidden h-64 touch-none">
              <SignatureCanvas
                ref={sigCanvas}
                penColor="#1E1A18"
                canvasProps={{ className: "w-full h-full" }}
              />
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="mt-6 w-full bg-[#1E1A18] hover:bg-[#5A1F2B] text-white py-4 rounded-xl text-[12px] font-bold uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? "Enviando de forma segura..." : <><CheckCircle size={18} /> Confirmar Assinatura</>}
            </button>

            <p className="mt-4 text-center text-[10px] leading-relaxed text-[#94A3B8]">
              Ao confirmar, a assinatura será vinculada a este contrato e registrada no sistema.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
