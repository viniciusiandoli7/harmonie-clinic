"use client";

import { useEffect, useMemo, useState } from "react";
import TransactionModal from "@/components/finance/TransactionModal";
import FinanceChart from "@/components/finance/FinanceChart";

type TransactionType = "INCOME" | "EXPENSE";
type PeriodFilter = "ALL" | "TODAY" | "WEEK" | "MONTH";

type FinancialTransaction = {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  type: TransactionType;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

function fmtCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function fmtDate(date: string) {
  return new Date(date).toLocaleDateString("pt-BR");
}

function categoryBadge(category: string) {
  return "border border-[#E8DDC8] bg-[#FCFAF6] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#C8A35F]";
}

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function startOfWeek(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d;
}

function endOfWeek(date: Date) {
  const d = startOfWeek(date);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

export default function FinancePage() {
  const [items, setItems] = useState<FinancialTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [editingItem, setEditingItem] = useState<FinancialTransaction | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | TransactionType>("ALL");
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("ALL");

  async function loadTransactions() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/financial-transactions", {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error ?? "Erro ao carregar transações.");
        return;
      }

      setItems(Array.isArray(data) ? data : []);
    } catch {
      setError("Erro ao carregar transações.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm("Deseja excluir esta transação?");
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/financial-transactions/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data?.error ?? "Erro ao excluir.");
        return;
      }

      await loadTransactions();
    } catch {
      alert("Erro ao excluir.");
    }
  }

  function handleEdit(item: FinancialTransaction) {
    setEditingItem(item);
    setOpenModal(true);
  }

  function handleCreate() {
    setEditingItem(null);
    setOpenModal(true);
  }

  useEffect(() => {
    loadTransactions();
  }, []);

  const filteredItems = useMemo(() => {
    const now = new Date();

    return items.filter((item) => {
      const matchesType = typeFilter === "ALL" ? true : item.type === typeFilter;

      const term = search.trim().toLowerCase();
      const matchesSearch =
        term.length === 0 ||
        item.description.toLowerCase().includes(term) ||
        item.category.toLowerCase().includes(term) ||
        (item.notes ?? "").toLowerCase().includes(term);

      const itemDate = new Date(item.date);

      let matchesPeriod = true;

      if (periodFilter === "TODAY") {
        matchesPeriod = itemDate >= startOfDay(now) && itemDate <= endOfDay(now);
      } else if (periodFilter === "WEEK") {
        matchesPeriod = itemDate >= startOfWeek(now) && itemDate <= endOfWeek(now);
      } else if (periodFilter === "MONTH") {
        matchesPeriod = itemDate >= startOfMonth(now) && itemDate <= endOfMonth(now);
      }

      return matchesType && matchesSearch && matchesPeriod;
    });
  }, [items, search, typeFilter, periodFilter]);

  const summary = useMemo(() => {
    const totalIncome = filteredItems
      .filter((item) => item.type === "INCOME")
      .reduce((acc, item) => acc + item.amount, 0);

    const totalExpense = filteredItems
      .filter((item) => item.type === "EXPENSE")
      .reduce((acc, item) => acc + item.amount, 0);

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
    };
  }, [filteredItems]);

  return (
    <div className="bg-[#FAF8F3] p-8 md:p-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="mb-2 text-[11px] uppercase tracking-[0.35em] text-[#C8A35F]">
            Harmonie Management System
          </p>
          <h1 className="text-5xl font-light tracking-tight text-[#111827]">
            Financeiro
          </h1>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <a
            href="/reports/financial"
            target="_blank"
            className="flex h-11 items-center justify-center border border-[#ECE7DD] bg-white px-5 text-sm font-semibold uppercase tracking-[0.14em] text-[#111827]"
          >
            Relatório PDF
          </a>

          <button
            type="button"
            onClick={handleCreate}
            className="h-11 bg-[#111111] px-5 text-sm font-semibold uppercase tracking-[0.14em] text-white"
          >
            + Nova transação
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-8 flex flex-col gap-4 xl:flex-row">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar descrição, categoria ou observação..."
          className="h-11 w-full border border-[#ECE7DD] bg-white px-4 outline-none xl:max-w-xl"
        />

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as "ALL" | TransactionType)}
          className="h-11 border border-[#ECE7DD] bg-white px-4 outline-none"
        >
          <option value="ALL">Todos os tipos</option>
          <option value="INCOME">Entradas</option>
          <option value="EXPENSE">Saídas</option>
        </select>

        <select
          value={periodFilter}
          onChange={(e) => setPeriodFilter(e.target.value as PeriodFilter)}
          className="h-11 border border-[#ECE7DD] bg-white px-4 outline-none"
        >
          <option value="ALL">Todo período</option>
          <option value="TODAY">Hoje</option>
          <option value="WEEK">Esta semana</option>
          <option value="MONTH">Este mês</option>
        </select>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="border border-[#ECE7DD] bg-white p-8 shadow-sm">
          <p className="text-[12px] font-semibold uppercase tracking-[0.24em] text-[#8E9AAF]">
            Total receitas
          </p>
          <h2 className="mt-4 text-4xl font-light text-emerald-600">
            {fmtCurrency(summary.totalIncome)}
          </h2>
        </div>

        <div className="border border-[#ECE7DD] bg-white p-8 shadow-sm">
          <p className="text-[12px] font-semibold uppercase tracking-[0.24em] text-[#8E9AAF]">
            Total despesas
          </p>
          <h2 className="mt-4 text-4xl font-light text-rose-500">
            {fmtCurrency(summary.totalExpense)}
          </h2>
        </div>

        <div className="border border-[#ECE7DD] bg-white p-8 shadow-sm">
          <p className="text-[12px] font-semibold uppercase tracking-[0.24em] text-[#8E9AAF]">
            Saldo em caixa
          </p>
          <h2 className="mt-4 text-4xl font-light text-[#111827]">
            {fmtCurrency(summary.balance)}
          </h2>
        </div>
      </div>

      <FinanceChart items={filteredItems} />

      <div className="mt-8 overflow-hidden border border-[#ECE7DD] bg-white shadow-sm">
        <div className="border-b border-[#ECE7DD] bg-[#FCFAF6] p-4">
          <h2 className="text-lg font-medium text-[#111827]">Transações</h2>
        </div>

        {loading ? (
          <div className="p-4 text-sm text-gray-500">Carregando...</div>
        ) : filteredItems.length === 0 ? (
          <div className="p-4 text-sm text-gray-500">Nenhuma transação encontrada.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-[#F3EFE7]">
                  <th className="px-6 py-4 text-left text-[12px] font-semibold uppercase tracking-[0.18em] text-[#8E9AAF]">
                    Data
                  </th>
                  <th className="px-6 py-4 text-left text-[12px] font-semibold uppercase tracking-[0.18em] text-[#8E9AAF]">
                    Descrição
                  </th>
                  <th className="px-6 py-4 text-left text-[12px] font-semibold uppercase tracking-[0.18em] text-[#8E9AAF]">
                    Categoria
                  </th>
                  <th className="px-6 py-4 text-left text-[12px] font-semibold uppercase tracking-[0.18em] text-[#8E9AAF]">
                    Tipo
                  </th>
                  <th className="px-6 py-4 text-right text-[12px] font-semibold uppercase tracking-[0.18em] text-[#8E9AAF]">
                    Valor
                  </th>
                  <th className="px-6 py-4 text-right text-[12px] font-semibold uppercase tracking-[0.18em] text-[#8E9AAF]">
                    Ações
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id} className="border-b border-[#F3EFE7]">
                    <td className="px-6 py-4 text-[#64748B]">{fmtDate(item.date)}</td>
                    <td className="px-6 py-4 text-[#111827]">{item.description}</td>
                    <td className="px-6 py-4">
                      <span className={categoryBadge(item.category)}>{item.category}</span>
                    </td>
                    <td className="px-6 py-4 text-[#64748B]">
                      {item.type === "INCOME" ? "Entrada" : "Saída"}
                    </td>
                    <td
                      className={[
                        "px-6 py-4 text-right font-medium",
                        item.type === "INCOME" ? "text-emerald-600" : "text-rose-500",
                      ].join(" ")}
                    >
                      {item.type === "INCOME" ? "+ " : "- "}
                      {fmtCurrency(item.amount)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-4">
                        <button
                          type="button"
                          onClick={() => handleEdit(item)}
                          className="text-sm font-medium text-[#111827] hover:underline"
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="text-sm font-medium text-rose-500 hover:underline"
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <TransactionModal
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          setEditingItem(null);
        }}
        onSaved={loadTransactions}
        initialData={editingItem}
      />
    </div>
  );
}