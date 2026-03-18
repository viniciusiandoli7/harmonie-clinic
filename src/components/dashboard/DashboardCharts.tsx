"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

type AppointmentStatus = "SCHEDULED" | "COMPLETED" | "CANCELED";
type PaymentStatus = "PENDING" | "PAID" | "CANCELED";

type Patient = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
};

type Appointment = {
  id: string;
  date: string;
  status: AppointmentStatus;
  patientId: string;
  patient?: Patient;
  durationMinutes?: 30 | 60 | 90 | 120;
  notes?: string | null;
  procedureName?: string | null;
  price?: number | null;
  paymentStatus?: PaymentStatus;
  room?: "A" | "B";
};

type Props = {
  appointments: Appointment[];
};

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const PIE_COLORS = ["#C8A35F", "#111111", "#D9DEE7", "#BFC9D8", "#E8DCC2"];

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

function ChartCard({
  title,
  children,
  rightLabel,
}: {
  title: string;
  children: React.ReactNode;
  rightLabel?: string;
}) {
  return (
    <div className="min-w-0 border border-[#ECE7DD] bg-white p-8 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-[13px] font-semibold uppercase tracking-[0.28em] text-[#8E9AAF]">
          {title}
        </h3>

        {rightLabel ? (
          <span className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[#C8A35F]">
            {rightLabel}
          </span>
        ) : null}
      </div>

      <div className="h-[320px] min-h-[320px] w-full min-w-0">{children}</div>
    </div>
  );
}

export default function DashboardCharts({ appointments }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { monthlyRevenue, monthlyConsultations, topProcedures } = useMemo(() => {
    const revenueMap = new Map<number, number>();
    const consultationsMap = new Map<number, number>();
    const proceduresMap = new Map<string, number>();

    for (let i = 0; i < 12; i++) {
      revenueMap.set(i, 0);
      consultationsMap.set(i, 0);
    }

    for (const appointment of appointments) {
      const month = new Date(appointment.date).getMonth();

      if (appointment.status !== "CANCELED") {
        consultationsMap.set(month, (consultationsMap.get(month) ?? 0) + 1);
      }

      if (appointment.paymentStatus === "PAID") {
        revenueMap.set(month, (revenueMap.get(month) ?? 0) + (appointment.price ?? 0));
      }

      const procedure = appointment.procedureName?.trim();
      if (procedure) {
        proceduresMap.set(procedure, (proceduresMap.get(procedure) ?? 0) + 1);
      }
    }

    return {
      monthlyRevenue: MONTHS.map((month, index) => ({
        month,
        value: revenueMap.get(index) ?? 0,
      })),
      monthlyConsultations: MONTHS.map((month, index) => ({
        month,
        value: consultationsMap.get(index) ?? 0,
      })),
      topProcedures: Array.from(proceduresMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5),
    };
  }, [appointments]);

  if (!mounted) {
    return (
      <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <div className="h-[320px] border border-[#ECE7DD] bg-white p-8 shadow-sm" />
        </div>
        <div className="xl:col-span-4">
          <div className="h-[320px] border border-[#ECE7DD] bg-white p-8 shadow-sm" />
        </div>
        <div className="xl:col-span-12">
          <div className="h-[320px] border border-[#ECE7DD] bg-white p-8 shadow-sm" />
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-12">
      <div className="min-w-0 xl:col-span-8">
        <ChartCard title="Fluxo de caixa" rightLabel="Receitas">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyRevenue} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C8A35F" stopOpacity={0.22} />
                  <stop offset="95%" stopColor="#C8A35F" stopOpacity={0.03} />
                </linearGradient>
              </defs>

              <CartesianGrid stroke="#F3EFE7" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fill: "#94A3B8", fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fill: "#94A3B8", fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), "Receitas"]}
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #ECE7DD",
                  borderRadius: "0px",
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#C8A35F"
                strokeWidth={3}
                fill="url(#revenueFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="min-w-0 xl:col-span-4">
        <ChartCard title="Procedimentos mais realizados">
          {topProcedures.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-gray-500">
              Nenhum procedimento cadastrado.
            </div>
          ) : (
            <div className="grid h-full grid-cols-1 gap-4 lg:grid-cols-[180px_1fr] lg:items-center">
              <div className="h-[220px] min-w-0 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={topProcedures}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={52}
                      outerRadius={82}
                      paddingAngle={3}
                    >
                      {topProcedures.map((_, index) => (
                        <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [`${value}`, "Qtd."]}
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #ECE7DD",
                        borderRadius: "0px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-4">
                {topProcedures.map((item, index) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between border-b border-[#F3EFE7] pb-3"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="h-3 w-3"
                        style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                      />
                      <span className="text-sm font-medium text-[#334155]">{item.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-[#111827]">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ChartCard>
      </div>

      <div className="min-w-0 xl:col-span-12">
        <ChartCard title="Consultas por mês">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={monthlyConsultations}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid stroke="#F3EFE7" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fill: "#94A3B8", fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fill: "#94A3B8", fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                formatter={(value: number) => [`${value}`, "Consultas"]}
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #ECE7DD",
                  borderRadius: "0px",
                }}
              />
              <Bar dataKey="value" fill="#C8A35F" barSize={42} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}