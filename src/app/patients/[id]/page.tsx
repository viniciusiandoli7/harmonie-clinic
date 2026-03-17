"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Patient = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  birthDate?: string | null;
  notes?: string | null;
  isActive?: boolean;
};

type AppointmentStatus = "SCHEDULED" | "COMPLETED" | "CANCELED";
type PaymentStatus = "PENDING" | "PAID" | "CANCELED";

type Appointment = {
  id: string;
  date: string;
  status: AppointmentStatus;
  patientId: string;
  patient?: Patient;
  durationMinutes?: 30 | 60;
  notes?: string | null;
  procedureName?: string | null;
  price?: number | null;
  paymentStatus?: PaymentStatus;
};

function formatPrice(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatBirthDate(value?: string | null) {
  if (!value) return "Não informada";
  return new Date(value).toLocaleDateString("pt-BR");
}

function statusBadgeClasses(status: AppointmentStatus) {
  if (status === "COMPLETED") return "bg-green-100 text-green-800 border-green-200";
  if (status === "CANCELED") return "bg-gray-100 text-gray-700 border-gray-200";
  return "bg-yellow-100 text-yellow-800 border-yellow-200";
}

function paymentBadgeClasses(status: PaymentStatus) {
  if (status === "PAID") return "bg-green-100 text-green-800 border-green-200";
  if (status === "CANCELED") return "bg-gray-100 text-gray-700 border-gray-200";
  return "bg-orange-100 text-orange-800 border-orange-200";
}

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function PatientDetailsPage({ params }: PageProps) {
  const router = useRouter();

  const [patientId, setPatientId] = useState("");
  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [changingStatus, setChangingStatus] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function showMsg(type: "success" | "error", text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  }

  useEffect(() => {
    async function resolveParams() {
      const p = await params;
      setPatientId(p.id);
    }
    resolveParams();
  }, [params]);

  async function loadData(id: string) {
    setLoading(true);
    try {
      const [patientRes, appointmentsRes] = await Promise.all([
        fetch(`/api/patients/${id}`, { cache: "no-store" }),
        fetch(`/api/appointments?patientId=${id}`, { cache: "no-store" }),
      ]);

      const patientData = await patientRes.json();
      const appointmentsData = await appointmentsRes.json();

      if (!patientRes.ok) {
        showMsg("error", patientData?.error ?? "Erro ao carregar paciente.");
        return;
      }

      if (!appointmentsRes.ok) {
        showMsg("error", appointmentsData?.error ?? "Erro ao carregar consultas.");
        return;
      }

      setPatient(patientData ?? null);
      setAppointments(Array.isArray(appointmentsData) ? appointmentsData : []);
    } catch {
      showMsg("error", "Erro ao carregar CRM do paciente.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (patientId) loadData(patientId);
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

    try {
      const response = await fetch(
        `/api/patients/${patient.id}/${isCurrentlyActive ? "deactivate" : "activate"}`,
        {
          method: "PATCH",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Erro ao atualizar status do paciente");
      }

      setPatient(data);
      showMsg(
        "success",
        isCurrentlyActive
          ? "Paciente inativado com sucesso."
          : "Paciente reativado com sucesso."
      );

      router.refresh();
    } catch (err) {
      showMsg("error", err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setChangingStatus(false);
    }
  }

  const summary = useMemo(() => {
    const totalAppointments = appointments.length;
    const scheduled = appointments.filter((a) => a.status === "SCHEDULED").length;
    const completed = appointments.filter((a) => a.status === "COMPLETED").length;
    const canceled = appointments.filter((a) => a.status === "CANCELED").length;

    const paidCount = appointments.filter((a) => a.paymentStatus === "PAID").length;
    const pendingCount = appointments.filter((a) => a.paymentStatus === "PENDING").length;

    const totalPaid = appointments
      .filter((a) => a.paymentStatus === "PAID")
      .reduce((acc, a) => acc + (a.price ?? 0), 0);

    const totalPending = appointments
      .filter((a) => a.paymentStatus === "PENDING")
      .reduce((acc, a) => acc + (a.price ?? 0), 0);

    const procedures = Object.entries(
      appointments.reduce<Record<string, number>>((acc, a) => {
        const key = a.procedureName?.trim();
        if (!key) return acc;
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      }, {})
    ).sort((a, b) => b[1] - a[1]);

    return {
      totalAppointments,
      scheduled,
      completed,
      canceled,
      paidCount,
      pendingCount,
      totalPaid,
      totalPending,
      procedures,
    };
  }, [appointments]);

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/patients"
          className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
        >
          ← Voltar
        </Link>

        <button
          type="button"
          onClick={() => patientId && loadData(patientId)}
          className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
          disabled={loading}
        >
          {loading ? "Atualizando..." : "Recarregar"}
        </button>

        {patientId && (
          <Link
            href={`/patients/${patientId}/edit`}
            className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
          >
            Editar paciente
          </Link>
        )}

        {patient && (
          <button
            type="button"
            onClick={handleToggleActive}
            disabled={changingStatus}
            className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {changingStatus
              ? "Salvando..."
              : patient.isActive === false
              ? "Reativar paciente"
              : "Inativar paciente"}
          </button>
        )}
      </div>

      {message && (
        <div
          className={[
            "mt-4 rounded-md border p-3",
            message.type === "success" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50",
          ].join(" ")}
        >
          <p className="text-sm">{message.text}</p>
        </div>
      )}

      {loading ? (
        <div className="mt-6 text-sm text-gray-500">Carregando...</div>
      ) : !patient ? (
        <div className="mt-6 text-sm text-gray-500">Paciente não encontrado.</div>
      ) : (
        <>
          <div className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-semibold">{patient.name}</h1>

                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                      patient.isActive === false
                        ? "border-gray-200 bg-gray-100 text-gray-700"
                        : "border-green-200 bg-green-100 text-green-800"
                    }`}
                  >
                    {patient.isActive === false ? "Inativo" : "Ativo"}
                  </span>
                </div>

                <p className="mt-1 text-gray-600">{patient.email || "Sem e-mail"}</p>
                <p className="text-gray-500">{patient.phone || "Sem telefone"}</p>
                <p className="mt-1 text-sm text-gray-500">
                  Nascimento: {formatBirthDate(patient.birthDate)}
                </p>
              </div>

              <Link
                href={`/patients/${patient.id}/edit`}
                className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50"
              >
                Editar cadastro
              </Link>
            </div>

            <div className="mt-5">
              <h2 className="mb-2 text-sm font-medium text-gray-500">Observações</h2>
              <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-700">
                {patient.notes || "Nenhuma observação cadastrada."}
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Consultas</p>
              <h2 className="mt-2 text-3xl font-bold">{summary.totalAppointments}</h2>
            </div>

            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Concluídas</p>
              <h2 className="mt-2 text-3xl font-bold">{summary.completed}</h2>
            </div>

            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Total pago</p>
              <h2 className="mt-2 text-3xl font-bold">{formatPrice(summary.totalPaid)}</h2>
            </div>

            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Total pendente</p>
              <h2 className="mt-2 text-3xl font-bold">{formatPrice(summary.totalPending)}</h2>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Agendadas</p>
              <h2 className="mt-2 text-2xl font-bold">{summary.scheduled}</h2>
            </div>

            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Pagas</p>
              <h2 className="mt-2 text-2xl font-bold">{summary.paidCount}</h2>
            </div>

            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Pendentes</p>
              <h2 className="mt-2 text-2xl font-bold">{summary.pendingCount}</h2>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="xl:col-span-2 overflow-hidden rounded-2xl border bg-white shadow-sm">
              <div className="border-b bg-gray-50 p-4">
                <h2 className="font-medium">Histórico de consultas</h2>
              </div>

              {appointments.length === 0 ? (
                <div className="p-4 text-sm text-gray-500">Sem histórico ainda.</div>
              ) : (
                <div className="divide-y">
                  {appointments
                    .slice()
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((a) => (
                      <div key={a.id} className="p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusBadgeClasses(
                              a.status
                            )}`}
                          >
                            {a.status}
                          </span>

                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${paymentBadgeClasses(
                              a.paymentStatus ?? "PENDING"
                            )}`}
                          >
                            {a.paymentStatus ?? "PENDING"}
                          </span>

                          <span className="text-sm text-gray-600">
                            {new Date(a.date).toLocaleString("pt-BR")}
                          </span>
                        </div>

                        <div className="mt-2 font-medium">
                          {a.procedureName || "Procedimento não informado"}
                        </div>

                        <div className="text-sm text-gray-600">
                          {a.durationMinutes ?? 30}min
                          {a.price !== null && a.price !== undefined ? ` • ${formatPrice(a.price)}` : ""}
                        </div>

                        {a.notes && (
                          <div className="mt-2 text-sm text-gray-500">{a.notes}</div>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
              <div className="border-b bg-gray-50 p-4">
                <h2 className="font-medium">Procedimentos realizados</h2>
              </div>

              {summary.procedures.length === 0 ? (
                <div className="p-4 text-sm text-gray-500">Nenhum procedimento registrado.</div>
              ) : (
                <div className="divide-y">
                  {summary.procedures.map(([name, count]) => (
                    <div key={name} className="flex items-center justify-between p-4">
                      <div className="font-medium">{name}</div>
                      <div className="text-sm text-gray-500">{count} vez(es)</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}