"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

type Patient = {
  id: string;
  name: string;
};

type Room = "A" | "B";

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

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.22em] text-[#96A4C1]">
      {children}
    </label>
  );
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
  const [room, setRoom] = useState<Room>("A");
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
    setRoom("A");
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
          room,
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
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-4">
      <div className="w-full max-w-2xl border border-[#F0ECE4] bg-white shadow-[0_20px_60px_rgba(17,17,17,0.18)]">
        <div className="flex items-center justify-between border-b border-[#F0ECE4] bg-[#FCFAF6] px-6 py-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.34em] text-[#C8A35F]">
              Agenda
            </p>
            <h2
              className="mt-2 text-[28px] text-[#111111]"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              Novo Agendamento
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

          <div>
            <FieldLabel>Paciente</FieldLabel>
            <select
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="h-11 w-full border border-[#ECE7DD] px-3 text-sm outline-none"
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

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <FieldLabel>Data e hora</FieldLabel>
              <input
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-11 w-full border border-[#ECE7DD] px-3 text-sm outline-none"
                required
              />
            </div>

            <div>
              <FieldLabel>Sala</FieldLabel>
              <select
                value={room}
                onChange={(e) => setRoom(e.target.value as Room)}
                className="h-11 w-full border border-[#ECE7DD] px-3 text-sm outline-none"
              >
                <option value="A">Sala A</option>
                <option value="B">Sala B</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <FieldLabel>Duração</FieldLabel>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="h-11 w-full border border-[#ECE7DD] px-3 text-sm outline-none"
              >
                <option value="30">30 min</option>
                <option value="60">60 min</option>
                <option value="90">90 min</option>
                <option value="120">120 min</option>
              </select>
            </div>

            <div>
              <FieldLabel>Valor</FieldLabel>
              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="h-11 w-full border border-[#ECE7DD] px-3 text-sm outline-none"
              />
            </div>
          </div>

          <div>
            <FieldLabel>Procedimento</FieldLabel>
            <input
              value={procedureName}
              onChange={(e) => setProcedureName(e.target.value)}
              className="h-11 w-full border border-[#ECE7DD] px-3 text-sm outline-none"
            />
          </div>

          <div>
            <FieldLabel>Observações</FieldLabel>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[96px] w-full border border-[#ECE7DD] p-3 text-sm outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-1">
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
              {saving ? "Salvando..." : "Salvar agendamento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}