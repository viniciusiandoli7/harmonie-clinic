"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CalendarClock, PackagePlus, Search, Trash2 } from "lucide-react";

type InventoryItem = {
  id: string;
  product: string;
  supplier?: string | null;
  batch?: string | null;
  expiresAt?: string | null;
  quantity: number;
  minimumQuantity: number;
  unitValue: number;
  notes?: string | null;
};

function daysUntil(date: string) {
  return Math.ceil((new Date(date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ product: "", supplier: "", batch: "", expiresAt: "", quantity: "1", minimumQuantity: "1", unitValue: "0", notes: "" });

  async function loadItems() {
    const res = await fetch("/api/inventory-items");
    if (res.ok) setItems(await res.json());
  }

  useEffect(() => { loadItems(); }, []);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return items.filter((item) => [item.product, item.supplier, item.batch].filter(Boolean).some((v) => String(v).toLowerCase().includes(term)));
  }, [items, search]);

  const lowStock = items.filter((item) => item.quantity <= item.minimumQuantity).length;
  const expiring = items.filter((item) => item.expiresAt && daysUntil(item.expiresAt) <= 60).length;
  const totalValue = items.reduce((acc, item) => acc + item.quantity * item.unitValue, 0);

  async function createItem(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/inventory-items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product: form.product,
        supplier: form.supplier || null,
        batch: form.batch || null,
        expiresAt: form.expiresAt || null,
        quantity: Number(form.quantity),
        minimumQuantity: Number(form.minimumQuantity),
        unitValue: Number(form.unitValue),
        notes: form.notes || null,
      }),
    });
    setForm({ product: "", supplier: "", batch: "", expiresAt: "", quantity: "1", minimumQuantity: "1", unitValue: "0", notes: "" });
    setSaving(false);
    loadItems();
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
          <p className="micro-label text-brand-primary/70">Gestão de insumos e lotes</p>
          <h1 className="page-title mt-2">Estoque</h1>
          <p className="mt-3 max-w-2xl text-[14px] leading-6 text-brand-text/64">Controle produtos, fornecedores, lotes, validade, valor e alertas de reposição.</p>
        </div>
        <div className="flex h-12 min-w-72 items-center gap-3 rounded-full border border-[rgba(90,31,43,.12)] bg-brand-surface px-4 shadow-card">
          <Search size={16} className="text-brand-primary/55" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar produto, lote ou fornecedor" className="h-full w-full border-0 bg-transparent text-[12px] font-semibold outline-none" />
        </div>
      </header>

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Metric label="Itens em alerta de reposição" value={lowStock} icon={<AlertTriangle size={18} />} />
        <Metric label="Validades nos próximos 60 dias" value={expiring} icon={<CalendarClock size={18} />} />
        <Metric label="Valor estimado em estoque" value={totalValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} icon={<PackagePlus size={18} />} />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[.85fr_1.15fr]">
        <form onSubmit={createItem} className="premium-card p-6">
          <p className="micro-label">Novo item</p>
          <h2 className="mt-2 text-3xl">Cadastrar produto</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Field label="Produto" value={form.product} onChange={(v: string) => setForm({ ...form, product: v })} required />
            <Field label="Fornecedor" value={form.supplier} onChange={(v: string) => setForm({ ...form, supplier: v })} />
            <Field label="Lote" value={form.batch} onChange={(v: string) => setForm({ ...form, batch: v })} />
            <Field label="Validade" type="date" value={form.expiresAt} onChange={(v: string) => setForm({ ...form, expiresAt: v })} />
            <Field label="Quantidade" type="number" value={form.quantity} onChange={(v: string) => setForm({ ...form, quantity: v })} required />
            <Field label="Qtd. mínima" type="number" value={form.minimumQuantity} onChange={(v: string) => setForm({ ...form, minimumQuantity: v })} required />
            <Field label="Valor unitário" type="number" value={form.unitValue} onChange={(v: string) => setForm({ ...form, unitValue: v })} />
            <Field label="Observações" value={form.notes} onChange={(v: string) => setForm({ ...form, notes: v })} />
          </div>
          <button disabled={saving} className="btn-primary mt-6 w-full"><PackagePlus size={15} /> {saving ? "Salvando..." : "Salvar item"}</button>
        </form>

        <section className="premium-card overflow-hidden">
          <div className="border-b border-[rgba(90,31,43,.10)] px-6 py-5">
            <p className="micro-label mb-1">Lista de estoque</p>
            <h2 className="text-3xl">{filtered.length} item(ns)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left">
              <thead className="bg-brand-surface-muted/45">
                <tr>{["Produto", "Fornecedor", "Lote", "Validade", "Qtd.", "Valor", ""].map((h) => <th key={h} className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-brand-text/55">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-[rgba(90,31,43,.08)]">
                {filtered.map((item) => {
                  const expiryDays = item.expiresAt ? daysUntil(item.expiresAt) : null;
                  const hasLowStock = item.quantity <= item.minimumQuantity;
                  const hasExpiryAlert = expiryDays !== null && expiryDays <= 60;
                  return (
                    <tr key={item.id} className="hover:bg-[rgba(90,31,43,.04)]">
                      <td className="px-5 py-4 font-semibold text-brand-strong">{item.product}</td>
                      <td className="px-5 py-4 text-sm text-brand-text/65">{item.supplier || "—"}</td>
                      <td className="px-5 py-4 text-sm text-brand-text/65">{item.batch || "—"}</td>
                      <td className="px-5 py-4 text-sm">
                        {item.expiresAt ? new Date(item.expiresAt).toLocaleDateString("pt-BR") : "—"}
                        {hasExpiryAlert && <span className="ml-2 rounded-full bg-brand-warning/12 px-2 py-1 text-[10px] font-bold text-brand-warning">Validade</span>}
                      </td>
                      <td className="px-5 py-4 text-sm font-bold text-brand-strong">
                        {item.quantity}
                        {hasLowStock && <span className="ml-2 rounded-full bg-brand-danger/12 px-2 py-1 text-[10px] font-bold text-brand-danger">Reposição</span>}
                      </td>
                      <td className="px-5 py-4 font-serif text-lg text-brand-primary">{item.unitValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
                      <td className="px-5 py-4 text-right"><button onClick={() => deleteItem(item.id)} className="rounded-full p-2 text-brand-danger hover:bg-brand-danger/10"><Trash2 size={15} /></button></td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && <tr><td colSpan={7} className="px-6 py-12 text-center text-sm text-brand-text/55">Nenhum item encontrado.</td></tr>}
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
      <div><p className="micro-label">{label}</p><p className="mt-3 font-serif text-3xl text-brand-primary">{value}</p></div>
      <div className="rounded-2xl bg-brand-primary/10 p-3 text-brand-primary">{icon}</div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required = false }: any) {
  return (
    <label className="block">
      <span>{label}</span>
      <input type={type} value={value} required={required} onChange={(e) => onChange(e.target.value)} className="h-12 w-full border px-4 text-sm" />
    </label>
  );
}
