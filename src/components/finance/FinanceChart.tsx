"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
} from "recharts";

type TransactionType = "INCOME" | "EXPENSE";

type FinancialTransaction = {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  type: TransactionType;
};

type Props = {
  items: FinancialTransaction[];
};

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

export default function FinanceChart({ items }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const data = useMemo(() => {
    const incomeMap = new Map<number, number>();
    const expenseMap = new Map<number, number>();

    for (let i = 0; i < 12; i++) {
      incomeMap.set(i, 0);
      expenseMap.set(i, 0);
    }

    for (const item of items) {
      const month = new Date(item.date).getMonth();

      if (item.type === "INCOME") {
        incomeMap.set(month, (incomeMap.get(month) ?? 0) + item.amount);
      } else {
        expenseMap.set(month, (expenseMap.get(month) ?? 0) + item.amount);
      }
    }

    return MONTHS.map((month, index) => ({
      month,
      receitas: incomeMap.get(index) ?? 0,
      despesas: expenseMap.get(index) ?? 0,
    }));
  }, [items]);

  if (!mounted) {
    return <div className="mt-8 h-[320px] border border-[#ECE7DD] bg-white p-8 shadow-sm" />;
  }

  return (
    <div className="mt-8 border border-[#ECE7DD] bg-white p-8 shadow-sm">
      <div className="mb-6">
        <h3 className="text-[13px] font-semibold uppercase tracking-[0.28em] text-[#8E9AAF]">
          Receitas x despesas
        </h3>
      </div>

      <div className="h-[320px] min-h-[320px] w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
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
              formatter={(value: number, name: string) => [formatCurrency(value), name]}
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #ECE7DD",
                borderRadius: "0px",
              }}
            />
            <Bar dataKey="receitas" fill="#10B981" barSize={24} />
            <Bar dataKey="despesas" fill="#F43F5E" barSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}