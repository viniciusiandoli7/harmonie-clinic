"use client";

import { useEffect, useState } from "react";
import { Save, ShieldCheck } from "lucide-react";

type Props = { patientId: string };

export default function StructuredEvolutionPremiumSection({ patientId }: Props) {
  const [evolutions, setEvolutions] = useState<any[]>([]);
  const [treatments, setTreatments] = useState<any[]>([]);
  const [form, setForm] = useState<any>({ procedurePerformed: "", treatmentId: "", complaint: "", clinicalAssessment: "", productUsed: "", batch: "", expiresAt: "", bodyArea: "", quantity: "", intercurrences: "", guidance: "", recommendedReturn: "", termSigned: false, photosTaken: false, createReturnTask: true });

  async function load() {
    const [eRes, tRes] = await Promise.all([fetch(`/api/patients/${patientId}/structured-evolutions`), fetch("/api/treatment-catalog")]);
    if (eRes.ok) setEvolutions(await eRes.json());
    if (tRes.ok) setTreatments(await tRes.json());
  }
  useEffect(() => { if (patientId) load(); }, [patientId]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/patients/${patientId}/structured-evolutions`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) {
      setForm({ procedurePerformed: "", treatmentId: "", complaint: "", clinicalAssessment: "", productUsed: "", batch: "", expiresAt: "", bodyArea: "", quantity: "", intercurrences: "", guidance: "", recommendedReturn: "", termSigned: false, photosTaken: false, createReturnTask: true });
      load();
    }
  }

  function chooseTreatment(id: string) {
    const treatment = treatments.find(t => t.id === id);
    setForm((prev: any) => ({
      ...prev,
      treatmentId: id,
      procedurePerformed: prev.procedurePerformed || treatment?.name || "",
      guidance: prev.guidance || treatment?.postCareInstructions || "",
      recommendedReturn: treatment?.defaultReturnDays ? new Date(Date.now() + Number(treatment.defaultReturnDays) * 86400000).toISOString().slice(0, 10) : prev.recommendedReturn,
    }));
  }

  return (
    <div className="mt-10 space-y-8">
      <form onSubmit={save} className="bg-white border border-[rgba(90,31,43,.10)] p-10 rounded-sm shadow-sm">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-[#5A1F2B]/10 p-3 text-[#5A1F2B]"><ShieldCheck size={20}/></div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#5A1F2B]/70">Registro técnico</p>
            <h3 className="font-serif text-2xl uppercase tracking-widest mt-2">Evolução estruturada</h3>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#5B3A2E]/64">Modelo clínico com produto, lote, região, quantidade, intercorrências, orientações e retorno recomendado.</p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          <select value={form.treatmentId} onChange={e => chooseTreatment(e.target.value)} className="input-premium">
            <option value="">Procedimento cadastrado...</option>
            {treatments.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <input required value={form.procedurePerformed} onChange={e => setForm({ ...form, procedurePerformed: e.target.value })} className="input-premium" placeholder="Procedimento realizado" />
          <input value={form.productUsed} onChange={e => setForm({ ...form, productUsed: e.target.value })} className="input-premium" placeholder="Produto utilizado" />
          <input value={form.batch} onChange={e => setForm({ ...form, batch: e.target.value })} className="input-premium" placeholder="Lote" />
          <input type="date" value={form.expiresAt} onChange={e => setForm({ ...form, expiresAt: e.target.value })} className="input-premium" placeholder="Validade" />
          <input value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} className="input-premium" placeholder="Quantidade / ml / unidades" />
          <input value={form.bodyArea} onChange={e => setForm({ ...form, bodyArea: e.target.value })} className="input-premium" placeholder="Região tratada" />
          <input type="date" value={form.recommendedReturn} onChange={e => setForm({ ...form, recommendedReturn: e.target.value })} className="input-premium" placeholder="Retorno recomendado" />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <textarea value={form.complaint} onChange={e => setForm({ ...form, complaint: e.target.value })} className="input-premium min-h-24 py-3" placeholder="Queixa principal" />
          <textarea value={form.clinicalAssessment} onChange={e => setForm({ ...form, clinicalAssessment: e.target.value })} className="input-premium min-h-24 py-3" placeholder="Avaliação clínica" />
          <textarea value={form.intercurrences} onChange={e => setForm({ ...form, intercurrences: e.target.value })} className="input-premium min-h-24 py-3" placeholder="Intercorrências / observações" />
          <textarea value={form.guidance} onChange={e => setForm({ ...form, guidance: e.target.value })} className="input-premium min-h-24 py-3" placeholder="Orientações dadas" />
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-3 text-[12px]">
            <label className="rounded-2xl border border-[rgba(90,31,43,.12)] bg-[#F7F2EA]/60 px-4 py-3"><input type="checkbox" checked={form.termSigned} onChange={e => setForm({ ...form, termSigned: e.target.checked })} className="mr-2 accent-[#5A1F2B]"/> Termo assinado</label>
            <label className="rounded-2xl border border-[rgba(90,31,43,.12)] bg-[#F7F2EA]/60 px-4 py-3"><input type="checkbox" checked={form.photosTaken} onChange={e => setForm({ ...form, photosTaken: e.target.checked })} className="mr-2 accent-[#5A1F2B]"/> Fotos feitas</label>
            <label className="rounded-2xl border border-[rgba(90,31,43,.12)] bg-[#F7F2EA]/60 px-4 py-3"><input type="checkbox" checked={form.createReturnTask} onChange={e => setForm({ ...form, createReturnTask: e.target.checked })} className="mr-2 accent-[#5A1F2B]"/> Criar alerta de retorno</label>
          </div>
          <button className="btn-primary"><Save size={14}/> Salvar evolução</button>
        </div>
      </form>

      <section className="bg-white border border-[rgba(90,31,43,.10)] p-10 rounded-sm shadow-sm">
        <h3 className="font-serif text-xl uppercase tracking-widest mb-6">Histórico estruturado</h3>
        <div className="space-y-4">
          {evolutions.length === 0 ? <p className="text-sm text-[#5B3A2E]/55">Nenhuma evolução estruturada registrada.</p> : evolutions.map((evolution) => (
            <article key={evolution.id} className="rounded-3xl border border-[rgba(90,31,43,.10)] bg-[#F7F2EA]/60 p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#5A1F2B]">{new Date(evolution.createdAt).toLocaleString("pt-BR")}</p>
                  <p className="mt-1 text-sm font-bold text-[#1E1A18]">{evolution.procedurePerformed}</p>
                  <p className="mt-2 text-[12px] leading-6 text-[#5B3A2E]/68">{[evolution.productUsed, evolution.batch ? `Lote ${evolution.batch}` : null, evolution.bodyArea, evolution.quantity].filter(Boolean).join(" • ")}</p>
                </div>
                <div className="text-right text-[10px] font-bold uppercase tracking-[0.16em] text-[#5A1F2B]">
                  {evolution.termSigned ? "Termo ok" : "Termo pendente"} • {evolution.photosTaken ? "Fotos ok" : "Sem fotos"}
                </div>
              </div>
              {evolution.intercurrences && <p className="mt-4 rounded-2xl bg-white/70 p-4 text-[12px] leading-6 text-[#A13D3D]">{evolution.intercurrences}</p>}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
