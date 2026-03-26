"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

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

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.22em] text-[#96A4C1]">
      {children}
    </label>
  );
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
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/45 p-4">
      <div className="w-full max-w-xl border border-[#F0ECE4] bg-white shadow-[0_20px_60px_rgba(17,17,17,0.18)]">
        <div className="flex items-center justify-between border-b border-[#F0ECE4] bg-[#FCFAF6] px-6 py-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.34em] text-[#C8A35F]">
              Agenda
            </p>
            <h2
              className="mt-2 text-[28px] text-[#111111]"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              Editar Bloqueio
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center border border-[#ECE7DD] text-[#64748B] transition hover:text-[#111111]"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          {error && (
            <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <FieldLabel>Início</FieldLabel>
              <input
                type="datetime-local"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="h-11 w-full border border-[#ECE7DD] px-3 text-sm outline-none"
                required
              />
            </div>

            <div>
              <FieldLabel>Fim</FieldLabel>
              <input
                type="datetime-local"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="h-11 w-full border border-[#ECE7DD] px-3 text-sm outline-none"
                required
              />
            </div>
          </div>

          <div>
            <FieldLabel>Motivo</FieldLabel>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex.: almoço, manutenção, reunião"
              className="h-11 w-full border border-[#ECE7DD] px-3 text-sm outline-none"
            />
          </div>

          <div className="flex flex-wrap justify-between gap-3 pt-1">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting || saving}
              className="h-11 border border-red-200 px-5 text-[12px] font-semibold uppercase tracking-[0.14em] text-red-700 disabled:opacity-60"
            >
              {deleting ? "Excluindo..." : "Excluir"}
            </button>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="h-11 border border-[#ECE7DD] px-5 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#111827]"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={saving}
                className="h-11 bg-[#111111] px-5 text-[12px] font-semibold uppercase tracking-[0.14em] text-white disabled:opacity-60"
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