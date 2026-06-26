"use client";

type Props = {
  loading: boolean;
  onRefresh: () => void;
};

export default function DashboardHeader({ loading, onRefresh }: Props) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="mb-2 text-[11px] uppercase tracking-[0.35em] text-[#5A1F2B]">
          Mariana Thomaz Carmona System
        </p>
        <h1 className="text-5xl font-light tracking-tight text-[#1E1A18]">
          Bem-vinda, Dra. Mariana
        </h1>
      </div>

      <button
        type="button"
        onClick={onRefresh}
        disabled={loading}
        className="h-11 border border-[#1E1A18111] bg-[#1E1A18111] px-5 text-sm font-semibold uppercase tracking-[0.16em] text-white transition hover:opacity-90 disabled:opacity-60"
      >
        {loading ? "Atualizando..." : "Atualizar dashboard"}
      </button>
    </div>
  );
}