"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CalendarClock, PackagePlus, Search, Trash2 } from "lucide-react";

const CATEGORIES = ["Injetável", "Peeling", "Anestésico", "Descartável", "Bioestimulador", "Equipamento", "Outros"];

const PROCEDURE_OPTIONS = [
  "Consulta",
  "Retorno",
  "Ultrassom Micro e Macrofocado",
  "Toxina Botulínica",
  "Skinbooster",
  "Preenchimento",
  "PEIM",
  "Peeling",
  "PDRN",
  "Microagulhamento",
  "Mesoterapia",
  "Limpeza de Pele Profunda",
  "Lavieen",
  "Jato de Plasma",
  "Fios de PDO",
  "Bioestimulador",
  "Intradermoterapia local",
  "Intradermoterapia IM",
];
const STATUSES = [
  { value: "DISPONIVEL", label: "Disponível" },
  { value: "RESERVADO", label: "Reservado" },
  { value: "UTILIZADO", label: "Utilizado" },
  { value: "VENCIDO", label: "Vencido" },
  { value: "DESCARTADO", label: "Descartado" },
];

type InventoryItem = {
  id: string;
  product: string;
  category?: string | null;
  linkedProcedure?: string | null;
  entryQuantity: number;
  quantity: number;
  entryDate?: string | null;
  batch?: string | null;
  expiresAt?: string | null;
  minimumQuantity: number;
  unitValue: number;
  applicationMaterials?: string | null;
  applicationMaterialsValue?: number | null;
  status?: string | null;
  patientName?: string | null;
  exitDate?: string | null;
  notes?: string | null;
};

type InventoryForm = {
  product: string;
  category: string;
  linkedProcedure: string;
  entryQuantity: string;
  entryDate: string;
  batch: string;
  expiresAt: string;
  minimumQuantity: string;
  unitValue: string;
  applicationMaterialsValue: string;
  status: string;
  notes: string;
};

const emptyForm: InventoryForm = {
  product: "",
  category: "",
  linkedProcedure: "",
  entryQuantity: "1",
  entryDate: new Date().toISOString().slice(0, 10),
  batch: "",
  expiresAt: "",
  minimumQuantity: "1",
  unitValue: "0",
  applicationMaterialsValue: "0",
  status: "DISPONIVEL",
  notes: "",
};

