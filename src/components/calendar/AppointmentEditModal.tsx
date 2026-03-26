"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";

type Patient = {
  id: string;
  name: string;
};

type Room = "A" | "B";
type AppointmentStatus = "SCHEDULED" | "COMPLETED" | "CANCELED";
type PaymentStatus = "PENDING" | "PAID" | "CANCELED";

type Appointment = {
  id: string;
  date: string;
  patientId: string;
  patient?: Patient;
  durationMinutes?: number;
  procedureName?: string | null;
  price?: number | null;
  status?: AppointmentStatus;
  paymentStatus?: PaymentStatus;
  notes?: string | null;
  room?: Room;
};

type Props = {
  open: boolean;
  appointment: Appointment | null;
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

export default function AppointmentEditModal({
  open,
  appointment,
  onClose,
  onSaved,
}: Props) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientId, setPatientId] = useState("");
  const [date, setDate] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("30");
  const [procedureName, setProcedureName] = useState("");
  const [price, setPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [room, setRoom] = useState<Room>("A");
  const [status, setStatus] = useState<AppointmentStatus>("SCHEDULED");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("PENDING");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
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
    if (!open || !appointment) return;

    setPatientId(appointment.patientId);
    setDate(toLocalInputValue(new Date(appointment.date)));
    setDurationMinutes(String(appointment.durationMinutes ?? 30));
    setProcedureName(appointment.procedureName ?? "");
    setPrice(
      appointment.price !== null && appointment.price !== undefined
        ? String(appointment.price)
        : ""
    );
    setNotes(appointment.notes ?? "");
    setRoom(appointment.room ?? "A");
    setStatus(appointment.status ?? "SCHEDULED");
    setPaymentStatus(appointment.paymentStatus ?? "PENDING");
    setError("");
  }, [open, appointment]);

  const canRender = open && appointment;

  const title = useMemo(() => {
    if (!appointment) return "Editar consulta";
    return appointment.patient?.name
      ? `Editar • ${appointment.patient.name}`
      : "Editar consulta";
  }, [appointment]);

  if (!canRender) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!appointment) return;

    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/appointments/${appointment.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patientId,
          date: new Date(date).toISOString(),
          durationMinutes: Number(durationMinutes),
          procedureName: procedureName || null,
          price: price ? Number(price) : null,
          notes: notes || null,
          room,
          status,
          paymentStatus,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error ?? "Erro ao atualizar consulta.");
        return;
      }

      await onSaved();
      onClose();
    } catch {
      setError("Erro ao atualizar consulta.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!appointment) return;

    const confirmed = window.confirm("Tem certeza que deseja excluir esta consulta?");
    if (!confirmed) return;

    setDeleting(true);
    setError("");

    try {
      const res = await fetch(`/api/appointments/${appointment.id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error ?? "Erro ao excluir consulta.");
        return;
      }

      await onSaved();
      onClose();
    } catch {
      setError("Erro ao excluir consulta.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/45 p-4">
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
              {title}
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

          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
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

            <div>
              <FieldLabel>Status</FieldLabel>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as AppointmentStatus)}
                className="h-11 w-full border border-[#ECE7DD] px-3 text-sm outline-none"
              >
                <option value="SCHEDULED">Agendada</option>
                <option value="COMPLETED">Concluída</option>
                <option value="CANCELED">Cancelada</option>
              </select>
            </div>

            <div>
              <FieldLabel>Pagamento</FieldLabel>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                className="h-11 w-full border border-[#ECE7DD] px-3 text-sm outline-none"
              >
                <option value="PENDING">Pendente</option>
                <option value="PAID">Pago</option>
                <option value="CANCELED">Cancelado</option>
              </select>
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