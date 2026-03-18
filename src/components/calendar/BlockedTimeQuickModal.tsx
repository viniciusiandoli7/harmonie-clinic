"use client";

import { useEffect, useState } from "react";

type Props = {
  open: boolean;
  initialDate: string | null;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
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

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

export default function BlockedTimeQuickModal({
  open,
  initialDate,
  onClose,
  onSaved,
}: Props) {
  const [start, setStart] = useState(toLocalInputValue(new Date()));
  const [end, setEnd] = useState(toLocalInputValue(addMinutes(new Date(), 30)));
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    const base = initialDate ? new Date(initialDate) : new Date();
    const endDate = addMinutes(base, 30);

    setStart(toLocalInputValue(base));
    setEnd(toLocalInputValue(endDate));
    setReason("");
    setError("");
  }, [open, initialDate]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/blocked-times", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          start: new Date(start).toISOString(),
          end: new Date(end).toISOString(),
          reason: reason || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error ?? "Erro ao criar bloqueio.");
        return;
      }

      await onSaved();
      onClose();
    } catch {
      setError("Erro ao criar bloqueio.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xl border border-[#ECE7DD] bg-white shadow-2xl">
        <div className="border-b border-[#ECE7DD] bg-[#FCFAF6] px-6 py-4">
          <h2 className="text-xl font-medium text-[#111827]">Novo bloqueio</h2>
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
                Início
              </label>
              <input
                type="datetime-local"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="h-11 w-full border border-[#ECE7DD] px-3 outline-none"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[#8E9AAF]">
                Fim
              </label>
              <input
                type="datetime-local"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="h-11 w-full border border-[#ECE7DD] px-3 outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[#8E9AAF]">
              Motivo
            </label>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex.: almoço, manutenção, reunião"
              className="h-11 w-full border border-[#ECE7DD] px-3 outline-none"
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
              {saving ? "Salvando..." : "Salvar bloqueio"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}