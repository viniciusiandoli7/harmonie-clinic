"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, Search } from "lucide-react";
import TransactionModal from "@/components/finance/TransactionModal";
import CloseSaleAutomationCard from "@/components/finance/CloseSaleAutomationCard";

type TransactionType = "INCOME" | "EXPENSE";

type FinancialTransaction = {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  type: TransactionType;
  grossAmount?: number | null;
  receivedAmount?: number | null;
  pendingAmount?: number | null;
  clinicCommissionPct?: number | null;
  clinicCommissionValue?: number | null;
  professionalValue?: number | null;
  operationalCost?: number | null;
  clinicProfit?: number | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

type Patient = {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
};

function fmtCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

function fmtDate(date: string) {
  return new Date(date).toLocaleDateString("pt-BR");
}

function categoryBadge(category: string) {
  return "border border-[#E9DEC9] bg-[#FCFAF6] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#C8A35F]";
}

type PageHeaderProps = {
  search: string;
  onSearchChange: (value: string) => void;
};

function PageHeader({ search, onSearchChange }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
      <div>
        <p className="text-[10px] uppercase tracking-[0.38em] text-[#C8A35F]">
          Harmonie Management System
        </p>

        <h1
          className="mt-3 text-[46px] leading-none text-[#111111] xl:text-[48px]"
          style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
        >
          Finances
        </h1>
      </div>

      <div className="flex items-center gap-5 pt-1">
        <div className="flex h-10 w-[300px] items-center gap-3 border-b border-[#D9DEEA] text-[#B3BED2]">
          <Search size={15} strokeWidth={1.8} />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="BUSCAR TRANSAÇÃO OU PACIENTE..."
            className="w-full bg-transparent text-[11px] font-semibold uppercase tracking-[0.16em] text-[#111111] outline-none placeholder:text-[#C6D0E0]"
          />
        </div>

        <button type="button" className="relative text-[#C1CAD9]">
          <Bell size={17} strokeWidth={1.8} />
          <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-[#C8A35F]" />
        </button>
      </div>
    </div>
  );
}

export default function FinancePage() {
  const [items, setItems] = useState<FinancialTransaction[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [editingItem, setEditingItem] = useState<FinancialTransaction | null>(null);

  async function loadTransactions() {
    setLoading(true);
    setError("");

    try {
      const [transactionsRes, patientsRes] = await Promise.all([
        fetch("/api/financial-transactions", {
          cache: "no-store",
        }),
        fetch("/api/patients?includeInactive=true", {
          cache: "no-store",
        }),
      ]);

      const transactionsData = await transactionsRes.json();
      const patientsData = await patientsRes.json();

      if (!transactionsRes.ok) {
        setError(transactionsData?.error ?? "Erro ao carregar transações.");
        return;
      }

      if (!patientsRes.ok) {
        setError(patientsData?.error ?? "Erro ao carregar pacientes.");
        return;
      }

      setItems(Array.isArray(transactionsData) ? transactionsData : []);
      setPatients(Array.isArray(patientsData) ? patientsData : []);
    } catch {
      setError("Erro ao carregar dados do financeiro.");
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
    const term = search.trim().toLowerCase();

    if (!term) return items;

    return items.filter((item) => {
      const description = item.description?.toLowerCase() || "";
      const category = item.category?.toLowerCase() || "";
      const notes = item.notes?.toLowerCase() || "";

      return (
        description.includes(term) ||
        category.includes(term) ||
        notes.includes(term)
      );
    });
  }, [items, search]);

  const summary = useMemo(() => {
    const incomeItems = items.filter((item) => item.type === "INCOME");
    const expenseItems = items.filter((item) => item.type === "EXPENSE");

    const totalReceived = incomeItems.reduce(
      (acc, item) => acc + (item.receivedAmount ?? item.amount ?? 0),
      0
    );

    const totalPending = incomeItems.reduce(
      (acc, item) => acc + (item.pendingAmount ?? 0),
      0
    );

    const clinicRevenue = incomeItems.reduce(
      (acc, item) => acc + (item.clinicCommissionValue ?? 0),
      0
    );

    const professionalRevenue = incomeItems.reduce(
      (acc, item) => acc + (item.professionalValue ?? 0),
      0
    );

    const totalProfit = incomeItems.reduce(
      (acc, item) => acc + (item.clinicProfit ?? (item.receivedAmount ?? item.amount ?? 0)),
      0
    );

    const totalExpense = expenseItems.reduce(
      (acc, item) => acc + item.amount,
      0
    );

    return {
      totalReceived,
      totalPending,
      clinicRevenue,
      professionalRevenue,
      totalExpense,
      totalProfit,
      cashBalance: totalReceived - totalExpense,
    };
  }, [items]);

  return (
    <div className="min-h-screen bg-[#FAF8F3] px-8 py-8 md:px-10 xl:px-14 xl:py-10">
      <PageHeader search={search} onSearchChange={setSearch} />

      <div className="mt-10 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <h2
          className="text-[24px] uppercase tracking-[0.16em] text-[#111111]"
          style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
        >
          Financeiro
        </h2>

        <button
          type="button"
          onClick={handleCreate}
          className="inline-flex h-11 items-center justify-center bg-[#111111] px-6 text-[12px] font-semibold uppercase tracking-[0.18em] text-white"
        >
          + Nova transação
        </button>
      </div>

      {error ? (
        <div className="mt-5 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mt-7 grid grid-cols-1 gap-4 xl:grid-cols-3 2xl:grid-cols-6">
        <div className="border border-[#F0ECE4] bg-white p-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#96A4C1]">
            Total recebido
          </p>
          <div
            className="mt-3 text-[24px] text-[#111111]"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            {fmtCurrency(summary.totalReceived)}
          </div>
        </div>

        <div className="border border-[#F0ECE4] bg-white p-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#96A4C1]">
            Total pendente
          </p>
          <div
            className="mt-3 text-[24px] text-[#111111]"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            {fmtCurrency(summary.totalPending)}
          </div>
        </div>

        <div className="border border-[#F0ECE4] bg-white p-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#96A4C1]">
            Receita clínica
          </p>
          <div
            className="mt-3 text-[24px] text-[#C8A35F]"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            {fmtCurrency(summary.clinicRevenue)}
          </div>
        </div>

        <div className="border border-[#F0ECE4] bg-white p-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#96A4C1]">
            Receita profissional
          </p>
          <div
            className="mt-3 text-[24px] text-[#111111]"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            {fmtCurrency(summary.professionalRevenue)}
          </div>
        </div>

        <div className="border border-[#F0ECE4] bg-white p-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#96A4C1]">
            Despesas
          </p>
          <div
            className="mt-3 text-[24px] text-rose-500"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            {fmtCurrency(summary.totalExpense)}
          </div>
        </div>

        <div className="border border-[#F0ECE4] bg-white p-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#96A4C1]">
            Caixa total
          </p>
          <div
            className="mt-3 text-[24px] text-[#111111]"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            {fmtCurrency(summary.cashBalance)}
          </div>
        </div>
      </div>

      <CloseSaleAutomationCard patients={patients} onSuccess={loadTransactions} />

      <div className="mt-7 overflow-hidden border border-[#F0ECE4] bg-white">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-[#EEF1F5]">
              <th className="px-8 py-5 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-[#96A4C1]">
                Data
              </th>
              <th className="px-8 py-5 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-[#96A4C1]">
                Descrição
              </th>
              <th className="px-8 py-5 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-[#96A4C1]">
                Categoria
              </th>
              <th className="px-8 py-5 text-right text-[11px] font-semibold uppercase tracking-[0.24em] text-[#96A4C1]">
                Recebido
              </th>
              <th className="px-8 py-5 text-right text-[11px] font-semibold uppercase tracking-[0.24em] text-[#96A4C1]">
                Pendente
              </th>
              <th className="px-8 py-5 text-right text-[11px] font-semibold uppercase tracking-[0.24em] text-[#96A4C1]">
                Clínica
              </th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-8 py-8 text-sm text-[#64748B]">
                  Carregando...
                </td>
              </tr>
            ) : filteredItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-8 py-8 text-sm text-[#64748B]">
                  {search
                    ? "Nenhuma transação encontrada para a busca."
                    : "Nenhuma transação encontrada."}
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                <tr key={item.id} className="border-b border-[#EEF1F5] last:border-b-0">
                  <td className="px-8 py-5 text-[14px] font-semibold text-[#8E9AAF]">
                    {fmtDate(item.date)}
                  </td>

                  <td
                    className="px-8 py-5 text-[17px] text-[#111111]"
                    style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                  >
                    {item.description}
                  </td>

                  <td className="px-8 py-5">
                    <span className={categoryBadge(item.category)}>
                      {item.category}
                    </span>
                  </td>

                  <td className="px-8 py-5 text-right">
                    <div
                      className="text-[16px] text-[#111111]"
                      style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                    >
                      {fmtCurrency(item.receivedAmount ?? item.amount ?? 0)}
                    </div>
                  </td>

                  <td className="px-8 py-5 text-right">
                    <div
                      className="text-[16px] text-[#111111]"
                      style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                    >
                      {fmtCurrency(item.pendingAmount ?? 0)}
                    </div>
                  </td>

                  <td className="px-8 py-5 text-right">
                    <div
                      className="text-[16px] text-[#C8A35F]"
                      style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                    >
                      {fmtCurrency(item.clinicCommissionValue ?? 0)}
                    </div>

                    <div className="mt-2 flex justify-end gap-4">
                      <button
                        type="button"
                        onClick={() => handleEdit(item)}
                        className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#96A4C1] hover:text-[#111111]"
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#C8A35F] hover:opacity-70"
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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