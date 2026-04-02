"use client";

import { Check } from "lucide-react";

interface InsightsProps {
  data: {
    totalVisits: number;
    lastProcedure: string;
    loyaltyScore: string;
    criticalObservation: string;
    status: string;
  };
}

export default function ClinicalInsights({ data }: InsightsProps) {
  return (
    <div className="w-full max-w-sm bg-white p-8 border border-[#EEECE7] shadow-sm font-sans antialiased">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-10">
        <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#1A1A1A]">
          Insight Clínico
        </span>
        <div className={`h-2 w-2 rounded-full ${data.totalVisits > 0 ? 'bg-emerald-500' : 'bg-gray-300'}`} />
      </div>

      {/* MÉTRICAS */}
      <div className="space-y-8">
        <Row label="Total de Visitas" value={data.totalVisits} />
        <Row label="Último Procedimento" value={data.lastProcedure} />
        <Row label="Score de Fidelidade" value={data.loyaltyScore} highlight />
      </div>

      {/* BOX DE OBSERVAÇÃO (Onde a Dra Mariana lê o aviso) */}
      <div className="mt-12 p-6 bg-[#FAF8F3] border border-[#C5A059]/20 relative">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-3 h-3 border border-[#C5A059] flex items-center justify-center">
            <Check size={8} className="text-[#C5A059]" />
          </div>
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#C5A059]">
            Observação Crítica
          </span>
        </div>
        <p className="text-[12px] font-serif italic leading-relaxed text-[#1A1A1A]">
          "{data.criticalObservation}"
        </p>
      </div>
    </div>
  );
}

function Row({ label, value, highlight }: any) {
  return (
    <div className="flex justify-between items-end border-b border-[#F9F9F9] pb-2">
      <span className="text-[9px] font-bold uppercase tracking-widest text-[#94A3B8]">{label}</span>
      <span className={`text-[13px] font-serif ${highlight ? 'text-[#C5A059] font-bold' : 'text-[#1A1A1A]'}`}>
        {value}
      </span>
    </div>
  );
}