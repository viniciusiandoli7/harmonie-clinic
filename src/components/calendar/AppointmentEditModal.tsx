"use client";

import { useEffect, useMemo, useState } from "react";

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
      ? `Editar consulta • ${appointment.patient.name}`
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
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl border border-[#ECE7DD] bg-white shadow-2xl">
        <div className="border-b border-[#ECE7DD] bg-[#FCFAF6] px-6 py-4">
          <h2 className="text-xl font-medium text-[#111827]">{title}</h2>
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

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
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
                Sala
              </label>
              <select
                value={room}
                onChange={(e) => setRoom(e.target.value as Room)}
                className="h-11 w-full border border-[#ECE7DD] px-3 outline-none"
              >
                <option value="A">Sala A</option>
                <option value="B">Sala B</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
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
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as AppointmentStatus)}
                className="h-11 w-full border border-[#ECE7DD] px-3 outline-none"
              >
                <option value="SCHEDULED">Agendada</option>
                <option value="COMPLETED">Concluída</option>
                <option value="CANCELED">Cancelada</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[#8E9AAF]">
                Pagamento
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                className="h-11 w-full border border-[#ECE7DD] px-3 outline-none"
              >
                <option value="PENDING">Pendente</option>
                <option value="PAID">Pago</option>
                <option value="CANCELED">Cancelado</option>
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
              Observações
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[100px] w-full border border-[#ECE7DD] p-3 outline-none"
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