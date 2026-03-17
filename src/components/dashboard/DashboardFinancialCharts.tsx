"use client";

import { useEffect, useState } from "react";
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

type ChartPoint = {
  month: string;
  value: number;
};

type ProcedurePoint = {
  name: string;
  value: number;
};

type DashboardSummaryResponse = {
  cards: {
    totalIncomeMonth: number;
    totalExpenseMonth: number;
    balanceMonth: number;
    totalPatients: number;
  };
  charts: {
    monthlyRevenue: ChartPoint[];
    monthlyExpenses: ChartPoint[];
    monthlyConsultations: ChartPoint[];
    topProcedures: ProcedurePoint[];
  };
};

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
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0 border border-[#ECE7DD] bg-white p-8 shadow-sm">
      <div className="mb-6">
        <h3 className="text-[13px] font-semibold uppercase tracking-[0.28em] text-[#8E9AAF]">
          {title}
        </h3>
      </div>
      <div className="h-[320px] min-h-[320px] w-full min-w-0">{children}</div>
    </div>
  );
}

export default function DashboardFinancialCharts() {
  const [data, setData] = useState<DashboardSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/dashboard/summary", { cache: "no-store" });
        const json = await res.json();
        if (res.ok) setData(json);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) {
    return (
      <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-12">
        <div className="xl:col-span-8"><div className="h-[320px] border border-[#ECE7DD] bg-white p-8 shadow-sm" /></div>
        <div className="xl:col-span-4"><div className="h-[320px] border border-[#ECE7DD] bg-white p-8 shadow-sm" /></div>
        <div className="xl:col-span-12"><div className="h-[320px] border border-[#ECE7DD] bg-white p-8 shadow-sm" /></div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-12">
      <div className="min-w-0 xl:col-span-8">
        <ChartCard title="Faturamento mensal real">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.charts.monthlyRevenue}>
              <defs>
                <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#F3EFE7" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: "#94A3B8", fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: "#94A3B8", fontSize: 12 }} tickLine={false} axisLine={false} />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), "Receita"]}
                contentStyle={{ backgroundColor: "#fff", border: "1px solid #ECE7DD", borderRadius: "0px" }}
              />
              <Area type="monotone" dataKey="value" stroke="#10B981" strokeWidth={3} fill="url(#incomeFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="min-w-0 xl:col-span-4">
        <ChartCard title="Procedimentos mais realizados">
          {data.charts.topProcedures.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-gray-500">
              Nenhum procedimento cadastrado.
            </div>
          ) : (
            <div className="grid h-full grid-cols-1 gap-4 lg:grid-cols-[180px_1fr] lg:items-center">
              <div className="h-[220px] w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.charts.topProcedures}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={52}
                      outerRadius={82}
                      paddingAngle={3}
                    >
                      {data.charts.topProcedures.map((_, index) => (
                        <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [`${value}`, "Qtd."]}
                      contentStyle={{ backgroundColor: "#fff", border: "1px solid #ECE7DD", borderRadius: "0px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-4">
                {data.charts.topProcedures.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between border-b border-[#F3EFE7] pb-3">
                    <div className="flex items-center gap-3">
                      <span className="h-3 w-3" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
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

      <div className="min-w-0 xl:col-span-6">
        <ChartCard title="Despesas mensais">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.charts.monthlyExpenses}>
              <CartesianGrid stroke="#F3EFE7" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: "#94A3B8", fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: "#94A3B8", fontSize: 12 }} tickLine={false} axisLine={false} />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), "Despesa"]}
                contentStyle={{ backgroundColor: "#fff", border: "1px solid #ECE7DD", borderRadius: "0px" }}
              />
              <Bar dataKey="value" fill="#F43F5E" barSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="min-w-0 xl:col-span-6">
        <ChartCard title="Consultas por mês">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.charts.monthlyConsultations}>
              <CartesianGrid stroke="#F3EFE7" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: "#94A3B8", fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: "#94A3B8", fontSize: 12 }} tickLine={false} axisLine={false} />
              <Tooltip
                formatter={(value: number) => [`${value}`, "Consultas"]}
                contentStyle={{ backgroundColor: "#fff", border: "1px solid #ECE7DD", borderRadius: "0px" }}
              />
              <Bar dataKey="value" fill="#C8A35F" barSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}