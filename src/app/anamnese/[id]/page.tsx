"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle, ClipboardCheck, Loader2 } from "lucide-react";
import { useParams } from "next/navigation";

const initialForm = {
  mainComplaint: "",
  profession: "",
  sunExposure: false,
  previousAestheticProcedures: "",
  takingRoacutan: false,
  roacutanDetails: "",
  medications: "",
  allergies: "",
  allergicToEgg: false,
  allergicToSeafood: "",
  dentalAnesthesia: false,
  dentalAnesthesiaReaction: false,
  procedureReaction: "",
  keloidTendency: false,
  diseases: "",
  hasHerpes: false,
  smoker: false,
  bloodPressure: "NORMAL",
  waterIntake: "",
  pregnantOrNursing: false,
  exercises: false,
  skinCareRoutine: "",
  weightLoss: "",
  surgeries: "",
  recentTreatmentOrVaccine: "",
  hasAutoimmuneDisease: false,
  cancerHistory: false,
  hasDiabetes: false,
  usesAnticoagulant: false,
  usesAspirin: false,
  circulationProblems: "",
  permanentImplants: "",
  consentSigned: false,
  clinicalRiskNotes: "",
};

type FormState = typeof initialForm;

function Field({ label, name, value, onChange, placeholder = "" }: {
  label: string;
  name: keyof FormState;
  value: string;
  onChange: (name: keyof FormState, value: any) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] font-bold uppercase tracking-[0.18em] text-[#5A1F2B]">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        placeholder={placeholder}
        className="mt-2 min-h-[88px] w-full rounded-2xl border border-[#E9DEC9] bg-white px-4 py-3 text-[15px] text-[#1E1A18] outline-none transition focus:border-[#5A1F2B]"
      />
    </label>
  );
}

function ShortField({ label, name, value, onChange, placeholder = "" }: {
  label: string;
  name: keyof FormState;
  value: string;
  onChange: (name: keyof FormState, value: any) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] font-bold uppercase tracking-[0.18em] text-[#5A1F2B]">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        placeholder={placeholder}
        className="mt-2 h-12 w-full rounded-2xl border border-[#E9DEC9] bg-white px-4 text-[15px] text-[#1E1A18] outline-none transition focus:border-[#5A1F2B]"
      />
    </label>
  );
}

function YesNo({ label, name, value, onChange }: {
  label: string;
  name: keyof FormState;
  value: boolean;
  onChange: (name: keyof FormState, value: any) => void;
}) {
  return (
    <div>
      <span className="block text-[11px] font-bold uppercase tracking-[0.18em] text-[#5A1F2B]">{label}</span>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onChange(name, true)}
          className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${value ? "border-[#5A1F2B] bg-[#5A1F2B] text-white" : "border-[#E9DEC9] bg-white text-[#5B3A2E]"}`}
        >
          Sim
        </button>
        <button
          type="button"
          onClick={() => onChange(name, false)}
          className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${!value ? "border-[#5A1F2B] bg-[#5A1F2B] text-white" : "border-[#E9DEC9] bg-white text-[#5B3A2E]"}`}
        >
          Não
        </button>
      </div>
    </div>
  );
}

