"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Patient = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  birthDate?: string | null;
  notes?: string | null;
  isActive?: boolean;
  createdAt?: string;
};

type AppointmentStatus = "SCHEDULED" | "COMPLETED" | "CANCELED";
type PaymentStatus = "PENDING" | "PAID" | "CANCELED";

type Appointment = {
  id: string;
  date: string;
  status: AppointmentStatus;
  patientId: string;
  durationMinutes?: 30 | 60;
  notes?: string | null;
  procedureName?: string | null;
  price?: number | null;
  paymentStatus?: PaymentStatus;
  patient?: Patient;
};

type StatusFilter = "all" | "active" | "inactive";
type SortOption =
  | "name-asc"
  | "name-desc"
  | "paid-desc"
  | "pending-desc"
  | "last-appointment-desc";

type QuickFilter =
  | "all"
  | "financial-pending"
  | "birthday-month"
  | "recent"
  | "no-appointments";

const ITEMS_PER_PAGE = 6;

function formatPrice(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function paymentBadgeClasses(status: PaymentStatus) {
  if (status === "PAID") return "bg-green-100 text-green-800 border-green-200";
  if (status === "CANCELED") return "bg-gray-100 text-gray-700 border-gray-200";
  return "bg-orange-100 text-orange-800 border-orange-200";
}

function formatBirthDate(value?: string | null) {
  if (!value) return "Não informada";
  return new Date(value).toLocaleDateString("pt-BR");
}

function formatCreatedAt(value?: string) {
  if (!value) return "Data não disponível";
  return new Date(value).toLocaleDateString("pt-BR");
}

function isPatientRecent(createdAt?: string) {
  if (!createdAt) return false;
  const created = new Date(createdAt).getTime();
  const now = Date.now();
  const diffDays = (now - created) / (1000 * 60 * 60 * 24);
  return diffDays <= 30;
}

function patientTagClasses(type: "inactive" | "pending" | "birthday" | "recent" | "noAppointments") {
  if (type === "inactive") return "border-gray-200 bg-gray-100 text-gray-700";
  if (type === "pending") return "border-orange-200 bg-orange-100 text-orange-800";
  if (type === "birthday") return "border-pink-200 bg-pink-100 text-pink-800";
  if (type === "recent") return "border-blue-200 bg-blue-100 text-blue-800";
  return "border-purple-200 bg-purple-100 text-purple-800";
}

function daysSince(date?: string | null) {
  if (!date) return null;
  const diff = Date.now() - new Date(date).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("last-appointment-desc");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function showMsg(type: "success" | "error", text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  }

  async function loadData() {
    setLoading(true);
    try {
      const includeInactive = statusFilter !== "active";

      const [patientsRes, appointmentsRes] = await Promise.all([
        fetch(`/api/patients?includeInactive=${includeInactive}`, { cache: "no-store" }),
        fetch("/api/appointments", { cache: "no-store" }),
      ]);

      const patientsData = await patientsRes.json();
      const appointmentsData = await appointmentsRes.json();

      if (!patientsRes.ok) {
        showMsg("error", patientsData?.error ?? "Erro ao carregar pacientes.");
        return;
      }

      if (!appointmentsRes.ok) {
        showMsg("error", appointmentsData?.error ?? "Erro ao carregar consultas.");
        return;
      }

      setPatients(Array.isArray(patientsData) ? patientsData : []);
      setAppointments(Array.isArray(appointmentsData) ? appointmentsData : []);
    } catch {
      showMsg("error", "Erro ao carregar CRM de pacientes.");
    } finally {
      setLoading(false);
    }
  }

  async function handleTogglePatientStatus(patient: Patient) {
    const isCurrentlyActive = patient.isActive !== false;

    const confirmed = window.confirm(
      isCurrentlyActive
        ? `Tem certeza que deseja inativar o paciente "${patient.name}"?`
        : `Tem certeza que deseja reativar o paciente "${patient.name}"?`
    );

    if (!confirmed) return;

    setActionLoadingId(patient.id);

    try {
      const response = await fetch(
        `/api/patients/${patient.id}/${isCurrentlyActive ? "deactivate" : "activate"}`,
        { method: "PATCH" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Erro ao atualizar status do paciente");
      }

      setPatients((prev) =>
        prev.map((p) => (p.id === patient.id ? { ...p, isActive: data.isActive } : p))
      );

      showMsg(
        "success",
        isCurrentlyActive
          ? "Paciente inativado com sucesso."
          : "Paciente reativado com sucesso."
      );

      if (statusFilter === "active" && isCurrentlyActive) {
        setPatients((prev) => prev.filter((p) => p.id !== patient.id));
      }

      if (statusFilter === "inactive" && !isCurrentlyActive) {
        setPatients((prev) => prev.filter((p) => p.id !== patient.id));
      }
    } catch (err) {
      showMsg("error", err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setActionLoadingId(null);
    }
  }

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, quickFilter, sortBy]);

  const dashboardMetrics = useMemo(() => {
    const totalPatients = patients.length;
    const activePatients = patients.filter((p) => p.isActive !== false).length;
    const inactivePatients = patients.filter((p) => p.isActive === false).length;

    const totalRevenue = appointments
      .filter((a) => a.paymentStatus === "PAID")
      .reduce((acc, a) => acc + (a.price ?? 0), 0);

    const totalPending = appointments
      .filter((a) => a.paymentStatus === "PENDING")
      .reduce((acc, a) => acc + (a.price ?? 0), 0);

    return {
      totalPatients,
      activePatients,
      inactivePatients,
      totalRevenue,
      totalPending,
    };
  }, [patients, appointments]);

  const recentPatients = useMemo(() => {
    return patients
      .filter((p) => p.createdAt)
      .slice()
      .sort(
        (a, b) =>
          new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
      )
      .slice(0, 5);
  }, [patients]);

  const birthdayPatients = useMemo(() => {
    const currentMonth = new Date().getMonth();

    return patients
      .filter((p) => p.birthDate && new Date(p.birthDate).getMonth() === currentMonth)
      .slice()
      .sort((a, b) => {
        const dayA = new Date(a.birthDate ?? "").getDate();
        const dayB = new Date(b.birthDate ?? "").getDate();
        return dayA - dayB;
      })
      .slice(0, 5);
  }, [patients]);

  const patientAnalytics = useMemo(() => {
    return patients.map((patient) => {
      const patientAppointments = appointments
        .filter((a) => a.patientId === patient.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const totalAppointments = patientAppointments.length;
      const totalPaid = patientAppointments
        .filter((a) => a.paymentStatus === "PAID")
        .reduce((acc, a) => acc + (a.price ?? 0), 0);

      const totalPending = patientAppointments
        .filter((a) => a.paymentStatus === "PENDING")
        .reduce((acc, a) => acc + (a.price ?? 0), 0);

      const lastAppointment = patientAppointments[0] ?? null;
      const daysWithoutReturn = daysSince(lastAppointment?.date);

      return {
        patient,
        totalAppointments,
        totalPaid,
        totalPending,
        lastAppointment,
        daysWithoutReturn,
      };
    });
  }, [patients, appointments]);

  const topPayers = useMemo(
    () =>
      patientAnalytics
        .filter((item) => item.totalPaid > 0)
        .slice()
        .sort((a, b) => b.totalPaid - a.totalPaid)
        .slice(0, 5),
    [patientAnalytics]
  );

  const topPending = useMemo(
    () =>
      patientAnalytics
        .filter((item) => item.totalPending > 0)
        .slice()
        .sort((a, b) => b.totalPending - a.totalPending)
        .slice(0, 5),
    [patientAnalytics]
  );

  const mostFrequent = useMemo(
    () =>
      patientAnalytics
        .filter((item) => item.totalAppointments > 0)
        .slice()
        .sort((a, b) => b.totalAppointments - a.totalAppointments)
        .slice(0, 5),
    [patientAnalytics]
  );

  const withoutRecentReturn = useMemo(
    () =>
      patientAnalytics
        .filter((item) => item.daysWithoutReturn !== null && (item.daysWithoutReturn ?? 0) >= 60)
        .slice()
        .sort((a, b) => (b.daysWithoutReturn ?? 0) - (a.daysWithoutReturn ?? 0))
        .slice(0, 5),
    [patientAnalytics]
  );

  const filteredPatients = useMemo(() => {
    const term = search.trim().toLowerCase();
    const currentMonth = new Date().getMonth();

    const mapped = patients
      .filter((p) => {
        if (statusFilter === "active" && p.isActive === false) return false;
        if (statusFilter === "inactive" && p.isActive !== false) return false;

        if (!term) return true;

        return (
          p.name.toLowerCase().includes(term) ||
          (p.email ?? "").toLowerCase().includes(term) ||
          (p.phone ?? "").toLowerCase().includes(term)
        );
      })
      .map((patient) => {
        const patientAppointments = appointments
          .filter((a) => a.patientId === patient.id)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const totalAppointments = patientAppointments.length;
        const completed = patientAppointments.filter((a) => a.status === "COMPLETED").length;
        const scheduled = patientAppointments.filter((a) => a.status === "SCHEDULED").length;
        const canceled = patientAppointments.filter((a) => a.status === "CANCELED").length;

        const paidCount = patientAppointments.filter((a) => a.paymentStatus === "PAID").length;
        const pendingCount = patientAppointments.filter((a) => a.paymentStatus === "PENDING").length;

        const totalPaid = patientAppointments
          .filter((a) => a.paymentStatus === "PAID")
          .reduce((acc, a) => acc + (a.price ?? 0), 0);

        const totalPending = patientAppointments
          .filter((a) => a.paymentStatus === "PENDING")
          .reduce((acc, a) => acc + (a.price ?? 0), 0);

        const lastAppointment = patientAppointments[0] ?? null;
        const lastAppointmentTime = lastAppointment
          ? new Date(lastAppointment.date).getTime()
          : 0;

        const hasBirthdayThisMonth =
          !!patient.birthDate && new Date(patient.birthDate).getMonth() === currentMonth;

        const isRecent = isPatientRecent(patient.createdAt);
        const hasNoAppointments = totalAppointments === 0;
        const hasFinancialPending = totalPending > 0;

        return {
          patient,
          totalAppointments,
          completed,
          scheduled,
          canceled,
          paidCount,
          pendingCount,
          totalPaid,
          totalPending,
          lastAppointment,
          lastAppointmentTime,
          hasBirthdayThisMonth,
          isRecent,
          hasNoAppointments,
          hasFinancialPending,
        };
      })
      .filter((item) => {
        switch (quickFilter) {
          case "financial-pending":
            return item.hasFinancialPending;
          case "birthday-month":
            return item.hasBirthdayThisMonth;
          case "recent":
            return item.isRecent;
          case "no-appointments":
            return item.hasNoAppointments;
          default:
            return true;
        }
      });

    mapped.sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return a.patient.name.localeCompare(b.patient.name, "pt-BR");
        case "name-desc":
          return b.patient.name.localeCompare(a.patient.name, "pt-BR");
        case "paid-desc":
          return b.totalPaid - a.totalPaid;
        case "pending-desc":
          return b.totalPending - a.totalPending;
        default:
          return b.lastAppointmentTime - a.lastAppointmentTime;
      }
    });

    return mapped;
  }, [patients, appointments, search, statusFilter, quickFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredPatients.length / ITEMS_PER_PAGE));

  const paginatedPatients = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredPatients.slice(start, end);
  }, [filteredPatients, page]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">CRM Pacientes</h1>
          <p className="mt-1 text-sm text-gray-600">
            Histórico, pagamentos e relacionamento com pacientes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/patients/new"
            className="rounded-md bg-black px-4 py-2 text-white hover:opacity-90"
          >
            Novo paciente
          </Link>

          <button
            onClick={loadData}
            className="rounded-md border px-3 py-2 hover:bg-gray-50"
            disabled={loading}
            type="button"
          >
            {loading ? "Atualizando..." : "Recarregar"}
          </button>
        </div>
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

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total de pacientes</p>
          <h2 className="mt-2 text-3xl font-bold">{dashboardMetrics.totalPatients}</h2>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Ativos</p>
          <h2 className="mt-2 text-3xl font-bold">{dashboardMetrics.activePatients}</h2>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Inativos</p>
          <h2 className="mt-2 text-3xl font-bold">{dashboardMetrics.inactivePatients}</h2>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Receita recebida</p>
          <h2 className="mt-2 text-2xl font-bold">{formatPrice(dashboardMetrics.totalRevenue)}</h2>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total pendente</p>
          <h2 className="mt-2 text-2xl font-bold">{formatPrice(dashboardMetrics.totalPending)}</h2>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <div className="border-b bg-gray-50 p-4">
            <h2 className="font-medium">Pacientes recentes</h2>
          </div>
          {recentPatients.length === 0 ? (
            <div className="p-4 text-sm text-gray-500">Nenhum paciente recente encontrado.</div>
          ) : (
            <div className="divide-y">
              {recentPatients.map((patient) => (
                <div key={patient.id} className="flex items-center justify-between p-4">
                  <div>
                    <div className="font-medium">{patient.name}</div>
                    <div className="text-sm text-gray-500">
                      Cadastrado em {formatCreatedAt(patient.createdAt)}
                    </div>
                  </div>
                  <Link href={`/patients/${patient.id}`} className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50">
                    Ver
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <div className="border-b bg-gray-50 p-4">
            <h2 className="font-medium">Aniversariantes do mês</h2>
          </div>
          {birthdayPatients.length === 0 ? (
            <div className="p-4 text-sm text-gray-500">Nenhum aniversariante neste mês.</div>
          ) : (
            <div className="divide-y">
              {birthdayPatients.map((patient) => (
                <div key={patient.id} className="flex items-center justify-between p-4">
                  <div>
                    <div className="font-medium">{patient.name}</div>
                    <div className="text-sm text-gray-500">
                      Aniversário em {formatBirthDate(patient.birthDate)}
                    </div>
                  </div>
                  <Link href={`/patients/${patient.id}`} className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50">
                    Ver
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <div className="border-b bg-gray-50 p-4">
            <h2 className="font-medium">Maiores pagadores</h2>
          </div>
          {topPayers.length === 0 ? (
            <div className="p-4 text-sm text-gray-500">Sem dados de pagamento.</div>
          ) : (
            <div className="divide-y">
              {topPayers.map((item) => (
                <div key={item.patient.id} className="flex items-center justify-between p-4">
                  <div>
                    <div className="font-medium">{item.patient.name}</div>
                    <div className="text-sm text-gray-500">
                      {item.totalAppointments} consulta(s)
                    </div>
                  </div>
                  <div className="font-semibold">{formatPrice(item.totalPaid)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <div className="border-b bg-gray-50 p-4">
            <h2 className="font-medium">Maiores pendências</h2>
          </div>
          {topPending.length === 0 ? (
            <div className="p-4 text-sm text-gray-500">Sem pendências financeiras.</div>
          ) : (
            <div className="divide-y">
              {topPending.map((item) => (
                <div key={item.patient.id} className="flex items-center justify-between p-4">
                  <div>
                    <div className="font-medium">{item.patient.name}</div>
                    <div className="text-sm text-gray-500">
                      {item.totalAppointments} consulta(s)
                    </div>
                  </div>
                  <div className="font-semibold">{formatPrice(item.totalPending)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <div className="border-b bg-gray-50 p-4">
            <h2 className="font-medium">Pacientes mais frequentes</h2>
          </div>
          {mostFrequent.length === 0 ? (
            <div className="p-4 text-sm text-gray-500">Sem histórico suficiente.</div>
          ) : (
            <div className="divide-y">
              {mostFrequent.map((item) => (
                <div key={item.patient.id} className="flex items-center justify-between p-4">
                  <div>
                    <div className="font-medium">{item.patient.name}</div>
                    <div className="text-sm text-gray-500">
                      Última consulta:{" "}
                      {item.lastAppointment
                        ? new Date(item.lastAppointment.date).toLocaleDateString("pt-BR")
                        : "—"}
                    </div>
                  </div>
                  <div className="font-semibold">{item.totalAppointments}x</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <div className="border-b bg-gray-50 p-4">
            <h2 className="font-medium">Sem retorno recente</h2>
          </div>
          {withoutRecentReturn.length === 0 ? (
            <div className="p-4 text-sm text-gray-500">Nenhum paciente sem retorno recente.</div>
          ) : (
            <div className="divide-y">
              {withoutRecentReturn.map((item) => (
                <div key={item.patient.id} className="flex items-center justify-between p-4">
                  <div>
                    <div className="font-medium">{item.patient.name}</div>
                    <div className="text-sm text-gray-500">
                      Última consulta:{" "}
                      {item.lastAppointment
                        ? new Date(item.lastAppointment.date).toLocaleDateString("pt-BR")
                        : "—"}
                    </div>
                  </div>
                  <div className="font-semibold">{item.daysWithoutReturn} dias</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-lg border bg-white p-4">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="md:col-span-1">
            <label className="text-xs text-gray-600">Buscar paciente</label>
            <input
              type="text"
              className="mt-1 w-full rounded-md border p-2"
              placeholder="Digite nome, e-mail ou telefone"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs text-gray-600">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="mt-1 w-full rounded-md border p-2"
            >
              <option value="all">Todos</option>
              <option value="active">Somente ativos</option>
              <option value="inactive">Somente inativos</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-600">Filtro rápido</label>
            <select
              value={quickFilter}
              onChange={(e) => setQuickFilter(e.target.value as QuickFilter)}
              className="mt-1 w-full rounded-md border p-2"
            >
              <option value="all">Todos</option>
              <option value="financial-pending">Com pendência financeira</option>
              <option value="birthday-month">Aniversariantes do mês</option>
              <option value="recent">Recentes</option>
              <option value="no-appointments">Sem consultas</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-600">Ordenar por</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="mt-1 w-full rounded-md border p-2"
            >
              <option value="last-appointment-desc">Última consulta</option>
              <option value="name-asc">Nome (A-Z)</option>
              <option value="name-desc">Nome (Z-A)</option>
              <option value="paid-desc">Maior total pago</option>
              <option value="pending-desc">Maior total pendente</option>
            </select>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-500">
        <span>
          {loading ? "Carregando..." : `${filteredPatients.length} paciente(s) encontrado(s)`}
        </span>

        {!loading && filteredPatients.length > 0 && (
          <span>
            Página {page} de {totalPages}
          </span>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
        {loading ? (
          <div className="text-sm text-gray-600">Carregando pacientes...</div>
        ) : paginatedPatients.length === 0 ? (
          <div className="text-sm text-gray-600">Nenhum paciente encontrado.</div>
        ) : (
          paginatedPatients.map((item) => {
            const isProcessing = actionLoadingId === item.patient.id;
            const isActive = item.patient.isActive !== false;

            return (
              <div
                key={item.patient.id}
                className={[
                  "rounded-xl border bg-white p-5 transition hover:shadow-sm",
                  item.hasFinancialPending ? "border-orange-200" : "",
                  !isActive ? "opacity-90" : "",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-4">
                  <Link href={`/patients/${item.patient.id}`} className="block min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold">{item.patient.name}</h2>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {!isActive && (
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${patientTagClasses("inactive")}`}>
                          Inativo
                        </span>
                      )}

                      {item.hasFinancialPending && (
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${patientTagClasses("pending")}`}>
                          Pendência financeira
                        </span>
                      )}

                      {item.hasBirthdayThisMonth && (
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${patientTagClasses("birthday")}`}>
                          Aniversário no mês
                        </span>
                      )}

                      {item.isRecent && (
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${patientTagClasses("recent")}`}>
                          Recente
                        </span>
                      )}

                      {item.hasNoAppointments && (
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${patientTagClasses("noAppointments")}`}>
                          Sem consultas
                        </span>
                      )}
                    </div>

                    <p className="mt-3 text-sm text-gray-600">{item.patient.email || "Sem e-mail"}</p>
                    <p className="text-sm text-gray-500">{item.patient.phone || "Sem telefone"}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      Nascimento: {formatBirthDate(item.patient.birthDate)}
                    </p>
                  </Link>

                  <div className="flex flex-col items-end gap-2">
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Total pago</div>
                      <div className="font-semibold">{formatPrice(item.totalPaid)}</div>
                    </div>

                    <Link
                      href={`/patients/${item.patient.id}/edit`}
                      className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
                    >
                      Editar
                    </Link>
                  </div>
                </div>

                {item.patient.notes && (
                  <div className="mt-4 rounded-lg bg-gray-50 p-3">
                    <div className="text-xs font-medium text-gray-500">Observações</div>
                    <div className="mt-1 line-clamp-2 text-sm text-gray-700">
                      {item.patient.notes}
                    </div>
                  </div>
                )}

                <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                  <div className="rounded-lg border p-3">
                    <div className="text-xs text-gray-500">Consultas</div>
                    <div className="text-lg font-semibold">{item.totalAppointments}</div>
                  </div>

                  <div className="rounded-lg border p-3">
                    <div className="text-xs text-gray-500">Concluídas</div>
                    <div className="text-lg font-semibold">{item.completed}</div>
                  </div>

                  <div className="rounded-lg border p-3">
                    <div className="text-xs text-gray-500">Agendadas</div>
                    <div className="text-lg font-semibold">{item.scheduled}</div>
                  </div>

                  <div className="rounded-lg border p-3">
                    <div className="text-xs text-gray-500">Canceladas</div>
                    <div className="text-lg font-semibold">{item.canceled}</div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="text-sm text-gray-600">
                    Pendências: <span className="font-medium">{formatPrice(item.totalPending)}</span>
                  </span>

                  {item.pendingCount > 0 && (
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${paymentBadgeClasses("PENDING")}`}>
                      {item.pendingCount} pendente(s)
                    </span>
                  )}

                  {item.paidCount > 0 && (
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${paymentBadgeClasses("PAID")}`}>
                      {item.paidCount} pago(s)
                    </span>
                  )}
                </div>

                <div className="mt-4 border-t pt-3">
                  <div className="text-xs text-gray-500">Última consulta</div>

                  {item.lastAppointment ? (
                    <>
                      <div className="mt-1 text-sm font-medium">
                        {new Date(item.lastAppointment.date).toLocaleString("pt-BR")}
                      </div>

                      <div className="text-sm text-gray-600">
                        {item.lastAppointment.procedureName || "Procedimento não informado"}
                      </div>

                      <div className="mt-1 flex flex-wrap gap-2">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${paymentBadgeClasses(item.lastAppointment.paymentStatus ?? "PENDING")}`}>
                          {item.lastAppointment.paymentStatus ?? "PENDING"}
                        </span>

                        {item.lastAppointment.price !== null &&
                          item.lastAppointment.price !== undefined && (
                            <span className="text-xs text-gray-600">
                              {formatPrice(item.lastAppointment.price)}
                            </span>
                          )}
                      </div>
                    </>
                  ) : (
                    <div className="mt-1 text-sm text-gray-500">Sem histórico ainda</div>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Link
                    href={`/patients/${item.patient.id}`}
                    className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    Ver detalhes
                  </Link>

                  <Link
                    href={`/patients/${item.patient.id}/edit`}
                    className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    Editar paciente
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleTogglePatientStatus(item.patient)}
                    disabled={isProcessing}
                    className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isProcessing ? "Salvando..." : isActive ? "Inativar" : "Reativar"}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {!loading && totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page === 1}
            className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Anterior
          </button>

          <span className="text-sm text-gray-600">
            Página {page} de {totalPages}
          </span>

          <button
            type="button"
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={page === totalPages}
            className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
}