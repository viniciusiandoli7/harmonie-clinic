"use client";

import { useEffect, useMemo, useState } from "react";

type Patient = {
  id: string;
  name: string;
  email: string;
};

type AppointmentStatus = "SCHEDULED" | "COMPLETED" | "CANCELED";

type Appointment = {
  id: string;
  date: string;
  status: AppointmentStatus;
  patientId: string;
  patient?: Patient;
};

function toLocalInputValue(date: Date) {
  // yyyy-MM-ddThh:mm para input[type=datetime-local]
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const mi = pad(date.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

export default function AppointmentsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form de criação
  const [form, setForm] = useState<{ date: string; status: AppointmentStatus }>({
    date: toLocalInputValue(new Date()),
    status: "SCHEDULED",
  });

  function showMsg(type: "success" | "error", text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  }

  async function loadPatients() {
    try {
      const res = await fetch("/api/patients", { cache: "no-store" });
      const data = await res.json();
      if (Array.isArray(data)) {
        setPatients(data);
        // seleciona o primeiro automaticamente
        if (!selectedPatientId && data.length > 0) {
          setSelectedPatientId(data[0].id);
        }
      } else {
        setPatients([]);
      }
    } catch {
      showMsg("error", "Erro ao carregar pacientes.");
    }
  }

  async function loadAppointments(patientId: string) {
    if (!patientId) {
      setAppointments([]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/appointments?patientId=${patientId}`, { cache: "no-store" });
      const data = await res.json();
      setAppointments(Array.isArray(data) ? data : []);
    } catch {
      showMsg("error", "Erro ao carregar consultas.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPatients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadAppointments(selectedPatientId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPatientId]);

  const selectedPatient = useMemo(
    () => patients.find((p) => p.id === selectedPatientId),
    [patients, selectedPatientId]
  );

  const canCreate = useMemo(() => {
    return Boolean(selectedPatientId) && Boolean(form.date);
  }, [selectedPatientId, form.date]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!canCreate) {
      showMsg("error", "Selecione um paciente e uma data.");
      return;
    }

    setLoading(true);
    try {
      // input datetime-local vem sem timezone. Vamos converter pra ISO.
      const iso = new Date(form.date).toISOString();

      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: selectedPatientId,
          date: iso,
          status: form.status,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showMsg("error", data?.error ?? "Erro ao criar consulta.");
        return;
      }

      showMsg("success", "Consulta criada!");
      await loadAppointments(selectedPatientId);
    } finally {
      setLoading(false);
    }
  }

  async function handleChangeStatus(appointmentId: string, status: AppointmentStatus) {
    setLoading(true);
    try {
      const res = await fetch(`/api/appointments/${appointmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();

      if (!res.ok) {
        showMsg("error", data?.error ?? "Erro ao atualizar status.");
        return;
      }

      showMsg("success", "Status atualizado!");
      await loadAppointments(selectedPatientId);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(appointmentId: string) {
    const ok = confirm("Tem certeza que deseja deletar esta consulta?");
    if (!ok) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/appointments/${appointmentId}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        showMsg("error", data?.error ?? "Erro ao deletar consulta.");
        return;
      }

      showMsg("success", "Consulta deletada!");
      await loadAppointments(selectedPatientId);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Consultas</h1>
        <button
          onClick={() => loadAppointments(selectedPatientId)}
          className="px-3 py-2 rounded-md border hover:bg-gray-50"
          disabled={loading}
        >
          Recarregar
        </button>
      </div>

      {message && (
        <div
          className={[
            "mt-4 p-3 rounded-md border",
            message.type === "success" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200",
          ].join(" ")}
        >
          <p className="text-sm">{message.text}</p>
        </div>
      )}

      {/* Seletor de paciente */}
      <div className="mt-6 p-4 border rounded-lg">
        <h2 className="font-medium">Paciente</h2>
        <div className="mt-3 flex flex-col md:flex-row gap-3 md:items-center">
          <select
            className="border rounded-md p-2 w-full md:w-[420px]"
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
          >
            {patients.length === 0 ? (
              <option value="">Nenhum paciente encontrado</option>
            ) : (
              patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.email})
                </option>
              ))
            )}
          </select>

          {selectedPatient && (
            <div className="text-sm text-gray-700">
              <span className="font-medium">{selectedPatient.name}</span>{" "}
              <span className="text-gray-500">• {selectedPatient.email}</span>
            </div>
          )}
        </div>
      </div>

      {/* Criar consulta */}
      <form onSubmit={handleCreate} className="mt-6 p-4 border rounded-lg space-y-3">
        <h2 className="font-medium">Nova consulta</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600">Data/Hora</label>
            <input
              type="datetime-local"
              className="border rounded-md p-2"
              value={form.date}
              onChange={(e) => setForm((s) => ({ ...s, date: e.target.value }))}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600">Status</label>
            <select
              className="border rounded-md p-2"
              value={form.status}
              onChange={(e) => setForm((s) => ({ ...s, status: e.target.value as AppointmentStatus }))}
            >
              <option value="SCHEDULED">SCHEDULED</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELED">CANCELED</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading || !canCreate}
              className="w-full md:w-auto px-4 py-2 rounded-md bg-black text-white disabled:opacity-50"
            >
              {loading ? "Salvando..." : "Criar consulta"}
            </button>
          </div>
        </div>
      </form>

      {/* Lista de consultas */}
      <div className="mt-6">
        <h2 className="font-medium mb-3">Consultas do paciente</h2>

        <div className="border rounded-lg overflow-hidden">
          <div className="grid grid-cols-12 gap-2 bg-gray-50 border-b p-3 text-sm font-medium">
            <div className="col-span-4">Data/Hora</div>
            <div className="col-span-3">Status</div>
            <div className="col-span-3">Paciente</div>
            <div className="col-span-2 text-right">Ações</div>
          </div>

          {loading && appointments.length === 0 ? (
            <div className="p-4 text-sm text-gray-600">Carregando...</div>
          ) : appointments.length === 0 ? (
            <div className="p-4 text-sm text-gray-600">Nenhuma consulta para este paciente.</div>
          ) : (
            appointments.map((a) => {
              const dt = new Date(a.date);
              const label = dt.toLocaleString("pt-BR");

              return (
                <div key={a.id} className="grid grid-cols-12 gap-2 p-3 border-b text-sm items-center">
                  <div className="col-span-4">{label}</div>

                  <div className="col-span-3">
                    <select
                      className="border rounded-md p-2 w-full"
                      value={a.status}
                      onChange={(e) => handleChangeStatus(a.id, e.target.value as AppointmentStatus)}
                      disabled={loading}
                    >
                      <option value="SCHEDULED">SCHEDULED</option>
                      <option value="COMPLETED">COMPLETED</option>
                      <option value="CANCELED">CANCELED</option>
                    </select>
                  </div>

                  <div className="col-span-3 text-gray-700">
                    {a.patient?.name ?? selectedPatient?.name ?? "-"}
                  </div>

                  <div className="col-span-2 flex justify-end">
                    <button
                      className="px-3 py-2 rounded-md border hover:bg-red-50"
                      onClick={() => handleDelete(a.id)}
                      disabled={loading}
                      type="button"
                    >
                      Deletar
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <p className="mt-3 text-xs text-gray-500">
          Dica: para criar consultas em horários exatos, ajuste a data/hora no campo acima. O status pode ser alterado
          direto na lista.
        </p>
      </div>
    </div>
  );
}