"use client";

import { useEffect, useMemo, useState } from "react";

type AppointmentStatus = "SCHEDULED" | "COMPLETED" | "CANCELED";
type PaymentStatus = "PENDING" | "PAID" | "CANCELED";

type Appointment = {
  id: string;
  date: string;
  status: AppointmentStatus;
  price?: number | null;
  paymentStatus?: PaymentStatus;
};

function formatPrice(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function isSameMonth(dateString: string, baseDate: Date) {
  const date = new Date(dateString);
  return (
    date.getMonth() === baseDate.getMonth() &&
    date.getFullYear() === baseDate.getFullYear()
  );
}

export default function MonthlyKpis() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch("/api/appointments", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || "Erro ao carregar dashboard");
        }

        setAppointments(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro inesperado");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const summary = useMemo(() => {
    const now = new Date();

    const currentMonthAppointments = appointments.filter((appointment) =>
      isSameMonth(appointment.date, now)
    );

    const totalAppointments = currentMonthAppointments.length;

    const scheduled = currentMonthAppointments.filter(
      (appointment) => appointment.status === "SCHEDULED"
    ).length;

    const completed = currentMonthAppointments.filter(
      (appointment) => appointment.status === "COMPLETED"
    ).length;

    const canceled = currentMonthAppointments.filter(
      (appointment) => appointment.status === "CANCELED"
    ).length;

    const revenuePaid = currentMonthAppointments
      .filter((appointment) => appointment.paymentStatus === "PAID")
      .reduce((acc, appointment) => acc + (appointment.price ?? 0), 0);

    const revenuePending = currentMonthAppointments
      .filter((appointment) => appointment.paymentStatus === "PENDING")
      .reduce((acc, appointment) => acc + (appointment.price ?? 0), 0);

    const avgTicket =
      completed > 0
        ? currentMonthAppointments
            .filter(
              (appointment) =>
                appointment.status === "COMPLETED" &&
                appointment.price !== null &&
                appointment.price !== undefined
            )
            .reduce((acc, appointment) => acc + (appointment.price ?? 0), 0) /
          completed
        : 0;

    return {
      totalAppointments,
      scheduled,
      completed,
      canceled,
      revenuePaid,
      revenuePending,
      avgTicket,
    };
  }, [appointments]);

  if (loading) {
    return <div className="text-sm text-gray-500">Carregando indicadores...</div>;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <p className="text-sm text-gray-500">Consultas no mês</p>
        <h2 className="mt-2 text-3xl font-bold">{summary.totalAppointments}</h2>
      </div>

      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <p className="text-sm text-gray-500">Agendadas</p>
        <h2 className="mt-2 text-3xl font-bold">{summary.scheduled}</h2>
      </div>

      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <p className="text-sm text-gray-500">Concluídas</p>
        <h2 className="mt-2 text-3xl font-bold">{summary.completed}</h2>
      </div>

      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <p className="text-sm text-gray-500">Canceladas</p>
        <h2 className="mt-2 text-3xl font-bold">{summary.canceled}</h2>
      </div>

      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <p className="text-sm text-gray-500">Recebido no mês</p>
        <h2 className="mt-2 text-2xl font-bold">{formatPrice(summary.revenuePaid)}</h2>
      </div>

      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <p className="text-sm text-gray-500">Ticket médio</p>
        <h2 className="mt-2 text-2xl font-bold">{formatPrice(summary.avgTicket)}</h2>
        <p className="mt-2 text-xs text-gray-500">
          Pendente: {formatPrice(summary.revenuePending)}
        </p>
      </div>
    </div>
  );
}