"use client";

import { useRef } from "react";
import SignatureCanvas from "react-signature-canvas";
import { X, Eraser, Check } from "lucide-react";

interface SignaturePadProps {
  onSave: (signatureBase64: string) => void;
  onCancel: () => void;
  title?: string;
}

export default function SignaturePad({ onSave, onCancel, title = "Assinatura Digital" }: SignaturePadProps) {
  const sigCanvas = useRef<SignatureCanvas>(null);

  const handleClear = () => {
    sigCanvas.current?.clear();
  };

  const handleSave = () => {
    if (sigCanvas.current?.isEmpty()) {
      alert("Por favor, preencha a assinatura antes de confirmar.");
      return;
    }
    
    // Aqui acontece a mágica: pega o desenho e transforma num texto Base64
    const base64Data = sigCanvas.current?.getTrimmedCanvas().toDataURL("image/png");
    
    if (base64Data) {
      onSave(base64Data);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-white shadow-2xl rounded-xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* CABEÇALHO */}
        <div className="bg-[#111] px-6 py-4 flex justify-between items-center">
          <h2 className="text-sm font-bold uppercase tracking-widest text-white">
            {title}
          </h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* ÁREA DE DESENHO (CANVAS) */}
        <div className="p-6 bg-[#FAFAFA]">
          <p className="text-[10px] font-bold text-[#96A4C1] uppercase tracking-widest mb-3 text-center">
            Utilize o dedo ou uma caneta touch para assinar
          </p>
          
          <div className="border-2 border-dashed border-[#C8A35F]/50 rounded-lg bg-white overflow-hidden shadow-inner cursor-crosshair h-64 sm:h-72">
            <SignatureCanvas 
              ref={sigCanvas}
              penColor="#111"
              canvasProps={{
                className: "w-full h-full",
              }}
            />
          </div>
        </div>

        {/* RODAPÉ E BOTÕES */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center bg-white">
          <button 
            onClick={handleClear}
            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-red-500 transition-colors px-4 py-2"
          >
            <Eraser size={16} /> Limpar
          </button>
          
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 bg-[#111] hover:bg-[#C8A35F] text-white px-6 py-3 rounded text-[10px] font-bold uppercase tracking-widest transition-all shadow-md"
          >
            <Check size={16} /> Confirmar
          </button>
        </div>

      </div>
    </div>
  );
}