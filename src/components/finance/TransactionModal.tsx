"use client";

import { useEffect, useState } from "react";

type TransactionType = "INCOME" | "EXPENSE";

type FinancialTransaction = {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  type: TransactionType;
  notes?: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  initialData?: FinancialTransaction | null;
};

function toLocalInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const mi = pad(date.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

export default function TransactionModal({
  open,
  onClose,
  onSaved,
  initialData,
}: Props) {
  const [date, setDate] = useState(toLocalInputValue(new Date()));
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<TransactionType>("INCOME");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    if (initialData) {
      setDate(toLocalInputValue(new Date(initialData.date)));
      setDescription(initialData.description);
      setCategory(initialData.category);
      setAmount(String(initialData.amount));
      setType(initialData.type);
      setNotes(initialData.notes ?? "");
      setError("");
      return;
    }

    setDate(toLocalInputValue(new Date()));
    setDescription("");
    setCategory("");
    setAmount("");
    setType("INCOME");
    setNotes("");
    setError("");
  }, [open, initialData]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const url = initialData
        ? `/api/financial-transactions/${initialData.id}`
        : "/api/financial-transactions";

      const method = initialData ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: new Date(date).toISOString(),
          description,
          category,
          amount: Number(amount),
          type,
          notes: notes || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error?.formErrors?.[0] ?? data?.error ?? "Erro ao salvar.");
        return;
      }

      onSaved();
      onClose();
    } catch {
      setError("Erro ao salvar transação.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl border border-[#ECE7DD] bg-white shadow-2xl">
        <div className="border-b border-[#ECE7DD] bg-[#FCFAF6] px-6 py-4">
          <h2 className="text-xl font-medium text-[#111827]">
            {initialData ? "Editar transação" : "Nova transação"}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          {error && (
            <div className="border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[#8E9AAF]">
                Data
              </label>
              <input
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-11 w-full border border-[#ECE7DD] px-3 outline-none"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[#8E9AAF]">
                Tipo
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as TransactionType)}
                className="h-11 w-full border border-[#ECE7DD] px-3 outline-none"
              >
                <option value="INCOME">Entrada</option>
                <option value="EXPENSE">Saída</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[#8E9AAF]">
              Descrição
            </label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-11 w-full border border-[#ECE7DD] px-3 outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[#8E9AAF]">
                Categoria
              </label>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-11 w-full border border-[#ECE7DD] px-3 outline-none"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[#8E9AAF]">
                Valor
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-11 w-full border border-[#ECE7DD] px-3 outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[#8E9AAF]">
              Observações
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[110px] w-full border border-[#ECE7DD] p-3 outline-none"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="h-11 border border-[#ECE7DD] px-5 text-sm font-semibold uppercase tracking-[0.14em] text-[#111827]"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={saving}
              className="h-11 bg-[#111111] px-5 text-sm font-semibold uppercase tracking-[0.14em] text-white disabled:opacity-60"
            >
              {saving ? "Salvando..." : initialData ? "Salvar alterações" : "Salvar transação"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}