export default function PublicAnamnesePage() {
  const params = useParams();
  const patientId = String(params?.id || "");
  const [patient, setPatient] = useState<any>(null);
  const [form, setForm] = useState<FormState>(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const firstName = useMemo(() => String(patient?.name || "paciente").split(" ")[0], [patient]);

  useEffect(() => {
    async function load() {
      if (!patientId) return;
      setLoading(true);
      setError("");

      try {
        const res = await fetch(`/api/public/anamnesis/${patientId}`, { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Não foi possível carregar a ficha.");

        setPatient(data.patient);
        if (data.anamnesis) {
          setForm({
            ...initialForm,
            ...data.anamnesis,
            sunExposure: Boolean(data.anamnesis.sunExposure),
            takingRoacutan: Boolean(data.anamnesis.takingRoacutan),
            allergicToEgg: Boolean(data.anamnesis.allergicToEgg),
            dentalAnesthesia: Boolean(data.anamnesis.dentalAnesthesia),
            dentalAnesthesiaReaction: Boolean(data.anamnesis.dentalAnesthesiaReaction),
            keloidTendency: Boolean(data.anamnesis.keloidTendency),
            hasHerpes: Boolean(data.anamnesis.hasHerpes),
            smoker: Boolean(data.anamnesis.smoker),
            pregnantOrNursing: Boolean(data.anamnesis.pregnantOrNursing),
            exercises: Boolean(data.anamnesis.exercises),
            hasAutoimmuneDisease: Boolean(data.anamnesis.hasAutoimmuneDisease),
            cancerHistory: Boolean(data.anamnesis.cancerHistory),
            hasDiabetes: Boolean(data.anamnesis.hasDiabetes),
            usesAnticoagulant: Boolean(data.anamnesis.usesAnticoagulant),
            usesAspirin: Boolean(data.anamnesis.usesAspirin),
            consentSigned: Boolean(data.anamnesis.consentSigned),
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro inesperado.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [patientId]);

  function update(name: keyof FormState, value: any) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);

    try {
      const res = await fetch(`/api/public/anamnesis/${patientId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Não foi possível salvar a ficha.");

      setSaved(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F2EA] p-6">
        <div className="flex items-center gap-3 text-[#5A1F2B]">
          <Loader2 className="animate-spin" size={20} />
          Carregando ficha...
        </div>
      </main>
    );
  }

  if (error && !patient) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F2EA] p-6">
        <div className="max-w-lg rounded-3xl border border-red-200 bg-white p-8 text-center text-red-700 shadow-sm">{error}</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F7F2EA] px-4 py-8 text-[#1E1A18] sm:px-6 lg:px-8">
      <form onSubmit={submit} className="mx-auto max-w-4xl overflow-hidden rounded-[34px] border border-[#E9DEC9] bg-[#FDFBF7] shadow-[0_22px_70px_rgba(63,22,32,.10)]">
        <header className="border-b border-[#E9DEC9] bg-white/70 px-6 py-8 sm:px-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#5A1F2B]">Dra. Mariana Thomaz Carmona</p>
          <h1 className="mt-3 font-serif text-3xl leading-tight sm:text-5xl">Ficha de Anamnese</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#5B3A2E]/70">
            {firstName}, preencha com calma. Essas informações ficam salvas na sua ficha clínica e ajudam a tornar seu atendimento mais seguro e personalizado.
          </p>

          {saved && (
            <div className="mt-6 flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
              <CheckCircle size={18} />
              Ficha salva com sucesso. Obrigada!
            </div>
          )}

          {error && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}
        </header>

        <section className="space-y-8 px-6 py-8 sm:px-10">
          <Field label="Qual motivo te trouxe até essa consulta?" name="mainComplaint" value={form.mainComplaint} onChange={update} placeholder="Ex.: flacidez, manchas, rugas, naturalidade, prevenção..." />
          <ShortField label="Qual a sua profissão?" name="profession" value={form.profession} onChange={update} />
          <YesNo label="Se expõe ao sol sem uso do filtro solar?" name="sunExposure" value={form.sunExposure} onChange={update} />
          <Field label="Já realizou algum procedimento estético antes? Qual e há quanto tempo?" name="previousAestheticProcedures" value={form.previousAestheticProcedures} onChange={update} />

          <div className="grid gap-6 md:grid-cols-2">
            <YesNo label="Já tomou Roacutan?" name="takingRoacutan" value={form.takingRoacutan} onChange={update} />
            <ShortField label="Há quanto tempo?" name="roacutanDetails" value={form.roacutanDetails} onChange={update} />
          </div>

          <Field label="Está tomando algum medicamento ou suplementação?" name="medications" value={form.medications} onChange={update} />
          <Field label="Possui alguma alergia?" name="allergies" value={form.allergies} onChange={update} />

          <div className="grid gap-6 md:grid-cols-2">
            <YesNo label="Possui alergia a albumina (ovo)?" name="allergicToEgg" value={form.allergicToEgg} onChange={update} />
            <ShortField label="Possui alergia a frutos do mar?" name="allergicToSeafood" value={form.allergicToSeafood} onChange={update} />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <YesNo label="Já levou anestesia de dentista?" name="dentalAnesthesia" value={form.dentalAnesthesia} onChange={update} />
            <YesNo label="Teve alguma reação à anestesia do dentista?" name="dentalAnesthesiaReaction" value={form.dentalAnesthesiaReaction} onChange={update} />
          </div>

          <Field label="Já teve alguma reação indesejada a algum procedimento?" name="procedureReaction" value={form.procedureReaction} onChange={update} />
          <YesNo label="Tem tendência a cicatriz ou a queloide?" name="keloidTendency" value={form.keloidTendency} onChange={update} />
          <Field label="Possui alguma condição de saúde física, psíquica ou emocional?" name="diseases" value={form.diseases} onChange={update} />

          <div className="grid gap-6 md:grid-cols-2">
            <YesNo label="Possui herpes?" name="hasHerpes" value={form.hasHerpes} onChange={update} />
            <YesNo label="Fumante?" name="smoker" value={form.smoker} onChange={update} />
          </div>

          <div>
            <span className="block text-[11px] font-bold uppercase tracking-[0.18em] text-[#5A1F2B]">Pressão</span>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {["ALTA", "NORMAL", "BAIXA"].map((pressure) => (
                <button
                  key={pressure}
                  type="button"
                  onClick={() => update("bloodPressure", pressure)}
                  className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${form.bloodPressure === pressure ? "border-[#5A1F2B] bg-[#5A1F2B] text-white" : "border-[#E9DEC9] bg-white text-[#5B3A2E]"}`}
                >
                  {pressure}
                </button>
              ))}
            </div>
          </div>

          <ShortField label="Ingere uma boa quantidade de água durante o dia?" name="waterIntake" value={form.waterIntake} onChange={update} placeholder="Ex.: 2 litros/dia, pouca água..." />
          <YesNo label="Está grávida ou amamentando?" name="pregnantOrNursing" value={form.pregnantOrNursing} onChange={update} />
          <YesNo label="Faz exercícios físicos?" name="exercises" value={form.exercises} onChange={update} />
          <Field label="Tem cuidados com a pele em casa? O que usa?" name="skinCareRoutine" value={form.skinCareRoutine} onChange={update} />
          <Field label="Passou ou pretende passar por um processo de emagrecimento com perda maior de 5kg?" name="weightLoss" value={form.weightLoss} onChange={update} />
          <Field label="Já fez ou pretende passar por alguma cirurgia?" name="surgeries" value={form.surgeries} onChange={update} />
          <ShortField label="Tomou vacina nos últimos 30 dias?" name="recentTreatmentOrVaccine" value={form.recentTreatmentOrVaccine} onChange={update} />

          <div className="grid gap-6 md:grid-cols-2">
            <YesNo label="Possui doença autoimune?" name="hasAutoimmuneDisease" value={form.hasAutoimmuneDisease} onChange={update} />
            <YesNo label="Tem histórico de câncer?" name="cancerHistory" value={form.cancerHistory} onChange={update} />
            <YesNo label="Possui diabetes?" name="hasDiabetes" value={form.hasDiabetes} onChange={update} />
            <YesNo label="Usa anticoagulantes ou medicamentos que afinam o sangue?" name="usesAnticoagulant" value={form.usesAnticoagulant} onChange={update} />
            <YesNo label="Usa aspirina/AAS com frequência?" name="usesAspirin" value={form.usesAspirin} onChange={update} />
          </div>

          <Field label="Possui trombose ou algum problema de circulação?" name="circulationProblems" value={form.circulationProblems} onChange={update} />
          <Field label="Possui implantes permanentes? (PMMA, silicone, hidrogel)" name="permanentImplants" value={form.permanentImplants} onChange={update} />

          <div className="rounded-3xl border border-[#E9DEC9] bg-white p-5">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={form.consentSigned}
                onChange={(e) => update("consentSigned", e.target.checked)}
                className="mt-1 h-5 w-5 accent-[#5A1F2B]"
              />
              <span className="text-sm font-semibold leading-7 text-[#5B3A2E]">
                Declaro que as informações preenchidas são verdadeiras e completas. Estou ciente de que a omissão de informações pode comprometer minha segurança e o resultado do tratamento.
              </span>
            </label>
          </div>
        </section>

        <footer className="flex flex-col gap-3 border-t border-[#E9DEC9] bg-white/70 px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-10">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#5B3A2E]/55">Ficha sigilosa de atendimento</p>
          <button
            type="submit"
            disabled={saving || !form.consentSigned}
            className="inline-flex items-center justify-center gap-3 rounded-2xl bg-[#5A1F2B] px-8 py-4 text-[12px] font-bold uppercase tracking-[0.18em] text-white shadow-lg shadow-[#5A1F2B]/15 transition hover:bg-[#3F1620] disabled:opacity-40"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <ClipboardCheck size={18} />}
            {saving ? "Salvando..." : "Salvar ficha"}
          </button>
        </footer>
      </form>
    </main>
  );
}
