"use client";

type Props = {
  totalRevenue: number;
  totalAppointments: number;
  totalPatients: number;
  totalPending: number;
};

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

function KpiCard({
  title,
  value,
  highlight,
}: {
  title: string;
  value: string;
  highlight?: string;
}) {
  return (
    <div className="border border-[#ECE7DD] bg-white p-8 shadow-sm">
      <div className="mb-6 flex items-start justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#E8DDC8] text-[#C8A35F]">
          $
        </div>

        {highlight ? (
          <span className="text-sm font-semibold text-emerald-600">{highlight}</span>
        ) : null}
      </div>

      <p className="text-[12px] font-semibold uppercase tracking-[0.26em] text-[#8E9AAF]">
        {title}
      </p>

      <h3 className="mt-4 text-5xl font-light tracking-tight text-[#111827]">{value}</h3>
    </div>
  );
}

export default function KpiCards({
  totalRevenue,
  totalAppointments,
  totalPatients,
  totalPending,
}: Props) {
  return (
    <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-4">
      <KpiCard title="Faturamento mensal" value={formatCurrency(totalRevenue)} highlight="+12%" />
      <KpiCard title="Consultas no período" value={String(totalAppointments)} highlight="+8%" />
      <KpiCard title="Total de pacientes" value={String(totalPatients)} highlight="+4" />
      <KpiCard title="Pendências financeiras" value={formatCurrency(totalPending)} />
    </div>
  );
}