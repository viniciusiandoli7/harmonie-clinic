"use client";

import { useEffect, useState } from "react";

type DashboardSummaryResponse = {
  cards: {
    totalIncomeMonth: number;
    totalExpenseMonth: number;
    balanceMonth: number;
    totalPatients: number;
  };
};

function fmtCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function DashboardFinancialCards() {
  const [data, setData] = useState<DashboardSummaryResponse | null>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/dashboard/summary", { cache: "no-store" });
      const json = await res.json();
      if (res.ok) setData(json);
    }

    load();
  }, []);

  const cards = data?.cards ?? {
    totalIncomeMonth: 0,
    totalExpenseMonth: 0,
    balanceMonth: 0,
    totalPatients: 0,
  };

  return (
    <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-4">
      <div className="border border-[#ECE7DD] bg-white p-8 shadow-sm">
        <p className="text-[12px] font-semibold uppercase tracking-[0.24em] text-[#8E9AAF]">
          Receitas do mês
        </p>
        <h2 className="mt-4 text-4xl font-light text-emerald-600">
          {fmtCurrency(cards.totalIncomeMonth)}
        </h2>
      </div>

      <div className="border border-[#ECE7DD] bg-white p-8 shadow-sm">
        <p className="text-[12px] font-semibold uppercase tracking-[0.24em] text-[#8E9AAF]">
          Despesas do mês
        </p>
        <h2 className="mt-4 text-4xl font-light text-rose-500">
          {fmtCurrency(cards.totalExpenseMonth)}
        </h2>
      </div>

      <div className="border border-[#ECE7DD] bg-white p-8 shadow-sm">
        <p className="text-[12px] font-semibold uppercase tracking-[0.24em] text-[#8E9AAF]">
          Saldo do mês
        </p>
        <h2 className="mt-4 text-4xl font-light text-[#111827]">
          {fmtCurrency(cards.balanceMonth)}
        </h2>
      </div>

      <div className="border border-[#ECE7DD] bg-white p-8 shadow-sm">
        <p className="text-[12px] font-semibold uppercase tracking-[0.24em] text-[#8E9AAF]">
          Total de pacientes
        </p>
        <h2 className="mt-4 text-4xl font-light text-[#111827]">
          {cards.totalPatients}
        </h2>
      </div>
    </div>
  );
}