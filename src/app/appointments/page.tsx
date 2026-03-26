"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Calendar,
  Clock3,
  MessageSquarePlus,
  Plus,
  Search,
} from "lucide-react";
import AdvancedWeeklyCalendar from "@/components/calendar/AdvancedWeeklyCalendar";
import { buildWhatsappMessage, getWhatsappLink } from "@/lib/whatsapp";

type Patient = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
};

type AppointmentStatus = "SCHEDULED" | "COMPLETED" | "CANCELED";
type PaymentStatus = "PENDING" | "PAID" | "CANCELED";

type Appointment = {
  id: string;
  date: string;
  status: AppointmentStatus;
  patientId: string;
  patient?: Patient;
  procedureName?: string | null;
  price?: number | null;
  paymentStatus?: PaymentStatus;
  durationMinutes?: 30 | 60 | 90 | 120;
  room?: "A" | "B";
};

type BlockedTime = {
  id: string;
  start: string;
  end: string;
  reason?: string | null;
};

function fmtCurrency(value?: number | null) {
  return (value ?? 0).toLocaleString("pt-BR", {
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

function statusLabel(status: AppointmentStatus) {
  if (status === "COMPLETED") return "CONFIRMADO";
  if (status === "CANCELED") return "CANCELADO";
  return "PENDENTE";
}

function statusClass(status: AppointmentStatus) {
  if (status === "COMPLETED") {
    return "border border-[#CFE9D8] bg-[#F3FBF6] text-[#4A9B68]";
  }

  if (status === "CANCELED") {
    return "border border-[#E5E7EB] bg-[#F8FAFC] text-[#64748B]";
  }

  return "border border-[#E9DEC9] bg-[#FCFAF6] text-[#C8A35F]";
}

function PageHeader() {
  return (
    <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
      <div>
        <p className="text-[10px] uppercase tracking-[0.38em] text-[#C8A35F]">
          Harmonie Management System
        </p>

        <h1
          className="mt-3 text-[46px] leading-none text-[#111111] xl:text-[48px]"
          style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
        >
          Agenda
        </h1>
      </div>

      <div className="flex items-center gap-5 pt-1">
        <div className="flex h-10 w-[260px] items-center gap-3 border-b border-[#D9DEEA] text-[#B3BED2]">
          <Search size={15} strokeWidth={1.8} />
          <input
            placeholder="BUSCAR PACIENTE..."
            className="w-full bg-transparent text-[11px] font-semibold uppercase tracking-[0.16em] outline-none placeholder:text-[#C6D0E0]"
          />
        </div>

        <button type="button" className="relative text-[#C1CAD9]">
          <Bell size={17} strokeWidth={1.8} />
          <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-[#C8A35F]" />
        </button>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="border border-[#F0ECE4] bg-white px-5 py-4">
      <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#96A4C1]">
        {label}
      </div>

      <div
        className="mt-2 text-[20px] text-[#111111]"
        style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
      >
        {value}
      </div>
    </div>
  );
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const now = new Date();
      const start = new Date(now);
      start.setDate(now.getDate() - 7);
      start.setHours(0, 0, 0, 0);

      const end = new Date(now);
      end.setDate(now.getDate() + 30);
      end.setHours(23, 59, 59, 999);

      const [appointmentsRes, blockedRes] = await Promise.all([
        fetch("/api/appointments", { cache: "no-store" }),
        fetch(
          `/api/blocked-times?dateFrom=${encodeURIComponent(
            start.toISOString()
          )}&dateTo=${encodeURIComponent(end.toISOString())}`,
          { cache: "no-store" }
        ),
      ]);

      const appointmentsData = await appointmentsRes.json();
      const blockedData = await blockedRes.json();

      if (!appointmentsRes.ok) {
        setError(appointmentsData?.error ?? "Erro ao carregar agenda.");
        return;
      }

      if (!blockedRes.ok) {
        setError(blockedData?.error ?? "Erro ao carregar bloqueios.");
        return;
      }

      setAppointments(Array.isArray(appointmentsData) ? appointmentsData : []);
      setBlockedTimes(Array.isArray(blockedData) ? blockedData : []);
    } catch {
      setError("Erro ao carregar agenda.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const upcomingAppointments = useMemo(() => {
    const now = Date.now();

    return appointments
      .filter((item) => new Date(item.date).getTime() > now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 8);
  }, [appointments]);

  const summary = useMemo(() => {
    const scheduled = upcomingAppointments.filter(
      (item) => item.status === "SCHEDULED"
    ).length;

    const completed = upcomingAppointments.filter(
      (item) => item.status === "COMPLETED"
    ).length;

    const paidRevenue = upcomingAppointments
      .filter((item) => item.paymentStatus === "PAID")
      .reduce((acc, item) => acc + (item.price ?? 0), 0);

    return {
      total: upcomingAppointments.length,
      scheduled,
      completed,
      paidRevenue,
    };
  }, [upcomingAppointments]);

  return (
    <div className="min-h-screen bg-[#FAF8F3] px-8 py-8 md:px-10 xl:px-14 xl:py-10">
      <PageHeader />

      <div className="mt-10 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <h2
          className="text-[24px] uppercase tracking-[0.16em] text-[#111111]"
          style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
        >
          Agenda
        </h2>

        <button
          type="button"
          onClick={() => {
            const el = document.getElementById("agenda-interativa");
            el?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
          className="inline-flex h-11 items-center justify-center gap-3 bg-[#111111] px-6 text-[12px] font-semibold uppercase tracking-[0.18em] text-white"
        >
          <Plus size={14} strokeWidth={2} />
          Novo agendamento
        </button>
      </div>

      {error ? (
        <div className="mt-5 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mt-7 overflow-hidden border border-[#F0ECE4] bg-white">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-[#EEF1F5]">
              <th className="px-8 py-5 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-[#96A4C1]">
                Paciente
              </th>
              <th className="px-8 py-5 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-[#96A4C1]">
                Procedimento
              </th>
              <th className="px-8 py-5 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-[#96A4C1]">
                Data/Hora
              </th>
              <th className="px-8 py-5 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-[#96A4C1]">
                Status
              </th>
              <th className="px-8 py-5 text-right text-[11px] font-semibold uppercase tracking-[0.24em] text-[#96A4C1]">
                Ações
              </th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-8 py-8 text-sm text-[#64748B]">
                  Carregando...
                </td>
              </tr>
            ) : upcomingAppointments.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-8 py-8 text-sm text-[#64748B]">
                  Nenhum agendamento encontrado.
                </td>
              </tr>
            ) : (
              upcomingAppointments.map((item) => {
                const whatsappLink = item.patient?.phone
                  ? getWhatsappLink(
                      item.patient.phone,
                      buildWhatsappMessage({
                        patientName: item.patient?.name,
                        procedureName: item.procedureName,
                        date: item.date,
                        room: item.room ?? "A",
                      })
                    )
                  : null;

                return (
                  <tr key={item.id} className="border-b border-[#EEF1F5] last:border-b-0">
                    <td className="px-8 py-5">
                      <div
                        className="text-[17px] text-[#111111]"
                        style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                      >
                        {item.patient?.name ?? "Paciente"}
                      </div>
                    </td>

                    <td className="px-8 py-5 text-[14px] uppercase tracking-[0.08em] text-[#60759B]">
                      {item.procedureName || "ATENDIMENTO"}
                    </td>

                    <td className="px-8 py-5">
                      <div className="flex flex-wrap items-center gap-4 text-[14px] text-[#60759B]">
                        <span className="inline-flex items-center gap-2">
                          <Calendar size={13} strokeWidth={1.8} className="text-[#C8A35F]" />
                          {fmtDate(item.date)}
                        </span>

                        <span className="inline-flex items-center gap-2">
                          <Clock3 size={13} strokeWidth={1.8} className="text-[#C8A35F]" />
                          {fmtTime(item.date)}
                        </span>
                      </div>
                    </td>

                    <td className="px-8 py-5">
                      <span
                        className={`inline-flex px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] ${statusClass(
                          item.status
                        )}`}
                      >
                        {statusLabel(item.status)}
                      </span>
                    </td>

                    <td className="px-8 py-5 text-right">
                      <div className="flex flex-col items-end gap-2">
                        {whatsappLink ? (
                          <a
                            href={whatsappLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#C8A35F] hover:opacity-80"
                          >
                            <MessageSquarePlus size={12} />
                            Confirmar WhatsApp
                          </a>
                        ) : null}

                        <div
                          className="text-[17px] text-[#111111]"
                          style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                        >
                          {fmtCurrency(item.price)}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-7 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <SummaryCard label="Consultas futuras" value={summary.total} />
        <SummaryCard label="Agendadas" value={summary.scheduled} />
        <SummaryCard label="Concluídas" value={summary.completed} />
        <SummaryCard label="Receita paga" value={fmtCurrency(summary.paidRevenue)} />
      </div>

      <div id="agenda-interativa" className="mt-8">
        <AdvancedWeeklyCalendar
          appointments={appointments}
          blockedTimes={blockedTimes}
          onReload={loadData}
        />
      </div>
    </div>
  );
}