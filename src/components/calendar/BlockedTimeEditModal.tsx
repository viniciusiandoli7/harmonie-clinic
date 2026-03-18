"use client";

import { useEffect, useState } from "react";

type BlockedTime = {
  id: string;
  start: string;
  end: string;
  reason?: string | null;
};

type Props = {
  open: boolean;
  blockedTime: BlockedTime | null;
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

export default function BlockedTimeEditModal({
  open,
  blockedTime,
  onClose,
  onSaved,
}: Props) {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !blockedTime) return;

    setStart(toLocalInputValue(new Date(blockedTime.start)));
    setEnd(toLocalInputValue(new Date(blockedTime.end)));
    setReason(blockedTime.reason ?? "");
    setError("");
  }, [open, blockedTime]);

  if (!open || !blockedTime) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/blocked-times/${blockedTime.id}`, {
        method: "PATCH",
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
        setError(data?.error ?? "Erro ao atualizar bloqueio.");
        return;
      }

      await onSaved();
      onClose();
    } catch {
      setError("Erro ao atualizar bloqueio.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm("Tem certeza que deseja excluir este bloqueio?");
    if (!confirmed) return;

    setDeleting(true);
    setError("");

    try {
      const res = await fetch(`/api/blocked-times/${blockedTime.id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error ?? "Erro ao excluir bloqueio.");
        return;
      }

      await onSaved();
      onClose();
    } catch {
      setError("Erro ao excluir bloqueio.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xl border border-[#ECE7DD] bg-white shadow-2xl">
        <div className="border-b border-[#ECE7DD] bg-[#FCFAF6] px-6 py-4">
          <h2 className="text-xl font-medium text-[#111827]">Editar bloqueio</h2>
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

          <div className="flex flex-wrap justify-between gap-3">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting || saving}
              className="h-11 border border-red-200 px-5 text-sm font-semibold uppercase tracking-[0.14em] text-red-700 disabled:opacity-60"
            >
              {deleting ? "Excluindo..." : "Excluir"}
            </button>

            <div className="flex gap-3">
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
                {saving ? "Salvando..." : "Salvar alterações"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}