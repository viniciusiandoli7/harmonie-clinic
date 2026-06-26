"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Save } from "lucide-react";
import { treatmentStepStatuses } from "@/lib/brand";

const fmtCurrency = (v: number) => (v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

type Props = { patientId: string };

export default function PatientTreatmentPlanSection({ patientId }: Props) {
  const [plans, setPlans] = useState<any[]>([]);
  const [treatments, setTreatments] = useState<any[]>([]);
  const [form, setForm] = useState({ title: "Plano de rejuvenescimento individual", objective: "", notes: "", steps: [{ title: "", treatmentId: "", estimatedValue: "", status: "SUGGESTED", plannedDate: "" }] });
  const [saving, setSaving] = useState(false);

  async function load() {
    const [plansRes, treatmentsRes] = await Promise.all([fetch(`/api/patients/${patientId}/treatment-plans`), fetch("/api/treatment-catalog")]);
    if (plansRes.ok) setPlans(await plansRes.json());
    if (treatmentsRes.ok) setTreatments(await treatmentsRes.json());
  }

  useEffect(() => { if (patientId) load(); }, [patientId]);

  const total = useMemo(() => form.steps.reduce((sum, step) => sum + Number(step.estimatedValue || 0), 0), [form.steps]);

  function updateStep(index: number, patch: any) {
    setForm((prev: any) => ({ ...prev, steps: prev.steps.map((step: any, i: number) => {
      if (i !== index) return step;
      const next = { ...step, ...patch };
      if (patch.treatmentId) {
        const treatment = treatments.find(t => t.id === patch.treatmentId);
        if (treatment) {
          next.title = next.title || treatment.name;
          next.estimatedValue = next.estimatedValue || String(treatment.standardPrice || "");
        }
      }
      return next;
    }) }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, totalEstimated: total, steps: form.steps.filter(s => s.title || s.treatmentId).map((s, i) => ({ ...s, title: s.title || treatments.find(t => t.id === s.treatmentId)?.name || `Etapa ${i + 1}`, priority: i + 1, estimatedValue: Number(s.estimatedValue || 0), plannedDate: s.plannedDate || null })) };
    const res = await fetch(`/api/patients/${patientId}/treatment-plans`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setSaving(false);
    if (res.ok) {
      setForm({ title: "Plano de rejuvenescimento individual", objective: "", notes: "", steps: [{ title: "", treatmentId: "", estimatedValue: "", status: "SUGGESTED", plannedDate: "" }] });
      load();
    }
  }

  async function changeStatus(stepId: string, status: string) {
    await fetch(`/api/treatment-plan-steps/${stepId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, performedDate: status === "DONE" ? new Date().toISOString() : undefined }) });
    load();
  }

  return (
    <div className="space-y-8">
      <section className="bg-white border border-[rgba(90,31,43,.10)] p-10 rounded-sm shadow-sm">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#5A1F2B]/70">Estratégia individual</p>
            <h3 className="font-serif text-2xl uppercase tracking-widest mt-2">Plano de tratamento</h3>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#5B3A2E]/64">Organize as etapas sugeridas, valores, status e datas. Ideal para transformar avaliação em plano claro e executável.</p>
          </div>
          <div className="rounded-3xl bg-[#5A1F2B]/10 px-5 py-3 text-right">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#5A1F2B]">Plano em aberto</p>
            <p className="font-serif text-2xl text-[#1E1A18]">{plans.filter(p => p.status === "ACTIVE").length}</p>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          {plans.length === 0 ? <p className="rounded-3xl border border-dashed border-[#5A1F2B]/20 bg-[#F7F2EA]/60 p-8 text-center text-sm text-[#5B3A2E]/60">Nenhum plano criado ainda.</p> : plans.map((plan) => (
            <article key={plan.id} className="rounded-3xl border border-[rgba(90,31,43,.12)] bg-[#F7F2EA]/60 p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <h4 className="font-serif text-2xl text-[#1E1A18]">{plan.title}</h4>
                  <p className="mt-2 text-[12px] text-[#5B3A2E]/65">{plan.objective || "Sem objetivo descrito."}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#5A1F2B]">Estimativa</p>
                  <p className="font-serif text-xl">{fmtCurrency(plan.totalEstimated)}</p>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {plan.steps?.map((step: any) => (
                  <div key={step.id} className="grid gap-3 rounded-2xl border border-[rgba(90,31,43,.08)] bg-white/60 p-4 md:grid-cols-[1fr_140px_170px] md:items-center">
                    <div>
                      <p className="text-sm font-bold text-[#1E1A18]">{step.title}</p>
                      <p className="mt-1 text-[11px] text-[#5B3A2E]/55">{step.plannedDate ? new Date(step.plannedDate).toLocaleDateString("pt-BR") : "Sem data"} • {fmtCurrency(step.estimatedValue)}</p>
                    </div>
                    <select value={step.status} onChange={(e) => changeStatus(step.id, e.target.value)} className="h-10 border px-3 text-[11px] font-bold uppercase">
                      {treatmentStepStatuses.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                    <span className="rounded-full bg-[#5A1F2B]/10 px-3 py-2 text-center text-[10px] font-bold uppercase tracking-[0.16em] text-[#5A1F2B]">{treatmentStepStatuses.find(s => s.value === step.status)?.label || step.status}</span>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <form onSubmit={save} className="bg-white border border-[rgba(90,31,43,.10)] p-10 rounded-sm shadow-sm">
        <h3 className="font-serif text-xl uppercase tracking-widest mb-6">Criar novo plano</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="input-premium" placeholder="Título do plano" />
          <input value={form.objective} onChange={e => setForm({ ...form, objective: e.target.value })} className="input-premium" placeholder="Objetivo principal" />
        </div>
        <div className="mt-5 space-y-3">
          {form.steps.map((step, index) => (
            <div key={index} className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_120px_150px]">
              <select value={step.treatmentId} onChange={e => updateStep(index, { treatmentId: e.target.value })} className="input-premium">
                <option value="">Procedimento cadastrado...</option>
                {treatments.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <input value={step.title} onChange={e => updateStep(index, { title: e.target.value })} className="input-premium" placeholder="Etapa personalizada" />
              <input type="number" value={step.estimatedValue} onChange={e => updateStep(index, { estimatedValue: e.target.value })} className="input-premium" placeholder="Valor" />
              <input type="date" value={step.plannedDate} onChange={e => updateStep(index, { plannedDate: e.target.value })} className="input-premium" />
            </div>
          ))}
        </div>
        <div className="mt-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <button type="button" onClick={() => setForm((prev: any) => ({ ...prev, steps: [...prev.steps, { title: "", treatmentId: "", estimatedValue: "", status: "SUGGESTED", plannedDate: "" }] }))} className="btn-secondary"><Plus size={14} /> Adicionar etapa</button>
          <div className="flex items-center gap-4">
            <p className="text-sm font-bold text-[#5A1F2B]">Total: {fmtCurrency(total)}</p>
            <button disabled={saving} className="btn-primary"><Save size={14} /> {saving ? "Salvando..." : "Salvar plano"}</button>
          </div>
        </div>
      </form>
    </div>
  );
}
