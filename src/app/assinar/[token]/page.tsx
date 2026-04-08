"use client";

import { useState, useRef } from "react";
import { useParams } from "next/navigation";
import SignatureCanvas from "react-signature-canvas";
import { CheckCircle, Eraser, ShieldCheck } from "lucide-react";

export default function SignDocumentPage() {
  const { token } = useParams(); // Esse token será o ID secreto da sessão
  const sigCanvas = useRef<SignatureCanvas>(null);
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleClear = () => {
    sigCanvas.current?.clear();
  };

  const handleSave = async () => {
    if (sigCanvas.current?.isEmpty()) {
      alert("Por favor, assine no quadro em branco antes de confirmar.");
      return;
    }

    setLoading(true);
    // Transforma o desenho no celular em um link/texto
    const signatureBase64 = sigCanvas.current?.getTrimmedCanvas().toDataURL("image/png");

    try {
      // Envia a assinatura para o nosso backend salvar na sessão correta
      const res = await fetch(`/api/evolution-sessions/${token}/sign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signatureImage: signatureBase64 }),
      });

      if (!res.ok) throw new Error("Erro ao salvar assinatura");

      setSuccess(true);
    } catch (error) {
      console.error(error);
      alert("Erro ao enviar a assinatura. Verifique sua conexão e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // TELA DE SUCESSO (O que o paciente vê após assinar)
  if (success) {
    return (
      <div className="min-h-screen bg-[#FAF8F3] flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-sm animate-in zoom-in duration-500">
          <CheckCircle size={40} />
        </div>
        <h1 className="text-3xl font-serif text-[#111] mb-2">Assinatura Concluída!</h1>
        <p className="text-[#60759B] text-sm max-w-xs leading-relaxed mb-8">
          Seu documento foi assinado digitalmente com sucesso e já está anexado ao seu prontuário.
        </p>
        <p className="text-[10px] font-bold text-[#C8A35F] uppercase tracking-widest flex items-center justify-center gap-2">
          <ShieldCheck size={14} /> Harmonie Clinic
        </p>
      </div>
    );
  }

  // TELA DE ASSINATURA (Mobile-First)
  return (
    <div className="min-h-screen bg-[#FAF8F3] flex flex-col font-sans">
      
      {/* HEADER DA CLÍNICA */}
      <div className="bg-[#111] py-6 px-6 text-center shadow-md">
        <h1 className="text-xl font-serif uppercase tracking-widest text-[#C8A35F]">
          Harmonie Clinic
        </h1>
        <p className="text-white/70 text-[10px] font-bold uppercase tracking-[0.2em] mt-1 flex items-center justify-center gap-1.5">
          <ShieldCheck size={12} /> Assinatura Digital
        </p>
      </div>

      {/* ÁREA PRINCIPAL */}
      <div className="flex-1 flex flex-col p-6 max-w-md mx-auto w-full">
        
        <div className="text-center mb-8 mt-4">
          <h2 className="text-lg font-bold text-[#111]">Confirmação de Sessão</h2>
          <p className="text-sm text-[#64748B] mt-2 leading-relaxed">
            Por favor, utilize o dedo ou uma caneta touch para assinar no quadro em branco abaixo.
          </p>
        </div>

        {/* QUADRO DE DESENHO */}
        <div className="flex-1 flex flex-col">
          <div className="flex justify-between items-end mb-2 px-1">
            <span className="text-[10px] font-bold text-[#96A4C1] uppercase tracking-widest">Sua Assinatura</span>
            <button 
              onClick={handleClear}
              className="text-[10px] font-bold text-red-400 uppercase tracking-widest hover:text-red-600 flex items-center gap-1"
            >
              <Eraser size={12} /> Limpar
            </button>
          </div>

          <div className="bg-white border-2 border-dashed border-[#C8A35F]/50 rounded-xl shadow-inner overflow-hidden h-64 touch-none">
            <SignatureCanvas 
              ref={sigCanvas}
              penColor="#111"
              canvasProps={{
                className: "w-full h-full",
              }}
            />
          </div>
        </div>

        {/* BOTÃO DE CONFIRMAR */}
        <div className="mt-8 mb-6">
          <button 
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-[#111] hover:bg-[#C8A35F] text-white py-4 rounded-xl text-[12px] font-bold uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? "Enviando de forma segura..." : <><CheckCircle size={18} /> Confirmar Assinatura</>}
          </button>
          <p className="text-center text-[9px] text-gray-400 mt-4 uppercase tracking-wider">
            Ao assinar, você concorda com os termos da sessão realizada.
          </p>
        </div>

      </div>
    </div>
  );
}