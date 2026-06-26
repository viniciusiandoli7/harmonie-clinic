"use client";

import { useEffect, useMemo, useState } from "react";
import { Calculator, CheckCircle2, Plus, RefreshCcw, Save, ShieldCheck, Trash2 } from "lucide-react";

const fmtCurrency = (v: number) => (v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

type CostItem = { name: string; type: string; quantity: number; unitCost: number; totalCost?: number; notes?: string };
type Treatment = {
  id: string;
  name: string;
  standardPrice: number;
  averageCost: number;
  averageDurationMinutes: number;
  defaultReturnDays?: number | null;
  requiresTerm: boolean;
  requiresPhotos: boolean;
  requiresBatch: boolean;
  postCareInstructions?: string | null;
  defaultWhatsAppMessage?: string | null;
  costItems?: CostItem[];
  calculatedCost?: number;
  margin?: number;
  marginPercent?: number;
};

const emptyForm = {
  name: "",
  standardPrice: "",
  averageDurationMinutes: "60",
  defaultReturnDays: "",
  requiresTerm: true,
  requiresPhotos: true,
  requiresBatch: true,
  postCareInstructions: "",
  defaultWhatsAppMessage: "",
  costItems: [{ name: "Produto principal", type: "Produto", quantity: 1, unitCost: 0 } as CostItem],
};

export default function ProceduresPage() {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [selected, setSelected] = useState<Treatment | null>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch("/api/treatment-catalog?includeInactive=true");
    if (res.ok) setTreatments(await res.json());
  }

  useEffect(() => { load(); }, []);

  const calculatedCost = useMemo(() => form.costItems.reduce((sum: number, item: CostItem) => sum + Number(item.quantity || 0) * Number(item.unitCost || 0), 0), [form.costItems]);
  const price = Number(form.standardPrice || 0);
  const margin = price - calculatedCost;
  const marginPercent = price ? Math.round((margin / price) * 100) : 0;

  function edit(treatment: Treatment) {
    setSelected(treatment);
    setForm({
      name: treatment.name,
      standardPrice: String(treatment.standardPrice || ""),
      averageDurationMinutes: String(treatment.averageDurationMinutes || 60),
      defaultReturnDays: treatment.defaultReturnDays ? String(treatment.defaultReturnDays) : "",
      requiresTerm: treatment.requiresTerm,
      requiresPhotos: treatment.requiresPhotos,
      requiresBatch: treatment.requiresBatch,
      postCareInstructions: treatment.postCareInstructions || "",
      defaultWhatsAppMessage: treatment.defaultWhatsAppMessage || "",
      costItems: treatment.costItems?.length ? treatment.costItems.map((i: any) => ({ name: i.name, type: i.type, quantity: i.quantity, unitCost: i.unitCost, notes: i.notes || "" })) : emptyForm.costItems,
    });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, standardPrice: price, averageCost: calculatedCost, costItems: form.costItems.map((i: CostItem) => ({ ...i, totalCost: Number(i.quantity || 0) * Number(i.unitCost || 0) })) };
    const res = await fetch(selected ? `/api/treatment-catalog/${selected.id}` : "/api/treatment-catalog", {
      method: selected ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (res.ok) {
      setForm(emptyForm);
      setSelected(null);
      await load();
    }
  }

  function updateCost(index: number, patch: Partial<CostItem>) {
    setForm((prev: any) => ({ ...prev, costItems: prev.costItems.map((item: CostItem, i: number) => i === index ? { ...item, ...patch } : item) }));
  }

  return (
    <div className="min-h-screen px-2 py-3 font-sans text-brand-text sm:px-4 lg:px-6">
      <header className="flex flex-col gap-6 border-b border-[rgba(90,31,43,.12)] pb-8 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="micro-label text-brand-primary/70">Catálogo, custos e rentabilidade</p>
          <h1 className="page-title mt-2">Procedimentos</h1>
          <p className="mt-3 max-w-2xl text-[14px] leading-6 text-brand-text/64">Cadastre preço padrão, custo médio, tempo, retorno, necessidade de termo, fotos, lote e mensagens pós-procedimento.</p>
        </div>
        <button onClick={() => { setSelected(null); setForm(emptyForm); }} className="btn-primary h-12"><Plus size={15} /> Novo procedimento</button>
      </header>

      <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_.9fr]">
        <section className="space-y-4">
          {treatments.length === 0 ? (
            <div className="premium-card p-10 text-center text-sm text-brand-text/55">Nenhum procedimento cadastrado ainda.</div>
          ) : treatments.map((t) => (
            <button key={t.id} onClick={() => edit(t)} className="premium-card w-full p-5 text-left transition hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgba(63,22,32,.10)]">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-serif text-2xl text-brand-strong">{t.name}</p>
                  <p className="mt-2 text-[12px] text-brand-text/62">{t.averageDurationMinutes || 60} min • retorno {t.defaultReturnDays ? `${t.defaultReturnDays} dias` : "não definido"}</p>
                </div>
                <div className="grid grid-cols-3 gap-3 text-right">
                  <Mini label="Preço" value={fmtCurrency(t.standardPrice)} />
                  <Mini label="Custo" value={fmtCurrency(t.calculatedCost || t.averageCost)} />
                  <Mini label="Margem" value={`${fmtCurrency(t.margin || 0)} • ${t.marginPercent || 0}%`} accent />
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {t.requiresTerm && <Tag>Termo obrigatório</Tag>}
                {t.requiresPhotos && <Tag>Fotos</Tag>}
                {t.requiresBatch && <Tag>Lote</Tag>}
              </div>
            </button>
          ))}
        </section>

        <form onSubmit={save} className="premium-card sticky top-6 h-fit p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="micro-label">{selected ? "Editar" : "Novo"}</p>
              <h2 className="mt-2 font-serif text-3xl text-brand-strong">Ficha do procedimento</h2>
            </div>
            <button type="button" onClick={load} className="rounded-full border border-[rgba(90,31,43,.12)] p-3 text-brand-primary"><RefreshCcw size={15} /></button>
          </div>

          <div className="mt-6 space-y-4">
            <Field label="Nome do procedimento"><input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-premium" /></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Preço padrão"><input type="number" step="0.01" value={form.standardPrice} onChange={e => setForm({ ...form, standardPrice: e.target.value })} className="input-premium" /></Field>
              <Field label="Tempo médio"><input type="number" value={form.averageDurationMinutes} onChange={e => setForm({ ...form, averageDurationMinutes: e.target.value })} className="input-premium" /></Field>
            </div>
            <Field label="Retorno padrão em dias"><input type="number" value={form.defaultReturnDays} onChange={e => setForm({ ...form, defaultReturnDays: e.target.value })} className="input-premium" /></Field>

            <div className="rounded-3xl border border-[rgba(90,31,43,.12)] bg-brand-background/60 p-4">
              <div className="flex items-center justify-between gap-4">
                <p className="micro-label">Itens de custo</p>
                <button type="button" onClick={() => setForm((prev: any) => ({ ...prev, costItems: [...prev.costItems, { name: "", type: "Produto", quantity: 1, unitCost: 0 }] }))} className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-primary">+ item</button>
              </div>
              <div className="mt-4 space-y-3">
                {form.costItems.map((item: CostItem, index: number) => (
                  <div key={index} className="grid grid-cols-[1fr_70px_90px_32px] gap-2">
                    <input placeholder="Item" value={item.name} onChange={e => updateCost(index, { name: e.target.value })} className="input-premium h-10" />
                    <input type="number" step="0.01" value={item.quantity} onChange={e => updateCost(index, { quantity: Number(e.target.value) })} className="input-premium h-10" />
                    <input type="number" step="0.01" value={item.unitCost} onChange={e => updateCost(index, { unitCost: Number(e.target.value) })} className="input-premium h-10" />
                    <button type="button" onClick={() => setForm((prev: any) => ({ ...prev, costItems: prev.costItems.filter((_: any, i: number) => i !== index) }))} className="rounded-xl text-brand-danger hover:bg-brand-danger/10"><Trash2 size={14}/></button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <label className="rounded-2xl border border-[rgba(90,31,43,.12)] bg-brand-background/60 p-3 text-[11px]"><input type="checkbox" checked={form.requiresTerm} onChange={e => setForm({ ...form, requiresTerm: e.target.checked })} className="mr-2 accent-[#5A1F2B]"/>Termo</label>
              <label className="rounded-2xl border border-[rgba(90,31,43,.12)] bg-brand-background/60 p-3 text-[11px]"><input type="checkbox" checked={form.requiresPhotos} onChange={e => setForm({ ...form, requiresPhotos: e.target.checked })} className="mr-2 accent-[#5A1F2B]"/>Fotos</label>
              <label className="rounded-2xl border border-[rgba(90,31,43,.12)] bg-brand-background/60 p-3 text-[11px]"><input type="checkbox" checked={form.requiresBatch} onChange={e => setForm({ ...form, requiresBatch: e.target.checked })} className="mr-2 accent-[#5A1F2B]"/>Lote</label>
            </div>

            <Field label="Orientações pós-procedimento"><textarea value={form.postCareInstructions} onChange={e => setForm({ ...form, postCareInstructions: e.target.value })} className="input-premium min-h-24 py-3" /></Field>
            <Field label="Mensagem WhatsApp padrão"><textarea value={form.defaultWhatsAppMessage} onChange={e => setForm({ ...form, defaultWhatsAppMessage: e.target.value })} className="input-premium min-h-20 py-3" /></Field>

            <div className="grid grid-cols-3 gap-3 rounded-3xl bg-brand-primary/8 p-4">
              <Mini label="Custo" value={fmtCurrency(calculatedCost)} />
              <Mini label="Lucro" value={fmtCurrency(margin)} accent />
              <Mini label="Margem" value={`${marginPercent}%`} accent />
            </div>

            <button disabled={saving} className="btn-primary h-12 w-full"><Save size={15} /> {saving ? "Salvando..." : "Salvar procedimento"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: any) {
  return <label className="block"><span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.18em] text-brand-text/50">{label}</span>{children}</label>;
}
function Mini({ label, value, accent }: any) {
  return <div><p className="text-[9px] font-bold uppercase tracking-[0.18em] text-brand-text/45">{label}</p><p className={`mt-1 text-[12px] font-bold ${accent ? "text-brand-primary" : "text-brand-strong"}`}>{value}</p></div>;
}
function Tag({ children }: any) {
  return <span className="rounded-full bg-brand-primary/10 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-brand-primary"><CheckCircle2 size={10} className="mr-1 inline" />{children}</span>;
}
