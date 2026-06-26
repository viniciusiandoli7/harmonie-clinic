"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Info, ShieldAlert } from "lucide-react";

type Props = { patientId: string };

export default function PatientSafetySection({ patientId }: Props) {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!patientId) return;
    fetch(`/api/patients/${patientId}/safety-alerts`).then(res => res.ok ? res.json() : null).then(setData);
  }, [patientId]);

  const alerts = data?.alerts || [];

  return (
    <section className="bg-white border border-[rgba(90,31,43,.10)] p-10 rounded-sm shadow-sm animate-in fade-in duration-500">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#5A1F2B]/70">Segurança clínica</p>
          <h3 className="font-serif text-2xl uppercase tracking-widest mt-2">Alertas da anamnese</h3>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#5B3A2E]/64">Alertas gerados automaticamente a partir da ficha da paciente para reduzir risco de esquecer alguma informação importante.</p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <Counter label="Crítico" value={data?.counts?.critical || 0} />
          <Counter label="Atenção" value={data?.counts?.warning || 0} />
          <Counter label="Info" value={data?.counts?.info || 0} />
        </div>
      </div>

      <div className="mt-8 space-y-4">
        {alerts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#5A1F2B]/20 bg-[#F7F2EA]/60 p-10 text-center text-sm text-[#5B3A2E]/60">Nenhum alerta clínico gerado pela anamnese atual.</div>
        ) : alerts.map((alert: any, index: number) => (
          <article key={`${alert.title}-${index}`} className={`rounded-3xl border p-5 ${alert.level === "CRITICAL" ? "border-[#A13D3D]/25 bg-[#A13D3D]/8" : alert.level === "WARNING" ? "border-[#C9A227]/25 bg-[#C9A227]/10" : "border-[#5A1F2B]/12 bg-[#F7F2EA]/60"}`}>
            <div className="flex gap-4">
              <div className="mt-1 text-[#5A1F2B]">{alert.level === "CRITICAL" ? <ShieldAlert size={20}/> : alert.level === "WARNING" ? <AlertTriangle size={20}/> : <Info size={20}/>}</div>
              <div>
                <p className="text-sm font-bold text-[#1E1A18]">{alert.title}</p>
                <p className="mt-1 text-[13px] leading-6 text-[#5B3A2E]/72">{alert.message}</p>
                {alert.recommendation && <p className="mt-3 rounded-2xl bg-white/60 px-4 py-3 text-[12px] leading-6 text-[#5A1F2B]">{alert.recommendation}</p>}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Counter({ label, value }: any) {
  return <div className="rounded-2xl bg-[#5A1F2B]/8 px-4 py-3"><p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#5A1F2B]">{label}</p><p className="font-serif text-2xl text-[#1E1A18]">{value}</p></div>;
}