function daysUntil(date: string) {
  return Math.ceil((new Date(date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("pt-BR");
}

function formatCurrency(value: number) {
  return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function statusLabel(value?: string | null) {
  return STATUSES.find((status) => status.value === value)?.label || value || "Disponível";
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<InventoryForm>(emptyForm);

  async function loadItems() {
    const res = await fetch("/api/inventory-items");
    if (res.ok) setItems(await res.json());
  }

  useEffect(() => {
    loadItems();
  }, []);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return items.filter((item) =>
      [
        item.product,
        item.category,
        item.linkedProcedure,
        item.batch,
        item.status ? statusLabel(item.status) : "",
        item.patientName,
        item.notes,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term))
    );
  }, [items, search]);

  const lowStock = items.filter((item) => item.quantity <= item.minimumQuantity && item.status !== "UTILIZADO" && item.status !== "DESCARTADO").length;
  const expiring = items.filter((item) => item.expiresAt && daysUntil(item.expiresAt) <= 60 && item.status !== "UTILIZADO" && item.status !== "DESCARTADO").length;
  const totalValue = items.reduce((acc, item) => acc + (item.quantity * item.unitValue) + Number(item.applicationMaterialsValue || 0), 0);
  const entryQuantity = Math.max(0, Number(form.entryQuantity) || 0);
  const unitValue = Math.max(0, Number(form.unitValue) || 0);
  const applicationMaterialsValue = Math.max(0, Number(form.applicationMaterialsValue) || 0);
  const totalCost = (entryQuantity * unitValue) + applicationMaterialsValue;

  async function createItem(e: React.FormEvent) {
    e.preventDefault();

    const payload = {
      product: form.product,
      category: form.category || null,
      linkedProcedure: form.linkedProcedure || null,
      entryQuantity,
      quantity: entryQuantity,
      entryDate: form.entryDate || null,
      batch: form.batch || null,
      expiresAt: form.expiresAt || null,
      minimumQuantity: Math.max(0, Number(form.minimumQuantity) || 0),
      unitValue,
      applicationMaterials: null,
      applicationMaterialsValue,
      status: form.status || "DISPONIVEL",
      notes: form.notes || null,
    };

    setSaving(true);
    const res = await fetch("/api/inventory-items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      alert(data?.error?.formErrors?.join?.(", ") || data?.error || "Erro ao salvar item no estoque.");
    } else {
      setForm(emptyForm);
      await loadItems();
    }

    setSaving(false);
  }

  async function deleteItem(id: string) {
    if (!window.confirm("Excluir item do estoque?")) return;
    await fetch(`/api/inventory-items/${id}`, { method: "DELETE" });
    loadItems();
  }

  return (
    <div className="min-h-screen px-2 py-3 font-sans text-brand-text sm:px-4 lg:px-6">
      <header className="flex flex-col gap-6 border-b border-[rgba(90,31,43,.12)] pb-8 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="micro-label text-brand-primary/70">Gestão de insumos, lotes e uso clínico</p>
          <h1 className="page-title mt-2">Estoque</h1>
          <p className="mt-3 max-w-3xl text-[14px] leading-6 text-brand-text/64">
            Controle completo com produto, categoria, procedimento vinculado, entrada, disponibilidade, lote, validade, custo, status e vínculo automático pela agenda.
          </p>
        </div>
        <div className="flex h-12 min-w-72 items-center gap-3 rounded-full border border-[rgba(90,31,43,.12)] bg-brand-surface px-4 shadow-card">
          <Search size={16} className="text-brand-primary/55" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar produto, categoria, lote, procedimento ou paciente..."
            className="h-full w-full border-0 bg-transparent text-[12px] font-semibold outline-none"
          />
        </div>
      </header>

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Metric label="Itens em alerta de reposição" value={lowStock} icon={<AlertTriangle size={18} />} />
        <Metric label="Validades nos próximos 60 dias" value={expiring} icon={<CalendarClock size={18} />} />
        <Metric label="Valor disponível em estoque" value={formatCurrency(totalValue)} icon={<PackagePlus size={18} />} />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 2xl:grid-cols-[.9fr_1.1fr]">
        <form onSubmit={createItem} className="premium-card p-6">
          <p className="micro-label">Novo item</p>
          <h2 className="mt-2 text-3xl">Cadastrar produto</h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Field label="1. Produto" value={form.product} onChange={(v: string) => setForm({ ...form, product: v })} required placeholder="Nome do produto/material" />

            <label className="block">
              <span>2. Categoria</span>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="h-12 w-full border px-4 text-sm">
                <option value="">Selecione...</option>
                {CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </label>

            <label className="block sm:col-span-2">
              <span>3. Procedimento vinculado</span>
              <select value={form.linkedProcedure} onChange={(e) => setForm({ ...form, linkedProcedure: e.target.value })} className="h-12 w-full border px-4 text-sm">
                <option value="">Selecione uma opção da agenda...</option>
                {PROCEDURE_OPTIONS.map((procedure) => <option key={procedure} value={procedure}>{procedure}</option>)}
              </select>
              <p className="mt-1 text-[10px] text-brand-text/50">Quando esse procedimento for agendado, o sistema vincula automaticamente paciente e data.</p>
            </label>
            <Field label="4. Quantidade de entrada" type="number" value={form.entryQuantity} onChange={(v: string) => setForm({ ...form, entryQuantity: v })} required />
            <ReadOnlyField label="5. Quantidade disponível" value={`${entryQuantity}`} hint="Automático no cadastro" />
            <Field label="6. Data de entrada" type="date" value={form.entryDate} onChange={(v: string) => setForm({ ...form, entryDate: v })} />
            <Field label="7. Lote" value={form.batch} onChange={(v: string) => setForm({ ...form, batch: v })} />
            <Field label="8. Validade" type="date" value={form.expiresAt} onChange={(v: string) => setForm({ ...form, expiresAt: v })} />
            <Field label="9. Custo unitário" type="number" value={form.unitValue} onChange={(v: string) => setForm({ ...form, unitValue: v })} />
            <ReadOnlyField label="10. Custo total" value={formatCurrency(totalCost)} hint="Entrada × custo unitário" />

            <Field
              label="11. Valor dos materiais de aplicação"
              type="number"
              value={form.applicationMaterialsValue}
              onChange={(v: string) => setForm({ ...form, applicationMaterialsValue: v })}
              placeholder="Ex: custo de agulha, cânula, seringa, descartáveis..."
            />

            <label className="block">
              <span>12. Status</span>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="h-12 w-full border px-4 text-sm">
                {STATUSES.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
              </select>
            </label>

            <Field label="Qtd. mínima para alerta" type="number" value={form.minimumQuantity} onChange={(v: string) => setForm({ ...form, minimumQuantity: v })} required />

            <div className="sm:col-span-2 rounded-3xl border border-dashed border-[rgba(90,31,43,.16)] bg-brand-surface-muted/35 p-4">
              <p className="micro-label text-brand-primary/70">13 e 14 automáticos</p>
              <p className="mt-2 text-[12px] leading-6 text-brand-text/62">
                Paciente vinculado e data de saída serão preenchidos automaticamente quando esse procedimento for selecionado em um agendamento na agenda.
              </p>
            </div>

            <label className="block sm:col-span-2">
              <span>15. Observação</span>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Produto aberto, perda, descarte, ajuste, observações clínicas..."
                className="min-h-24 w-full border px-4 py-3 text-sm outline-none"
              />
            </label>
          </div>

          <button disabled={saving} className="btn-primary mt-6 w-full">
            <PackagePlus size={15} /> {saving ? "Salvando..." : "Salvar item"}
          </button>
        </form>

        <section className="premium-card overflow-hidden">
          <div className="border-b border-[rgba(90,31,43,.10)] px-6 py-5">
            <p className="micro-label mb-1">Lista de estoque</p>
            <h2 className="text-3xl">{filtered.length} item(ns)</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1720px] text-left">
              <thead className="bg-brand-surface-muted/45">
                <tr>
                  {[
                    "Produto",
                    "Categoria",
                    "Procedimento",
                    "Qtd. entrada",
                    "Qtd. disponível",
                    "Data entrada",
                    "Lote",
                    "Validade",
                    "Custo unit.",
                    "Custo total",
                    "Materiais de aplicação",
                    "Status",
                    "Paciente",
                    "Data saída",
                    "Observação",
                    "",
                  ].map((h) => (
                    <th key={h} className="px-4 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-brand-text/55">{h}</th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-[rgba(90,31,43,.08)]">
                {filtered.map((item) => {
                  const expiryDays = item.expiresAt ? daysUntil(item.expiresAt) : null;
                  const hasLowStock = item.quantity <= item.minimumQuantity && item.status !== "UTILIZADO" && item.status !== "DESCARTADO";
                  const hasExpiryAlert = expiryDays !== null && expiryDays <= 60 && item.status !== "UTILIZADO" && item.status !== "DESCARTADO";
                  const itemMaterialsValue = Number(item.applicationMaterialsValue || 0);
                  const itemTotal = (item.quantity * item.unitValue) + itemMaterialsValue;

                  return (
                    <tr key={item.id} className="hover:bg-[rgba(90,31,43,.04)]">
                      <td className="px-4 py-4 font-semibold text-brand-strong">{item.product}</td>
                      <td className="px-4 py-4 text-sm text-brand-text/65">{item.category || "—"}</td>
                      <td className="px-4 py-4 text-sm text-brand-text/65">{item.linkedProcedure || "—"}</td>
                      <td className="px-4 py-4 text-sm font-bold text-brand-strong">{item.entryQuantity ?? item.quantity}</td>
                      <td className="px-4 py-4 text-sm font-bold text-brand-strong">
                        {item.quantity}
                        {hasLowStock && <span className="ml-2 rounded-full bg-brand-danger/12 px-2 py-1 text-[10px] font-bold text-brand-danger">Reposição</span>}
                      </td>
                      <td className="px-4 py-4 text-sm text-brand-text/65">{formatDate(item.entryDate)}</td>
                      <td className="px-4 py-4 text-sm text-brand-text/65">{item.batch || "—"}</td>
                      <td className="px-4 py-4 text-sm">
                        {formatDate(item.expiresAt)}
                        {hasExpiryAlert && <span className="ml-2 rounded-full bg-brand-warning/12 px-2 py-1 text-[10px] font-bold text-brand-warning">Validade</span>}
                      </td>
                      <td className="px-4 py-4 font-serif text-lg text-brand-primary">{formatCurrency(item.unitValue)}</td>
                      <td className="px-4 py-4 font-serif text-lg text-brand-primary">{formatCurrency(itemTotal)}</td>
                      <td className="px-4 py-4 font-serif text-lg text-brand-primary">{formatCurrency(Number(item.applicationMaterialsValue || 0))}</td>
                      <td className="px-4 py-4">
                        <span className="rounded-full bg-brand-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-primary">
                          {statusLabel(item.status)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-brand-text/65">{item.patientName || "—"}</td>
                      <td className="px-4 py-4 text-sm text-brand-text/65">{formatDate(item.exitDate)}</td>
                      <td className="max-w-[220px] px-4 py-4 text-xs leading-5 text-brand-text/65">{item.notes || "—"}</td>
                      <td className="px-4 py-4 text-right">
                        <button onClick={() => deleteItem(item.id)} className="rounded-full p-2 text-brand-danger hover:bg-brand-danger/10">
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={16} className="px-6 py-12 text-center text-sm text-brand-text/55">Nenhum item encontrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function Metric({ label, value, icon }: any) {
  return (
    <div className="premium-card flex items-center justify-between p-6">
      <div>
        <p className="micro-label">{label}</p>
        <p className="mt-3 font-serif text-3xl text-brand-primary">{value}</p>
      </div>
      <div className="rounded-2xl bg-brand-primary/10 p-3 text-brand-primary">{icon}</div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required = false, placeholder = "" }: any) {
  return (
    <label className="block">
      <span>{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full border px-4 text-sm"
      />
    </label>
  );
}

function ReadOnlyField({ label, value, hint }: any) {
  return (
    <label className="block">
      <span>{label}</span>
      <input value={value} readOnly className="h-12 w-full border bg-brand-surface-muted/35 px-4 text-sm font-bold text-brand-primary" />
      {hint && <p className="mt-1 text-[10px] text-brand-text/50">{hint}</p>}
    </label>
  );
}
