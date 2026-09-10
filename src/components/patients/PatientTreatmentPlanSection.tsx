"use client";

import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { treatmentStepStatuses } from "@/lib/brand";

const fmtCurrency = (v: number) => (v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

type Props = { patientId: string };

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("pt-BR");
}

export default function PatientTreatmentPlanSection({ patientId }: Props) {
  const [plans, setPlans] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [noteText, setNoteText] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const [plansRes, notesRes] = await Promise.all([
      fetch(`/api/patients/${patientId}/treatment-plans`),
      fetch(`/api/patients/${patientId}/treatment-plan-notes`),
    ]);

    if (plansRes.ok) setPlans(await plansRes.json());
    if (notesRes.ok) setNotes(await notesRes.json());
  }

  useEffect(() => {
    if (patientId) load();
  }, [patientId]);

  async function saveNote(e: React.FormEvent) {
    e.preventDefault();

    const content = noteText.trim();
    if (!content) return alert("Escreva o que foi passado para a paciente antes de salvar.");

    setSaving(true);
    try {
      const res = await fetch(`/api/patients/${patientId}/treatment-plan-notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (res.ok) {
        setNoteText("");
        await load();
      } else {
        const data = await res.json().catch(() => null);
        alert(data?.error || "Erro ao salvar observação.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(stepId: string, status: string) {
    await fetch(`/api/treatment-plan-steps/${stepId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, performedDate: status === "DONE" ? new Date().toISOString() : undefined }),
    });
    load();
  }

  return (
    <div className="space-y-8">
      <section className="bg-white border border-[rgba(90,31,43,.10)] p-10 rounded-sm shadow-sm">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#5A1F2B]/70">Estratégia individual</p>
            <h3 className="font-serif text-2xl uppercase tracking-widest mt-2">Plano de tratamento</h3>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#5B3A2E]/64">
              Consulte os planos existentes e registre, em campo livre, o que foi explicado para a paciente durante a avaliação.
            </p>
          </div>
          <div className="rounded-3xl bg-[#5A1F2B]/10 px-5 py-3 text-right">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#5A1F2B]">Plano em aberto</p>
            <p className="font-serif text-2xl text-[#1E1A18]">{plans.filter(p => p.status === "ACTIVE").length}</p>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          {plans.length === 0 ? (
            <p className="rounded-3xl border border-dashed border-[#5A1F2B]/20 bg-[#F7F2EA]/60 p-8 text-center text-sm text-[#5B3A2E]/60">
              Nenhum plano estruturado criado ainda.
            </p>
          ) : (
            plans.map((plan) => (
              <article key={plan.id} className="rounded-3xl border border-[rgba(90,31,43,.12)] bg-[#F7F2EA]/60 p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h4 className="font-serif text-2xl text-[#1E1A18]">{plan.title}</h4>
                    <p className="mt-2 text-[12px] text-[#5B3A2E]/65">{plan.objective || "Sem objetivo descrito."}</p>
                    {plan.notes && <p className="mt-3 rounded-2xl bg-white/60 p-4 text-[12px] leading-6 text-[#5B3A2E]/70">{plan.notes}</p>}
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
                        <p className="mt-1 text-[11px] text-[#5B3A2E]/55">
                          {step.plannedDate ? new Date(step.plannedDate).toLocaleDateString("pt-BR") : "Sem data"} • {fmtCurrency(step.estimatedValue)}
                        </p>
                      </div>
                      <select value={step.status} onChange={(e) => changeStatus(step.id, e.target.value)} className="h-10 border px-3 text-[11px] font-bold uppercase">
                        {treatmentStepStatuses.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                      <span className="rounded-full bg-[#5A1F2B]/10 px-3 py-2 text-center text-[10px] font-bold uppercase tracking-[0.16em] text-[#5A1F2B]">
                        {treatmentStepStatuses.find(s => s.value === step.status)?.label || step.status}
                      </span>
                    </div>
                  ))}
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <form onSubmit={saveNote} className="bg-white border border-[rgba(90,31,43,.10)] p-10 rounded-sm shadow-sm">
        <h3 className="font-serif text-xl uppercase tracking-widest mb-3">Observações do plano</h3>
        <p className="mb-6 max-w-2xl text-sm leading-7 text-[#5B3A2E]/64">
          Use este campo para registrar o que foi apresentado para a paciente: prioridades, procedimentos sugeridos, valores conversados, etapas futuras, orientações e decisões tomadas.
        </p>

        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          className="input-premium min-h-40 w-full py-4"
          placeholder="Ex: Foi explicado que a prioridade inicial será melhorar qualidade de pele e flacidez. Sugerido iniciar com ultrassom microfocado e reavaliar em 60 dias..."
        />

        <div className="mt-5 flex justify-end">
          <button disabled={saving} className="btn-primary">
            <Save size={14} /> {saving ? "Salvando..." : "Salvar observação"}
          </button>
        </div>

        <div className="mt-8 space-y-4">
          {notes.length === 0 ? (
            <p className="rounded-3xl border border-dashed border-[#5A1F2B]/20 bg-[#F7F2EA]/60 p-6 text-center text-sm text-[#5B3A2E]/60">
              Nenhuma observação registrada ainda.
            </p>
          ) : (
            notes.map((note) => (
              <article key={note.id} className="rounded-3xl border border-[rgba(90,31,43,.12)] bg-[#F7F2EA]/60 p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#5A1F2B]/70">{formatDate(note.createdAt)}</p>
                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[#1E1A18]">{note.content}</p>
              </article>
            ))
          )}
        </div>
      </form>
    </div>
  );
}
