"use client";

export type DashboardPeriod = "month" | "week" | "today";

type Props = {
  value: DashboardPeriod;
  onChange: (value: DashboardPeriod) => void;
};

const options: { label: string; value: DashboardPeriod }[] = [
  { label: "Hoje", value: "today" },
  { label: "Semana", value: "week" },
  { label: "Mês", value: "month" },
];

export default function DashboardPeriodFilter({ value, onChange }: Props) {
  return (
    <div className="mt-6 flex flex-wrap gap-2">
      {options.map((option) => {
        const active = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={[
              "h-10 border px-4 text-xs font-semibold uppercase tracking-[0.18em] transition",
              active
                ? "border-[#111111] bg-[#111111] text-white"
                : "border-[#ECE7DD] bg-white text-[#111827] hover:bg-[#F8F5EE]",
            ].join(" ")}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}