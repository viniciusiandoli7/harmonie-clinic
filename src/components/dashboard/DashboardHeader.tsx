"use client";

type Props = {
  loading: boolean;
  onRefresh: () => void;
};

export default function DashboardHeader({ loading, onRefresh }: Props) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="mb-2 text-[11px] uppercase tracking-[0.35em] text-[#C8A35F]">
          Harmonie Management System
        </p>
        <h1 className="text-5xl font-light tracking-tight text-[#111827]">
          Bem-vinda, Dra. Mariana
        </h1>
      </div>

      <button
        type="button"
        onClick={onRefresh}
        disabled={loading}
        className="h-11 border border-[#111111] bg-[#111111] px-5 text-sm font-semibold uppercase tracking-[0.16em] text-white transition hover:opacity-90 disabled:opacity-60"
      >
        {loading ? "Atualizando..." : "Atualizar dashboard"}
      </button>
    </div>
  );
}