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
  if (status === "COMPLETED") return "border-green-300 bg-green-50 text-green-700";
  if (status === "CANCELED") return "border-gray-300 bg-gray-50 text-gray-600";
  return "border-[#C5A059] bg-[#FAFAFA] text-[#1A1A1A]";
}

function paymentBadgeClasses(status: PaymentStatus) {
  if (status === "PAID") return "border-green-300 bg-green-50 text-green-700";
  if (status === "CANCELED") return "border-gray-300 bg-gray-50 text-gray-600";
  return "border-[#C5A059] bg-[#FAFAFA] text-[#1A1A1A]";
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
    <div className="min-h-screen bg-[#FAFAFA] px-4 py-4 md:px-8 xl:px-12 xl:py-8">
      <DashboardHeader loading={loading} onRefresh={loadDashboard} />

      <DashboardPeriodFilter value={period} onChange={setPeriod} />

      {error && (
        <div className="mt-4 border border-red-300 bg-red-50 px-4 py-3 text-[12px] text-red-700 rounded-xl" style={{ fontFamily: 'Inter, sans-serif' }}>
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
        <div className="border border-[#C5A059] bg-[#FAFAFA] p-5 rounded-xl shadow-md">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#C5A059]" style={{ fontFamily: 'Inter, sans-serif' }}>
            Agendadas
          </p>
          <h2 className="mt-3 text-[28px] text-[#1A1A1A] tracking-[0.08em]" style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, letterSpacing: '0.08em' }}>{dashboard.scheduled}</h2>
        </div>

        <div className="border border-[#C5A059] bg-[#FAFAFA] p-5 rounded-xl shadow-md">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#C5A059]" style={{ fontFamily: 'Inter, sans-serif' }}>
            Concluídas
          </p>
          <h2 className="mt-3 text-[28px] text-[#1A1A1A] tracking-[0.08em]" style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, letterSpacing: '0.08em' }}>{dashboard.completed}</h2>
        </div>

        <div className="border border-[#C5A059] bg-[#FAFAFA] p-5 rounded-xl shadow-md">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#C5A059]" style={{ fontFamily: 'Inter, sans-serif' }}>
            Canceladas
          </p>
          <h2 className="mt-3 text-[28px] text-[#1A1A1A] tracking-[0.08em]" style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, letterSpacing: '0.08em' }}>{dashboard.canceled}</h2>
        </div>

        <div className="border border-[#C5A059] bg-[#FAFAFA] p-5 rounded-xl shadow-md">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#C5A059]" style={{ fontFamily: 'Inter, sans-serif' }}>
            Tempo bloqueado
          </p>
          <h2 className="mt-3 text-[28px] text-[#1A1A1A] tracking-[0.08em]" style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, letterSpacing: '0.08em' }}>
            {fmtMinutes(dashboard.blockedMinutes)}
          </h2>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="overflow-hidden border border-[#C5A059] bg-[#FAFAFA] rounded-xl shadow-md">
          <div className="border-b border-[#C5A059] bg-[#FAFAFA] p-4">
            <h2 className="text-[18px] text-[#1A1A1A] tracking-[0.12em]" style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, letterSpacing: '0.12em' }}>Próximas consultas</h2>
          </div>

          {loading ? (
            <div className="p-4 text-[12px] text-[#C5A059]" style={{ fontFamily: 'Inter, sans-serif' }}>Carregando...</div>
          ) : dashboard.nextAppointments.length === 0 ? (
            <div className="p-4 text-[12px] text-[#C5A059]" style={{ fontFamily: 'Inter, sans-serif' }}>Nenhuma próxima consulta.</div>
          ) : (
            <div className="divide-y divide-[#C5A059]">
              {dashboard.nextAppointments.map((a) => (
                <div
                  key={a.id}
                  className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-semibold ${statusBadgeClasses(
                          a.status
                        )}`}
                        style={{ fontFamily: 'Inter, sans-serif' }}
                      >
                        {a.status}
                      </span>

                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-semibold ${paymentBadgeClasses(
                          a.paymentStatus ?? "PENDING"
                        )}`}
                        style={{ fontFamily: 'Inter, sans-serif' }}
                      >
                        {a.paymentStatus ?? "PENDING"}
                      </span>

                      <span className="text-[11px] text-[#C5A059]" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {fmtDateTime(a.date)} • {a.durationMinutes ?? 30}min
                      </span>
                    </div>

                    <div className="mt-1 font-semibold text-[#1A1A1A]" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {a.patient?.name ?? "Paciente"}
                    </div>

                    <div className="text-[11px] text-[#C5A059]" style={{ fontFamily: 'Inter, sans-serif' }}>{a.patient?.email ?? ""}</div>

                    {a.procedureName && (
                      <div className="mt-1 text-[10px] text-[#1A1A1A]" style={{ fontFamily: 'Inter, sans-serif' }}>{a.procedureName}</div>
                    )}

                    {a.notes && <div className="mt-1 text-[10px] text-[#C5A059]" style={{ fontFamily: 'Inter, sans-serif' }}>{a.notes}</div>}
                  </div>

                  <div className="text-right text-[12px] text-[#1A1A1A] font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {fmtCurrency(a.price ?? 0)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="overflow-hidden border border-[#C5A059] bg-[#FAFAFA] rounded-xl shadow-md">
          <div className="border-b border-[#C5A059] bg-[#FAFAFA] p-4">
            <h2 className="text-[18px] text-[#1A1A1A] tracking-[0.12em]" style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, letterSpacing: '0.12em' }}>Bloqueios recentes</h2>
          </div>

          {loading ? (
            <div className="p-4 text-[12px] text-[#C5A059]" style={{ fontFamily: 'Inter, sans-serif' }}>Carregando...</div>
          ) : dashboard.recentBlockedTimes.length === 0 ? (
            <div className="p-4 text-[12px] text-[#C5A059]" style={{ fontFamily: 'Inter, sans-serif' }}>Nenhum bloqueio cadastrado.</div>
          ) : (
            <div className="divide-y divide-[#C5A059]">
              {dashboard.recentBlockedTimes.map((b) => (
                <div key={b.id} className="p-4">
                  <div className="font-semibold text-[#1A1A1A]" style={{ fontFamily: 'Inter, sans-serif' }}>🔒 {b.reason || "Bloqueio"}</div>
                  <div className="mt-1 text-[10px] text-[#C5A059]" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Duração: {fmtMinutes(blockedDurationInMinutes(b.start, b.end))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 overflow-hidden border border-[#C5A059] bg-[#FAFAFA] rounded-xl shadow-md">
        <div className="border-b border-[#C5A059] bg-[#FAFAFA] p-4">
          <h2 className="text-[18px] text-[#1A1A1A] tracking-[0.12em]" style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, letterSpacing: '0.12em' }}>Procedimentos mais frequentes</h2>
        </div>

        {loading ? (
          <div className="p-4 text-[12px] text-[#C5A059]" style={{ fontFamily: 'Inter, sans-serif' }}>Carregando...</div>
        ) : dashboard.topProcedures.length === 0 ? (
          <div className="p-4 text-[12px] text-[#C5A059]" style={{ fontFamily: 'Inter, sans-serif' }}>Nenhum procedimento cadastrado ainda.</div>
        ) : (
          <div className="divide-y divide-[#C5A059]">
            {dashboard.topProcedures.map(([name, count]) => (
              <div key={name} className="flex items-center justify-between p-4">
                <div className="font-semibold text-[#1A1A1A]" style={{ fontFamily: 'Inter, sans-serif' }}>{name}</div>
                <div className="text-[11px] text-[#C5A059]" style={{ fontFamily: 'Inter, sans-serif' }}>{count} consulta(s)</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}