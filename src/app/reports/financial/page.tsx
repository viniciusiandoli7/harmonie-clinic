"use client";

import { useEffect, useMemo, useState } from "react";
import MonthlyKpis from "@/components/dashboard/MonthlyKpis";
import DashboardCharts from "@/components/dashboard/DashboardCharts";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardPeriodFilter, {
  type DashboardPeriod,
} from "@/components/dashboard/DashboardPeriodFilter";
import KpiCards from "@/components/dashboard/KpiCards";
import DashboardFinancialCards from "@/components/dashboard/DashboardFinancialCards";
import DashboardFinancialCharts from "@/components/dashboard/DashboardFinancialCharts";

type Patient = {
  id: string;
  name: string;
  email: string;
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

type BlockedTime = {
  id: string;
  start: string;
  end: string;
  reason?: string | null;
};

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function startOfWeek(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d;
}

function endOfWeek(date: Date) {
  const d = startOfWeek(date);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function isBetween(date: Date, start: Date, end: Date) {
  return date >= start && date <= end;
}

function fmtDateTime(date: string) {
  return new Date(date).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function fmtMinutes(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;

  if (h > 0 && m > 0) return `${h}h ${m}min`;
  if (h > 0) return `${h}h`;
  return `${m}min`;
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

function blockedDurationInMinutes(start: string, end: string) {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  return Math.max(0, Math.round((e - s) / 60000));
}

export default function DashboardPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [period, setPeriod] = useState<DashboardPeriod>("month");

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const now = new Date();
      const monthStart = startOfMonth(now).toISOString();
      const monthEnd = endOfMonth(now).toISOString();

      const [apptRes, blockedRes] = await Promise.all([
        fetch("/api/appointments", { cache: "no-store" }),
        fetch(
          `/api/blocked-times?dateFrom=${encodeURIComponent(monthStart)}&dateTo=${encodeURIComponent(monthEnd)}`,
          { cache: "no-store" }
        ),
      ]);

      const apptData = await apptRes.json();
      const blockedData = await blockedRes.json();

      if (!apptRes.ok) {
        setError(apptData?.error ?? "Erro ao carregar dashboard.");
        return;
      }

      if (!blockedRes.ok) {
        setError(blockedData?.error ?? "Erro ao carregar bloqueios.");
        return;
      }

      setAppointments(Array.isArray(apptData) ? apptData : []);
      setBlockedTimes(Array.isArray(blockedData) ? blockedData : []);
    } catch {
      setError("Erro ao carregar dashboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const dashboard = useMemo(() => {
    const now = new Date();

    const ranges = {
      today: {
        start: startOfDay(now),
        end: endOfDay(now),
      },
      week: {
        start: startOfWeek(now),
        end: endOfWeek(now),
      },
      month: {
        start: startOfMonth(now),
        end: endOfMonth(now),
      },
    };

    const selectedRange = ranges[period];

    const filteredAppointments = appointments.filter((a) =>
      isBetween(new Date(a.date), selectedRange.start, selectedRange.end)
    );

    const filteredBlockedTimes = blockedTimes.filter((b) =>
      isBetween(new Date(b.start), selectedRange.start, selectedRange.end)
    );

    const scheduled = filteredAppointments.filter((a) => a.status === "SCHEDULED").length;
    const completed = filteredAppointments.filter((a) => a.status === "COMPLETED").length;
    const canceled = filteredAppointments.filter((a) => a.status === "CANCELED").length;

    const paidAppointments = filteredAppointments.filter((a) => a.paymentStatus === "PAID");
    const pendingAppointments = filteredAppointments.filter((a) => a.paymentStatus === "PENDING");

    const totalRevenue = paidAppointments.reduce((acc, a) => acc + (a.price ?? 0), 0);
    const totalPending = pendingAppointments.reduce((acc, a) => acc + (a.price ?? 0), 0);

    const blockedMinutes = filteredBlockedTimes.reduce(
      (acc, b) => acc + blockedDurationInMinutes(b.start, b.end),
      0
    );

    const nextAppointments = appointments
      .filter((a) => new Date(a.date) >= now && a.status !== "CANCELED")
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5);

    const recentBlockedTimes = blockedTimes
      .slice()
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
      .slice(0, 5);

    const topProcedures = Object.entries(
      filteredAppointments.reduce<Record<string, number>>((acc, a) => {
        const key = a.procedureName?.trim();
        if (!key) return acc;
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      }, {})
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const uniquePatients = new Set(
      filteredAppointments.map((a) => a.patientId).filter(Boolean)
    ).size;

    return {
      filteredAppointments,
      scheduled,
      completed,
      canceled,
      paidCount: paidAppointments.length,
      pendingCount: pendingAppointments.length,
      totalRevenue,
      totalPending,
      blockedMinutes,
      nextAppointments,
      recentBlockedTimes,
      topProcedures,
      uniquePatients,
    };
  }, [appointments, blockedTimes, period]);

  return (
    <div className="bg-[#FAF8F3] p-8 md:p-10">
      <DashboardHeader loading={loading} onRefresh={loadDashboard} />

      <DashboardPeriodFilter value={period} onChange={setPeriod} />

      {error && (
        <div className="mt-4 border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-6">
        <MonthlyKpis />
      </div>

      <KpiCards
        totalRevenue={dashboard.totalRevenue}
        totalAppointments={dashboard.filteredAppointments.length}
        totalPatients={dashboard.uniquePatients}
        totalPending={dashboard.totalPending}
      />

      <DashboardFinancialCards />

      <DashboardCharts appointments={appointments} />

      <DashboardFinancialCharts />

      <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-4">
        <div className="border border-[#ECE7DD] bg-white p-6 shadow-sm">
          <p className="text-[13px] font-semibold uppercase tracking-[0.2em] text-[#8E9AAF]">
            Agendadas
          </p>
          <h2 className="mt-3 text-4xl font-light text-[#111827]">{dashboard.scheduled}</h2>
        </div>

        <div className="border border-[#ECE7DD] bg-white p-6 shadow-sm">
          <p className="text-[13px] font-semibold uppercase tracking-[0.2em] text-[#8E9AAF]">
            Concluídas
          </p>
          <h2 className="mt-3 text-4xl font-light text-[#111827]">{dashboard.completed}</h2>
        </div>

        <div className="border border-[#ECE7DD] bg-white p-6 shadow-sm">
          <p className="text-[13px] font-semibold uppercase tracking-[0.2em] text-[#8E9AAF]">
            Canceladas
          </p>
          <h2 className="mt-3 text-4xl font-light text-[#111827]">{dashboard.canceled}</h2>
        </div>

        <div className="border border-[#ECE7DD] bg-white p-6 shadow-sm">
          <p className="text-[13px] font-semibold uppercase tracking-[0.2em] text-[#8E9AAF]">
            Tempo bloqueado
          </p>
          <h2 className="mt-3 text-4xl font-light text-[#111827]">
            {fmtMinutes(dashboard.blockedMinutes)}
          </h2>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="overflow-hidden border border-[#ECE7DD] bg-white shadow-sm">
          <div className="border-b border-[#ECE7DD] bg-[#FCFAF6] p-4">
            <h2 className="text-lg font-medium text-[#111827]">Próximas consultas</h2>
          </div>

          {loading ? (
            <div className="p-4 text-sm text-gray-500">Carregando...</div>
          ) : dashboard.nextAppointments.length === 0 ? (
            <div className="p-4 text-sm text-gray-500">Nenhuma próxima consulta.</div>
          ) : (
            <div className="divide-y divide-[#F3EFE7]">
              {dashboard.nextAppointments.map((a) => (
                <div
                  key={a.id}
                  className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
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
                        {fmtDateTime(a.date)} • {a.durationMinutes ?? 30}min
                      </span>
                    </div>

                    <div className="mt-1 font-medium text-[#111827]">
                      {a.patient?.name ?? "Paciente"}
                    </div>

                    <div className="text-sm text-gray-600">{a.patient?.email ?? ""}</div>

                    {a.procedureName && (
                      <div className="mt-1 text-xs text-gray-700">{a.procedureName}</div>
                    )}

                    {a.notes && <div className="mt-1 text-xs text-gray-500">{a.notes}</div>}
                  </div>

                  <div className="text-right text-sm text-gray-500">
                    {fmtCurrency(a.price ?? 0)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="overflow-hidden border border-[#ECE7DD] bg-white shadow-sm">
          <div className="border-b border-[#ECE7DD] bg-[#FCFAF6] p-4">
            <h2 className="text-lg font-medium text-[#111827]">Bloqueios recentes</h2>
          </div>

          {loading ? (
            <div className="p-4 text-sm text-gray-500">Carregando...</div>
          ) : dashboard.recentBlockedTimes.length === 0 ? (
            <div className="p-4 text-sm text-gray-500">Nenhum bloqueio cadastrado.</div>
          ) : (
            <div className="divide-y divide-[#F3EFE7]">
              {dashboard.recentBlockedTimes.map((b) => (
                <div key={b.id} className="p-4">
                  <div className="font-medium text-[#111827]">🔒 {b.reason || "Bloqueio"}</div>
                  <div className="mt-1 text-sm text-gray-600">
                    {fmtDateTime(b.start)} até {fmtDateTime(b.end)}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    Duração: {fmtMinutes(blockedDurationInMinutes(b.start, b.end))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 overflow-hidden border border-[#ECE7DD] bg-white shadow-sm">
        <div className="border-b border-[#ECE7DD] bg-[#FCFAF6] p-4">
          <h2 className="text-lg font-medium text-[#111827]">Procedimentos mais frequentes</h2>
        </div>

        {loading ? (
          <div className="p-4 text-sm text-gray-500">Carregando...</div>
        ) : dashboard.topProcedures.length === 0 ? (
          <div className="p-4 text-sm text-gray-500">Nenhum procedimento cadastrado ainda.</div>
        ) : (
          <div className="divide-y divide-[#F3EFE7]">
            {dashboard.topProcedures.map(([name, count]) => (
              <div key={name} className="flex items-center justify-between p-4">
                <div className="font-medium text-[#111827]">{name}</div>
                <div className="text-sm text-gray-500">{count} consulta(s)</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}