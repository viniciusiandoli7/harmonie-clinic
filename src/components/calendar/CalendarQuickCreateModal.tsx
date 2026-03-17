"use client";

import { useEffect, useState } from "react";

type Patient = {
  id: string;
  name: string;
};

type CalendarQuickCreateModalProps = {
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

export default function CalendarQuickCreateModal({
  open,
  initialDate,
  onClose,
  onSaved,
}: CalendarQuickCreateModalProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientId, setPatientId] = useState("");
  const [date, setDate] = useState(toLocalInputValue(new Date()));
  const [durationMinutes, setDurationMinutes] = useState("30");
  const [procedureName, setProcedureName] = useState("");
  const [price, setPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    async function loadPatients() {
      try {
        const res = await fetch("/api/patients", { cache: "no-store" });
        const data = await res.json();
        setPatients(Array.isArray(data) ? data : []);
      } catch {
        setPatients([]);
      }
    }

    loadPatients();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    setPatientId("");
    setProcedureName("");
    setPrice("");
    setNotes("");
    setDurationMinutes("30");
    setError("");

    if (initialDate) {
      setDate(toLocalInputValue(new Date(initialDate)));
    } else {
      setDate(toLocalInputValue(new Date()));
    }
  }, [open, initialDate]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patientId,
          date: new Date(date).toISOString(),
          durationMinutes: Number(durationMinutes),
          procedureName: procedureName || null,
          price: price ? Number(price) : null,
          paymentStatus: "PENDING",
          status: "SCHEDULED",
          notes: notes || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error?.formErrors?.[0] ?? data?.error ?? "Erro ao criar consulta.");
        return;
      }

      await onSaved();
      onClose();
    } catch {
      setError("Erro ao criar consulta.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl border border-[#ECE7DD] bg-white shadow-2xl">
        <div className="border-b border-[#ECE7DD] bg-[#FCFAF6] px-6 py-4">
          <h2 className="text-xl font-medium text-[#111827]">Novo agendamento</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          {error && (
            <div className="border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[#8E9AAF]">
              Paciente
            </label>
            <select
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="h-11 w-full border border-[#ECE7DD] px-3 outline-none"
              required
            >
              <option value="">Selecione</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[#8E9AAF]">
                Data e hora
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
                Duração
              </label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="h-11 w-full border border-[#ECE7DD] px-3 outline-none"
              >
                <option value="30">30 min</option>
                <option value="60">60 min</option>
                <option value="90">90 min</option>
                <option value="120">120 min</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[#8E9AAF]">
              Procedimento
            </label>
            <input
              value={procedureName}
              onChange={(e) => setProcedureName(e.target.value)}
              className="h-11 w-full border border-[#ECE7DD] px-3 outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[#8E9AAF]">
              Valor
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="h-11 w-full border border-[#ECE7DD] px-3 outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[#8E9AAF]">
              Observações
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[100px] w-full border border-[#ECE7DD] p-3 outline-none"
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
              {saving ? "Salvando..." : "Salvar agendamento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}