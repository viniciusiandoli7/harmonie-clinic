"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

type Patient = {
  id: string;
  name: string;
};

type Room = "A" | "B";

// 🛡️ REFINAMENTO: Lista oficial de procedimentos da Mariana Thomaz Carmona
const PROCEDURES = [
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
  "Intradermoterapia IM"
];

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
  const [date, setDate] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("30");
  const [procedureName, setProcedureName] = useState("");
  const [price, setPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [room, setRoom] = useState<Room>("A");
  
  // 🛡️ REFINAMENTO: Adicionado o Status para criar agendamentos já controlados
  const [status, setStatus] = useState("SCHEDULED");
  
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
    setStatus("SCHEDULED"); // Reseta para Agendado
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          // 🛡️ Garante que a data local seja enviada corretamente para o banco
          date: new Date(date).toISOString(),
          durationMinutes: Number(durationMinutes),
          procedureName: procedureName || null,
          price: price ? Number(price) : null,
          paymentStatus: "PENDING",
          status: status, // Envia o status selecionado
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
    // CORREÇÃO TAILWIND: z-[80] virou z-80
    <div className="fixed inset-0 z-80 flex items-center justify-center bg-black/45 p-4">
      <div className="w-full max-w-2xl border border-[#F0ECE4] bg-white shadow-[0_20px_60px_rgba(17,17,17,0.18)]">
        <div className="flex items-center justify-between border-b border-[#F0ECE4] bg-[#FCFAF6] px-6 py-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.34em] text-[#5A1F2B]">Agenda</p>
            <h2 className="mt-2 text-[28px] text-[#1E1A18111]" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
              Novo Agendamento
            </h2>
          </div>

          <button onClick={onClose} className="inline-flex h-10 w-10 items-center justify-center border border-[#ECE7DD] text-[#64748B] transition hover:text-[#1E1A18111]">
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
              className="h-11 w-full border border-[#ECE7DD] px-3 text-sm outline-none bg-white"
              required
            >
              <option value="">Selecione...</option>
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
                className="h-11 w-full border border-[#ECE7DD] px-3 text-sm outline-none bg-white"
              >
                <option value="A">Sala A</option>
                <option value="B">Sala B</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <FieldLabel>Procedimento</FieldLabel>
              <select
                value={procedureName}
                onChange={(e) => setProcedureName(e.target.value)}
                className="h-11 w-full border border-[#ECE7DD] px-3 text-sm outline-none bg-white"
                required
              >
                <option value="">Selecione...</option>
                {PROCEDURES.map((proc) => (
                  <option key={proc} value={proc}>{proc}</option>
                ))}
              </select>
            </div>

            <div>
              <FieldLabel>Status Inicial</FieldLabel>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="h-11 w-full border border-[#ECE7DD] px-3 text-sm outline-none bg-white"
              >
                <option value="SCHEDULED">Agendado</option>
                <option value="CONFIRMED">Confirmado</option>
                <option value="COMPLETED">Compareceu / Concluído</option>
                <option value="NO_SHOW">Faltou</option>
                <option value="RESCHEDULED">Remarcou</option>
                <option value="RETURN">Retorno</option>
                <option value="FIT_IN">Encaixe</option>
                <option value="CANCELED">Cancelado</option>
              </select>
            </div>
          </div>

          <div>
            <FieldLabel>Observações</FieldLabel>
            {/* CORREÇÃO TAILWIND: min-h-[70px] virou min-h-17.5 */}
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-17.5 w-full border border-[#ECE7DD] p-3 text-sm outline-none resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="h-11 border border-[#ECE7DD] px-5 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#1E1A18] hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={saving}
              className="h-11 bg-[#1E1A18111] px-5 text-[12px] font-semibold uppercase tracking-[0.14em] text-white disabled:opacity-60 hover:bg-[#5A1F2B] transition-colors"
            >
              {saving ? "Salvando..." : "Salvar agendamento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}