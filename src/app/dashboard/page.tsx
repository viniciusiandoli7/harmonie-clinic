"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  CalendarDays,
  DollarSign,
  Search,
  UserRound,
  Wallet,
} from "lucide-react";

type TransactionType = "INCOME" | "EXPENSE";
type AppointmentStatus = "SCHEDULED" | "COMPLETED" | "CANCELED";

type FinancialTransaction = {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  type: TransactionType;
};

type Patient = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  isActive?: boolean;
  createdAt?: string | null;
};

type Appointment = {
  id: string;
  date: string;
  status: AppointmentStatus;
  procedureName?: string | null;
  durationMinutes?: number;
  room?: "A" | "B";
  patientId?: string;
  patient?: {
    id: string;
    name: string;
  };
};

function fmtCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

function fmtDate(date: string) {
  return new Date(date).toLocaleDateString("pt-BR");
}

function fmtTime(date: string) {
  return new Date(date).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isSameMonth(date: string, base = new Date()) {
  const d = new Date(date);
  return (
    d.getMonth() === base.getMonth() &&
    d.getFullYear() === base.getFullYear()
  );
}

function isToday(date: string) {
  const d = new Date(date);
  const now = new Date();

  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
}

function isFuture(date: string) {
  return new Date(date).getTime() >= new Date().getTime();
}

function getInitial(name: string) {
  return name?.trim()?.charAt(0)?.toUpperCase() || "P";
}

function statusBadge(status: AppointmentStatus) {
  if (status === "COMPLETED") {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (status === "CANCELED") {
    return "border-gray-200 bg-gray-100 text-gray-600";
  }

  return "border-yellow-200 bg-yellow-50 text-yellow-700";
}

function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.38em] text-[#C8A35F]">
        {eyebrow}
      </p>

      <h2
        className="mt-2 text-[28px] leading-none text-[#111111]"
        style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
      >
        {title}
      </h2>

      {description ? (
        <p className="mt-2 text-sm text-[#64748B]">{description}</p>
      ) : null}
    </div>
  );
}

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const [transactionsRes, appointmentsRes, patientsRes] = await Promise.all([
        fetch("/api/financial-transactions", { cache: "no-store" }),
        fetch("/api/appointments", { cache: "no-store" }),
        fetch("/api/patients?includeInactive=true", { cache: "no-store" }),
      ]);

      const transactionsData = await transactionsRes.json();
      const appointmentsData = await appointmentsRes.json();
      const patientsData = await patientsRes.json();

      if (!transactionsRes.ok) {
        throw new Error(transactionsData?.error || "Erro ao carregar transações.");
      }

      if (!appointmentsRes.ok) {
        throw new Error(appointmentsData?.error || "Erro ao carregar agenda.");
      }

      if (!patientsRes.ok) {
        throw new Error(patientsData?.error || "Erro ao carregar pacientes.");
      }

      setTransactions(Array.isArray(transactionsData) ? transactionsData : []);
      setAppointments(Array.isArray(appointmentsData) ? appointmentsData : []);
      setPatients(Array.isArray(patientsData) ? patientsData : []);
    } catch (err) {
      console.error(err);
      setError("Erro ao carregar dashboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const summary = useMemo(() => {
    const monthIncome = transactions
      .filter((item) => item.type === "INCOME" && isSameMonth(item.date))
      .reduce((acc, item) => acc + item.amount, 0);

    const monthExpense = transactions
      .filter((item) => item.type === "EXPENSE" && isSameMonth(item.date))
      .reduce((acc, item) => acc + item.amount, 0);

    const activePatients = patients.filter((item) => item.isActive !== false).length;

    const todayAppointments = appointments.filter(
      (item) => isToday(item.date) && item.status !== "CANCELED"
    ).length;

    return {
      monthIncome,
      monthExpense,
      monthBalance: monthIncome - monthExpense,
      activePatients,
      todayAppointments,
    };
  }, [transactions, appointments, patients]);

  const upcomingAppointments = useMemo(() => {
    return appointments
      .filter((item) => item.status !== "CANCELED" && isFuture(item.date))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 8);
  }, [appointments]);

  const todayAppointments = useMemo(() => {
    return appointments
      .filter((item) => isToday(item.date) && item.status !== "CANCELED")
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [appointments]);

  const recentPatients = useMemo(() => {
    return [...patients]
      .sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, 6);
  }, [patients]);

  const filteredUpcomingAppointments = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return upcomingAppointments;

    return upcomingAppointments.filter((item) => {
      const patientName = item.patient?.name?.toLowerCase() || "";
      const procedure = item.procedureName?.toLowerCase() || "";
      return patientName.includes(term) || procedure.includes(term);
    });
  }, [upcomingAppointments, search]);

  return (
    <div className="min-h-screen bg-[#FAF8F3] px-8 py-8 md:px-10 xl:px-14 xl:py-10">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.38em] text-[#C8A35F]">
            Harmonie Management System
          </p>

          <h1
            className="mt-3 text-[46px] leading-none text-[#111111] xl:text-[48px]"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            Dashboard
          </h1>
        </div>

        <div className="flex items-center gap-5 pt-1">
          <div className="flex h-10 w-[320px] items-center gap-3 border-b border-[#D9DEEA] text-[#B3BED2]">
            <Search size={15} strokeWidth={1.8} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="BUSCAR CONSULTA OU PACIENTE..."
              className="w-full bg-transparent text-[11px] font-semibold uppercase tracking-[0.16em] text-[#111111] outline-none placeholder:text-[#C6D0E0]"
            />
          </div>

          <button type="button" className="relative text-[#C1CAD9]">
            <Bell size={17} strokeWidth={1.8} />
            <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-[#C8A35F]" />
          </button>
        </div>
      </div>

      {error ? (
        <div className="mt-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mt-10 grid grid-cols-1 gap-4 xl:grid-cols-4">
        <div className="border border-[#F0ECE4] bg-white p-7">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#96A4C1]">
              Receita do mês
            </p>
            <DollarSign size={16} className="text-[#C8A35F]" />
          </div>

          <div
            className="mt-4 text-[26px] text-[#C8A35F]"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            {fmtCurrency(summary.monthIncome)}
          </div>
        </div>

        <div className="border border-[#F0ECE4] bg-white p-7">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#96A4C1]">
              Despesa do mês
            </p>
            <Wallet size={16} className="text-[#111111]" />
          </div>

          <div
            className="mt-4 text-[26px] text-rose-500"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            {fmtCurrency(summary.monthExpense)}
          </div>
        </div>

        <div className="border border-[#F0ECE4] bg-white p-7">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#96A4C1]">
              Saldo do mês
            </p>
            <Wallet size={16} className="text-[#C8A35F]" />
          </div>

          <div
            className="mt-4 text-[26px] text-[#111111]"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            {fmtCurrency(summary.monthBalance)}
          </div>
        </div>

        <div className="border border-[#F0ECE4] bg-white p-7">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#96A4C1]">
              Sessões hoje
            </p>
            <CalendarDays size={16} className="text-[#C8A35F]" />
          </div>

          <div
            className="mt-4 text-[26px] text-[#111111]"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            {summary.todayAppointments}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="border border-[#F0ECE4] bg-white p-7">
          <div className="flex items-center justify-between">
            <SectionTitle
              eyebrow="Pacientes"
              title="Base ativa"
              description="Total de pacientes ativos na clínica."
            />
            <div className="flex h-12 w-12 items-center justify-center border border-[#E9DEC9] text-[#C8A35F]">
              <UserRound size={18} />
            </div>
          </div>

          <div
            className="mt-6 text-[36px] text-[#111111]"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            {summary.activePatients}
          </div>

          <div className="mt-4">
            <Link
              href="/patients"
              className="inline-flex h-10 items-center justify-center border border-[#171717] px-4 text-[12px] font-semibold text-[#111111] transition hover:bg-[#171717] hover:text-white"
            >
              Abrir CRM
            </Link>
          </div>
        </div>

        <div className="border border-[#F0ECE4] bg-white p-7">
          <SectionTitle
            eyebrow="Agenda"
            title="Hoje"
            description="Consultas previstas para o dia."
          />

          <div className="mt-6 space-y-3">
            {loading ? (
              <div className="text-sm text-[#64748B]">Carregando agenda...</div>
            ) : todayAppointments.length === 0 ? (
              <div className="text-sm text-[#64748B]">Nenhuma consulta hoje.</div>
            ) : (
              todayAppointments.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between border border-[#ECE7DD] bg-[#FCFAF6] px-4 py-3"
                >
                  <div>
                    <div className="text-sm font-semibold text-[#111111]">
                      {item.patient?.name || "Paciente"}
                    </div>
                    <div className="mt-1 text-xs text-[#64748B]">
                      {item.procedureName || "Procedimento não informado"}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-semibold text-[#111111]">
                      {fmtTime(item.date)}
                    </div>
                    <div className="mt-1 text-xs text-[#64748B]">
                      Sala {item.room || "A"}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="mt-7 grid grid-cols-1 gap-7 xl:grid-cols-[1.6fr_1fr]">
        <div className="overflow-hidden border border-[#F0ECE4] bg-white">
          <div className="border-b border-[#EEF1F5] bg-[#FCFAF6] px-8 py-5">
            <h2
              className="text-[22px] text-[#111111]"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              Próximas consultas
            </h2>
          </div>

          {loading ? (
            <div className="px-8 py-8 text-sm text-[#64748B]">Carregando...</div>
          ) : filteredUpcomingAppointments.length === 0 ? (
            <div className="px-8 py-8 text-sm text-[#64748B]">
              {search
                ? "Nenhuma consulta encontrada para a busca."
                : "Nenhuma próxima consulta."}
            </div>
          ) : (
            <div className="divide-y divide-[#EEF1F5]">
              {filteredUpcomingAppointments.map((appointment) => (
                <div key={appointment.id} className="px-8 py-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="text-[15px] font-semibold text-[#111111]">
                        {appointment.patient?.name || "Paciente"}
                      </div>

                      <div className="mt-1 text-sm text-[#64748B]">
                        {appointment.procedureName || "Procedimento não informado"}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="inline-flex items-center border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#64748B]">
                          {fmtDate(appointment.date)}
                        </span>

                        <span className="inline-flex items-center border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#64748B]">
                          {fmtTime(appointment.date)}
                        </span>

                        <span className="inline-flex items-center border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#64748B]">
                          Sala {appointment.room || "A"}
                        </span>

                        <span
                          className={`inline-flex items-center border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${statusBadge(
                            appointment.status
                          )}`}
                        >
                          {appointment.status}
                        </span>
                      </div>
                    </div>

                    <div className="text-sm text-[#111111]">
                      {appointment.durationMinutes ?? 30} min
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border border-[#F0ECE4] bg-white p-7">
          <SectionTitle
            eyebrow="CRM"
            title="Pacientes recentes"
            description="Últimos cadastros da clínica."
          />

          <div className="mt-6 space-y-4">
            {loading ? (
              <div className="text-sm text-[#64748B]">Carregando pacientes...</div>
            ) : recentPatients.length === 0 ? (
              <div className="text-sm text-[#64748B]">Nenhum paciente encontrado.</div>
            ) : (
              recentPatients.map((patient) => (
                <Link
                  key={patient.id}
                  href={`/patients/${patient.id}`}
                  className="flex items-center gap-4 border border-[#ECE7DD] bg-[#FCFAF6] p-4 transition hover:bg-white"
                >
                  <div className="flex h-11 w-11 items-center justify-center bg-[#171717] text-[20px] text-[#C8A35F]">
                    <span style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                      {getInitial(patient.name)}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-[#111111]">
                      {patient.name}
                    </div>
                    <div className="mt-1 truncate text-xs text-[#64748B]">
                      {patient.phone || patient.email || "Sem contato"}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>

          <div className="mt-6">
            <Link
              href="/patients/new"
              className="inline-flex h-10 items-center justify-center border border-[#171717] px-4 text-[12px] font-semibold text-[#111111] transition hover:bg-[#171717] hover:text-white"
            >
              Novo paciente
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}