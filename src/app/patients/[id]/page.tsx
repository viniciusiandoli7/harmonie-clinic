"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { buildWhatsappMessage, getWhatsappLink } from "@/lib/whatsapp";

type Patient = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  birthDate?: string | null;
  notes?: string | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type AppointmentStatus = "SCHEDULED" | "COMPLETED" | "CANCELED";
type PaymentStatus = "PENDING" | "PAID" | "CANCELED";

type Appointment = {
  id: string;
  date: string;
  status: AppointmentStatus;
  patientId: string;
  durationMinutes?: 30 | 60 | 90 | 120;
  notes?: string | null;
  procedureName?: string | null;
  price?: number | null;
  paymentStatus?: PaymentStatus;
  room?: "A" | "B";
};

type PageProps = {
  params: Promise<{ id: string }>;
};

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("pt-BR");
}

function formatDate(value?: string | null) {
  if (!value) return "Não informada";
  return new Date(value).toLocaleDateString("pt-BR");
}

function paymentBadgeClasses(status: PaymentStatus) {
  if (status === "PAID") return "bg-green-100 text-green-800 border-green-200";
  if (status === "CANCELED") return "bg-gray-100 text-gray-700 border-gray-200";
  return "bg-orange-100 text-orange-800 border-orange-200";
}

function statusBadgeClasses(status: AppointmentStatus) {
  if (status === "COMPLETED") return "bg-green-100 text-green-800 border-green-200";
  if (status === "CANCELED") return "bg-gray-100 text-gray-700 border-gray-200";
  return "bg-yellow-100 text-yellow-800 border-yellow-200";
}

export default function PatientDetailsPage({ params }: PageProps) {
  const router = useRouter();

  const [patientId, setPatientId] = useState("");
  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [changingStatus, setChangingStatus] = useState(false);

  useEffect(() => {
    async function resolveParams() {
      const p = await params;
      setPatientId(p.id);
    }

    resolveParams();
  }, [params]);

  async function loadData(id: string) {
    setLoading(true);
    setError("");

    try {
      const [patientRes, appointmentsRes] = await Promise.all([
        fetch(`/api/patients/${id}`, { cache: "no-store" }),
        fetch(`/api/appointments?patientId=${id}`, { cache: "no-store" }),
      ]);

      const patientData = await patientRes.json();
      const appointmentsData = await appointmentsRes.json();

      if (!patientRes.ok) {
        throw new Error(patientData?.error || "Erro ao carregar paciente");
      }

      if (!appointmentsRes.ok) {
        throw new Error(appointmentsData?.error || "Erro ao carregar consultas");
      }

      setPatient(patientData);
      setAppointments(Array.isArray(appointmentsData) ? appointmentsData : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!patientId) return;
    loadData(patientId);
  }, [patientId]);

  async function handleToggleActive() {
    if (!patient) return;

    const isCurrentlyActive = patient.isActive !== false;

    const confirmed = window.confirm(
      isCurrentlyActive
        ? `Tem certeza que deseja inativar o paciente "${patient.name}"?`
        : `Tem certeza que deseja reativar o paciente "${patient.name}"?`
    );

    if (!confirmed) return;

    setChangingStatus(true);
    setError("");

    try {
      const response = await fetch(
        `/api/patients/${patient.id}/${isCurrentlyActive ? "deactivate" : "activate"}`,
        { method: "PATCH" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Erro ao atualizar status do paciente");
      }

      setPatient(data);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setChangingStatus(false);
    }
  }

  const sortedAppointments = useMemo(
    () =>
      appointments
        .slice()
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [appointments]
  );

  const stats = useMemo(() => {
    const totalAppointments = appointments.length;
    const totalPaid = appointments
      .filter((a) => a.paymentStatus === "PAID")
      .reduce((acc, a) => acc + (a.price ?? 0), 0);

    const totalPending = appointments
      .filter((a) => a.paymentStatus === "PENDING")
      .reduce((acc, a) => acc + (a.price ?? 0), 0);

    const lastAppointment = sortedAppointments[0] ?? null;

    return {
      totalAppointments,
      totalPaid,
      totalPending,
      lastAppointment,
    };
  }, [appointments, sortedAppointments]);

  const whatsappLink = useMemo(() => {
    if (!patient?.phone) return null;

    return getWhatsappLink(
      patient.phone,
      buildWhatsappMessage({
        patientName: patient.name,
        procedureName: stats.lastAppointment?.procedureName ?? "Atendimento",
        date: stats.lastAppointment?.date ?? null,
        room: stats.lastAppointment?.room ?? null,
      })
    );
  }, [patient, stats.lastAppointment]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Link
          href="/patients"
          className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
        >
          ← Voltar
        </Link>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Detalhes do paciente</h1>
          <p className="text-gray-500">Resumo completo do relacionamento com o paciente.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {patientId && (
            <Link
              href={`/patients/${patientId}/edit`}
              className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50"
            >
              Editar paciente
            </Link>
          )}

          {whatsappLink && (
            <a
              href={whatsappLink}
              target="_blank"
              rel="noreferrer"
              className="rounded-md bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700"
            >
              WhatsApp
            </a>
          )}

          {patient && (
            <button
              type="button"
              onClick={handleToggleActive}
              disabled={changingStatus}
              className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
            >
              {changingStatus
                ? "Salvando..."
                : patient.isActive === false
                  ? "Reativar paciente"
                  : "Inativar paciente"}
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">Carregando paciente...</div>
      ) : error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : !patient ? (
        <div className="text-sm text-gray-500">Paciente não encontrado.</div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Consultas</p>
              <h2 className="mt-2 text-3xl font-bold">{stats.totalAppointments}</h2>
            </div>

            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Total pago</p>
              <h2 className="mt-2 text-2xl font-bold">{formatCurrency(stats.totalPaid)}</h2>
            </div>

            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Total pendente</p>
              <h2 className="mt-2 text-2xl font-bold">{formatCurrency(stats.totalPending)}</h2>
            </div>

            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Status</p>
              <h2 className="mt-2 text-xl font-bold">
                {patient.isActive === false ? "Inativo" : "Ativo"}
              </h2>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Informações do paciente</h2>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <div className="text-xs uppercase tracking-wide text-gray-400">Nome</div>
                <div className="mt-1 text-sm font-medium">{patient.name}</div>
              </div>

              <div>
                <div className="text-xs uppercase tracking-wide text-gray-400">E-mail</div>
                <div className="mt-1 text-sm">{patient.email || "Sem e-mail"}</div>
              </div>

              <div>
                <div className="text-xs uppercase tracking-wide text-gray-400">Telefone</div>
                <div className="mt-1 text-sm">{patient.phone || "Sem telefone"}</div>
              </div>

              <div>
                <div className="text-xs uppercase tracking-wide text-gray-400">Nascimento</div>
                <div className="mt-1 text-sm">{formatDate(patient.birthDate)}</div>
              </div>
            </div>

            {patient.notes && (
              <div className="mt-5 rounded-lg bg-gray-50 p-4">
                <div className="text-xs uppercase tracking-wide text-gray-400">Observações</div>
                <div className="mt-2 text-sm text-gray-700">{patient.notes}</div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border bg-white shadow-sm">
            <div className="border-b bg-gray-50 p-4">
              <h2 className="font-medium">Histórico de consultas</h2>
            </div>

            {sortedAppointments.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">Nenhuma consulta encontrada.</div>
            ) : (
              <div className="divide-y">
                {sortedAppointments.map((appointment) => (
                  <div key={appointment.id} className="p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="text-sm font-medium">
                          {formatDateTime(appointment.date)}
                        </div>

                        <div className="mt-1 text-sm text-gray-600">
                          {appointment.procedureName || "Procedimento não informado"}
                        </div>

                        {appointment.notes && (
                          <div className="mt-1 text-xs text-gray-500">{appointment.notes}</div>
                        )}

                        <div className="mt-2 flex flex-wrap gap-2">
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusBadgeClasses(
                              appointment.status
                            )}`}
                          >
                            {appointment.status}
                          </span>

                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${paymentBadgeClasses(
                              appointment.paymentStatus ?? "PENDING"
                            )}`}
                          >
                            {appointment.paymentStatus ?? "PENDING"}
                          </span>

                          {appointment.room && (
                            <span className="text-xs text-gray-600">Sala {appointment.room}</span>
                          )}

                          <span className="text-xs text-gray-600">
                            {appointment.durationMinutes ?? 30} min
                          </span>
                        </div>
                      </div>

                      <div className="text-right text-sm font-medium text-gray-700">
                        {formatCurrency(appointment.price ?? 0)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}