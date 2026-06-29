"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Download,
  Eye,
  Filter,
  Paperclip,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import {
  expenseCategories,
  financialStatusLabels,
  incomeCategories,
  paymentMethods,
} from "@/lib/brand";

type TransactionType = "INCOME" | "EXPENSE";
type TransactionStatus = "PENDING" | "PARTIAL" | "PAID" | "CANCELED" | "COMPLETED";

type AttachmentFile = {
  name: string;
  type: string;
  size: number;
  dataUrl: string;
};

type InventoryOption = {
  id: string;
  product: string;
  batch?: string | null;
  linkedProcedure?: string | null;
  quantity?: number;
  unitValue?: number;
  applicationMaterialsValue?: number | null;
};

type AppointmentOption = {
  id: string;
  date: string;
  patientId: string;
  patient?: { id: string; name: string; phone?: string | null } | null;
  procedureName?: string | null;
  price?: number | null;
};


type ContractOption = {
  id: string;
  createdAt: string;
  patientId: string;
  patient?: { id: string; name: string; phone?: string | null } | null;
  title?: string | null;
  content?: string | null;
  total?: number | null;
  status?: string | null;
  itemsJson?: Array<{
    description?: string | null;
    productName?: string | null;
    quantity?: number;
    unitPrice?: number;
    total?: number;
    totalPrice?: number;
    observation?: string | null;
  }> | Record<string, unknown> | null;
};


type FinancialTransaction = {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  paymentMethod?: string | null;
  notes?: string | null;
  patientId?: string | null;
  patient?: { id: string; name: string; phone?: string | null } | null;
  attachmentsJson?: AttachmentFile[] | null;
  paidAt?: string | null;
  canceledAt?: string | null;
};

const statusOptions: TransactionStatus[] = ["PAID", "PARTIAL", "PENDING", "CANCELED"];
const fmtCurrency = (v: number) => (v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const todayInputDate = () => new Date().toISOString().slice(0, 10);
const monthStartInputDate = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
};

const uniqueOptions = (options: readonly string[]) => Array.from(new Set(options));
const financialCategoryFilterOptions = uniqueOptions(["", "Procedimento", ...incomeCategories, ...expenseCategories]);

const FINANCE_PROCEDURE_CATEGORY = "Procedimento";

const formatDateLabel = (value?: string | null) => {
  if (!value) return "Sem data";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sem data";
  return date.toLocaleDateString("pt-BR");
};

const toDatetimeLocal = (value?: string | Date | null) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 16);

  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const paymentMethodLabel = (value?: string | null) => {
  const labels: Record<string, string> = {
    CREDIT_CARD: "Cartão de crédito",
    DEBIT_CARD: "Cartão de débito",
    PIX: "Pix",
    CASH: "Dinheiro",
    BANK_SLIP: "Boleto",
    BANK_TRANSFER: "Transferência",
  };
  return labels[value || ""] || value || "Não informado";
};

function normalizePaymentMethod(value?: string | null) {
  const text = String(value || "").toLowerCase();

  if (text.includes("pix")) return "Pix";
  if (text.includes("dinheiro")) return "Dinheiro";
  if (text.includes("crédito") || text.includes("credito") || text.includes("credit")) return "Cartão de crédito";
  if (text.includes("débito") || text.includes("debito") || text.includes("debit")) return "Cartão de débito";
  if (text.includes("transfer")) return "Transferência";
  if (text.includes("boleto")) return "Boleto";

  return value || "Pix";
}

function extractPaymentMethodFromContract(content?: string | null) {
  const text = String(content || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  const match = text.match(/Forma de pagamento:\s*([^\.]+?)(?:Detalhes:|$)/i);
  return normalizePaymentMethod(match?.[1]?.trim());
}

function extractInstallmentsFromContract(content?: string | null) {
  const text = String(content || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  const parcelMatch = text.match(/(\d+)\s*x/i) || text.match(/(\d+)\s*parcelas?/i);
  return parcelMatch?.[1] || "1";
}

function getContractItems(contract?: ContractOption | null) {
  const items = contract?.itemsJson;
  if (Array.isArray(items)) return items;

  return [];
}

function getContractProcedureName(contract?: ContractOption | null) {
  const items = getContractItems(contract);
  if (items.length > 0) {
    return items
      .map((item) => item.description || item.productName)
      .filter(Boolean)
      .join(" + ");
  }

  return contract?.title || "Procedimento contratado";
}


function buildFinanceNotes(data: {
  saleDate: string;
  procedureDate: string;
  patientName: string;
  procedureSold: string;
  fullSaleValue: string;
  paymentMethod: string;
  installments: string;
  bankValue: string;
  productName: string;
  batch: string;
  productCost: number;
  applicationMaterialsValue: number;
  roomValue: number;
  fixedCost: number;
  secretaryCommission: number;
  taxAmount: number;
  totalCost: number;
  netProfit: number;
  reinvestmentProfit: number;
  personalProfit: number;
  status: TransactionStatus;
  notes: string;
}) {
  return [
    "Resumo do lançamento financeiro:",
    `1. Data da venda: ${formatDateLabel(data.saleDate)}`,
    `2. Data do procedimento: ${formatDateLabel(data.procedureDate)}`,
    `3. Paciente: ${data.patientName || "Não informado"}`,
    `4. Procedimento vendido: ${data.procedureSold || "Não informado"}`,
    `5. Valor cheio da venda: ${fmtCurrency(Number(data.fullSaleValue || 0))}`,
    `6. Forma de pagamento: ${paymentMethodLabel(data.paymentMethod)}`,
    `7. Parcelas: ${data.installments || "1"}`,
    `8. Valor que entrou no banco: ${fmtCurrency(Number(data.bankValue || 0))}`,
    `9. Produto utilizado: ${data.productName || "Não informado"}`,
    `10. Lote: ${data.batch || "Não informado"}`,
    `11. Custo do produto: ${fmtCurrency(data.productCost)}`,
    `12. Materiais de aplicação: ${fmtCurrency(data.applicationMaterialsValue)}`,
    `13. Valor da sala: ${fmtCurrency(data.roomValue)}`,
    `14. Custo fixo proporcional: ${fmtCurrency(data.fixedCost)}`,
    `15. Comissão da secretária 5%: ${fmtCurrency(data.secretaryCommission)}`,
    `16. Imposto 6%: ${fmtCurrency(data.taxAmount)}`,
    `17. Custo total: ${fmtCurrency(data.totalCost)}`,
    `18. Lucro líquido: ${fmtCurrency(data.netProfit)}`,
    `19. Lucro para reinvestimento: ${fmtCurrency(data.reinvestmentProfit)}`,
    `20. Lucro pessoal esperado: ${fmtCurrency(data.personalProfit)}`,
    `21. Status financeiro: ${financialStatusLabels[data.status] || data.status}`,
    `22. Observação: ${data.notes || "Sem observações"}`,
  ].join("\\n");
}

export default function FinancePage() {
  const [stats, setStats] = useState<any>(null);
  const [goal, setGoal] = useState<any>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [filters, setFilters] = useState({
    startDate: monthStartInputDate(),
    endDate: todayInputDate(),
    category: "",
    type: "",
    patientId: "",
    paymentMethod: "",
    minValue: "",
    maxValue: "",
    status: "",
  });

  async function loadFinance() {
    try {
      setLoading(true);
      const [statsRes, patientsRes, goalRes] = await Promise.all([
        fetch("/api/finance/stats"),
        fetch("/api/patients?includeInactive=true"),
        fetch("/api/goals"),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (patientsRes.ok) setPatients(await patientsRes.json());
      if (goalRes.ok) setGoal(await goalRes.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFinance();
  }, []);

  const filteredMovements = useMemo(() => {
    const movements: FinancialTransaction[] = stats?.recentMovements || [];
    const term = search.trim().toLowerCase();

    return movements.filter((t) => {
      const date = new Date(t.date);
      const start = filters.startDate ? new Date(`${filters.startDate}T00:00:00`) : null;
      const end = filters.endDate ? new Date(`${filters.endDate}T23:59:59`) : null;
      const minValue = filters.minValue ? Number(filters.minValue) : null;
      const maxValue = filters.maxValue ? Number(filters.maxValue) : null;
      const normalizedStatus = t.status === "COMPLETED" ? "PAID" : t.status;

      const matchesTerm = !term || [t.description, t.category, t.patient?.name, t.paymentMethod]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));

      return (
        matchesTerm &&
        (!start || date >= start) &&
        (!end || date <= end) &&
        (!filters.category || t.category === filters.category) &&
        (!filters.type || t.type === filters.type) &&
        (!filters.patientId || t.patientId === filters.patientId) &&
        (!filters.paymentMethod || t.paymentMethod === filters.paymentMethod) &&
        (!filters.status || normalizedStatus === filters.status) &&
        (minValue === null || t.amount >= minValue) &&
        (maxValue === null || t.amount <= maxValue)
      );
    });
  }, [stats, search, filters]);

  const exportRows = filteredMovements.map((t) => ({
    Data: new Date(t.date).toLocaleDateString("pt-BR"),
    Descrição: t.description,
    Paciente: t.patient?.name || "",
    Categoria: t.category,
    Tipo: t.type === "INCOME" ? "Entrada" : "Saída",
    Status: financialStatusLabels[t.status] || t.status,
    Forma: t.paymentMethod || "",
    Valor: t.amount,
  }));

  function downloadBlob(content: string, filename: string, type: string) {
    const blob = new Blob([content], { type });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function exportCsv() {
    const headers = Object.keys(exportRows[0] || { Data: "", Descrição: "", Paciente: "", Categoria: "", Tipo: "", Status: "", Forma: "", Valor: "" });
    const rows = exportRows.map((row: any) => headers.map((h) => `"${String(row[h] ?? "").replace(/"/g, '""')}"`).join(";"));
    downloadBlob([headers.join(";"), ...rows].join("\n"), `financeiro_mariana_${Date.now()}.csv`, "text/csv;charset=utf-8;");
  }

  function exportExcel() {
    const headers = Object.keys(exportRows[0] || { Data: "", Descrição: "", Paciente: "", Categoria: "", Tipo: "", Status: "", Forma: "", Valor: "" });
    const html = `<table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${exportRows
      .map((row: any) => `<tr>${headers.map((h) => `<td>${row[h] ?? ""}</td>`).join("")}</tr>`)
      .join("")}</tbody></table>`;
    downloadBlob(html, `financeiro_mariana_${Date.now()}.xls`, "application/vnd.ms-excel;charset=utf-8;");
  }

  function exportPdf() {
    const headers = Object.keys(exportRows[0] || { Data: "", Descrição: "", Paciente: "", Categoria: "", Tipo: "", Status: "", Forma: "", Valor: "" });
    const html = `
      <html><head><title>Financeiro Mariana Thomaz Carmona</title>
      <style>body{font-family:Arial,sans-serif;color:#1E1A18;background:#F7F2EA;padding:32px}h1{font-family:Georgia,serif;color:#5A1F2B}table{width:100%;border-collapse:collapse;background:#FBF8F2}th,td{border:1px solid rgba(90,31,43,.18);padding:10px;font-size:12px;text-align:left}th{color:#5A1F2B;text-transform:uppercase;font-size:10px}</style>
      </head><body><h1>Financeiro Mariana Thomaz Carmona</h1><p>Exportação dos filtros aplicados.</p><table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${exportRows
      .map((row: any) => `<tr>${headers.map((h) => `<td>${row[h] ?? ""}</td>`).join("")}</tr>`)
      .join("")}</tbody></table><script>window.print()</script></body></html>`;
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
    }
  }

  async function updateStatus(id: string, status: TransactionStatus) {
    await fetch(`/api/financial-transactions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    loadFinance();
  }

  async function handleDeleteTransaction(id: string) {
    const confirmDelete = window.confirm("Tem certeza que deseja excluir esta transação? Essa ação será registrada no histórico financeiro.");
    if (!confirmDelete) return;
    await fetch(`/api/financial-transactions/${id}`, { method: "DELETE" });
    loadFinance();
  }

  const activeRevenueGoal = Number(goal?.revenueGoal || stats?.monthlyGoal || 0);
  const activeGoalStart = goal?.startDate ? new Date(goal.startDate).toLocaleDateString("pt-BR") : "início do mês";
  const activeGoalEnd = goal?.endDate ? new Date(goal.endDate).toLocaleDateString("pt-BR") : "fim do mês";
  const activeGoalPercent = activeRevenueGoal ? Math.min(100, Math.round((Number(stats?.grossIncome || stats?.income || 0) / activeRevenueGoal) * 100)) : 0;
  const activeGoalRemaining = Math.max(0, activeRevenueGoal - Number(stats?.grossIncome || stats?.income || 0));
  const activeGoalDaysLeft = goal?.endDate ? Math.max(0, Math.ceil((new Date(goal.endDate).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)) / 86400000)) : 0;

  if (loading) {
    return <div className="min-h-screen p-10 font-serif text-2xl italic text-brand-primary">Sincronizando inteligência financeira...</div>;
  }

  return (
    <div className="min-h-screen px-2 py-3 font-sans text-brand-text sm:px-4 lg:px-6">
      <div className="flex flex-col gap-6 border-b border-[rgba(90,31,43,.12)] pb-8 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="micro-label text-brand-primary/70">Gestão financeira da clínica</p>
          <h1 className="page-title mt-2">Financeiro</h1>
          <p className="mt-3 max-w-2xl text-[14px] leading-6 text-brand-text/64">
            Fechamento automático do mês, filtros reais, status financeiro e exportações para conferência de caixa.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex h-12 min-w-70 items-center gap-3 rounded-full border border-[rgba(90,31,43,.12)] bg-brand-surface px-4 shadow-card transition focus-within:border-brand-primary/40">
            <Search size={16} className="text-brand-primary/55" />
            <input
              placeholder="Buscar transação, paciente ou categoria"
              className="h-full w-full border-0 bg-transparent text-[12px] font-semibold outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button onClick={() => setShowFilters((v) => !v)} className="btn-secondary h-12">
            <Filter size={15} /> Filtros
          </button>
          <button onClick={() => setIsModalOpen(true)} className="btn-primary h-12">
            <Plus size={15} /> Lançar venda/custos
          </button>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <FinanceCard label="Gastos do mês" value={stats?.expense} />
        <FinanceCard label="Meta ativa" value={activeRevenueGoal} />
        <FinanceCard label="Meta atingida" value={`${activeGoalPercent}%`} isText />
        <FinanceCard label="Lucro líquido" value={stats?.netProfit} accent={stats?.netProfit >= 0 ? "success" : "danger"} />
        <FinanceCard label="Saldo disponível" value={stats?.totalBalance} accent="primary" />
      </div>

      <section className="premium-card mt-6 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="micro-label text-brand-primary/70">Insight da meta ativa</p>
            <h2 className="mt-2 text-2xl">De {activeGoalStart} até {activeGoalEnd}</h2>
            <p className="mt-2 text-[13px] leading-6 text-brand-text/62">
              Falta <strong>{fmtCurrency(activeGoalRemaining)}</strong> para bater a meta. {activeGoalDaysLeft > 0 ? `Restam ${activeGoalDaysLeft} dia(s) no período.` : "O período configurado já chegou ao fim."}
            </p>
          </div>
          <div className="min-w-[220px]">
            <div className="h-3 overflow-hidden rounded-full bg-brand-background-secondary/45">
              <div className="h-full rounded-full bg-brand-primary" style={{ width: `${activeGoalPercent}%` }} />
            </div>
            <p className="mt-2 text-right text-[12px] font-bold text-brand-primary">{activeGoalPercent}% concluído</p>
          </div>
        </div>
      </section>

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_.8fr]">
        <div className="premium-card p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="micro-label">Fechamento do mês</p>
              <h2 className="mt-2 text-3xl">Resumo automático</h2>
            </div>
            <div className="h-16 w-16 rounded-full border border-[rgba(90,31,43,.12)] bg-brand-background p-1">
              <div className="flex h-full w-full items-center justify-center rounded-full bg-brand-primary text-[12px] font-bold text-brand-background">
                {activeGoalPercent}%
              </div>
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-4">
            <MiniMetric label="Receitas" value={fmtCurrency(stats?.income)} />
            <MiniMetric label="Despesas" value={fmtCurrency(stats?.expense)} />
            <MiniMetric label="Ticket médio" value={fmtCurrency(stats?.averageTicket)} />
            <MiniMetric label="Mais vendido" value={stats?.topProcedure || "—"} />
          </div>
        </div>

        <div className="premium-card p-6">
          <p className="micro-label">Origem dos pacientes</p>
          <h2 className="mt-2 text-3xl">Evolução mensal</h2>
          <div className="mt-5 space-y-3">
            {Object.entries(stats?.patientOrigins || {}).length === 0 ? (
              <p className="text-[13px] text-brand-text/55">Nenhum novo paciente com origem cadastrada neste mês.</p>
            ) : (
              Object.entries(stats.patientOrigins).map(([source, count]: any) => (
                <div key={source}>
                  <div className="flex justify-between text-[12px] font-semibold text-brand-text/70">
                    <span>{source}</span><span>{count}</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-brand-background-secondary/45">
                    <div className="h-full rounded-full bg-brand-primary" style={{ width: `${Math.min(100, Number(count) * 18)}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showFilters && (
        <section className="premium-card mt-6 p-5 animate-soft-in">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <FilterInput label="Período inicial" type="date" value={filters.startDate} onChange={(v) => setFilters({ ...filters, startDate: v })} />
            <FilterInput label="Período final" type="date" value={filters.endDate} onChange={(v) => setFilters({ ...filters, endDate: v })} />
            <FilterSelect label="Tipo" value={filters.type} onChange={(v) => setFilters({ ...filters, type: v })} options={["", "INCOME", "EXPENSE"]} labels={{ "": "Todos", INCOME: "Entrada", EXPENSE: "Saída" }} />
            <FilterSelect label="Status" value={filters.status} onChange={(v) => setFilters({ ...filters, status: v })} options={["", ...statusOptions]} labels={{ "": "Todos", PENDING: "Pendente", PAID: "Pago", CANCELED: "Cancelado" }} />
            <FilterSelect label="Categoria" value={filters.category} onChange={(v) => setFilters({ ...filters, category: v })} options={financialCategoryFilterOptions} labels={{ "": "Todas" }} />
            <FilterSelect label="Paciente" value={filters.patientId} onChange={(v) => setFilters({ ...filters, patientId: v })} options={["", ...patients.map((p) => p.id)]} labels={patients.reduce((acc, p) => ({ ...acc, [p.id]: p.name }), { "": "Todos" } as Record<string, string>)} />
            <FilterSelect label="Forma de pagamento" value={filters.paymentMethod} onChange={(v) => setFilters({ ...filters, paymentMethod: v })} options={["", ...paymentMethods]} labels={{ "": "Todas" }} />
            <div className="grid grid-cols-2 gap-3">
              <FilterInput label="Valor mín." type="number" value={filters.minValue} onChange={(v) => setFilters({ ...filters, minValue: v })} />
              <FilterInput label="Valor máx." type="number" value={filters.maxValue} onChange={(v) => setFilters({ ...filters, maxValue: v })} />
            </div>
          </div>
        </section>
      )}

      <section className="premium-card mt-8 overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-[rgba(90,31,43,.10)] px-5 py-5 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div>
            <p className="micro-label mb-1">Movimentações</p>
            <h3 className="text-2xl">{filteredMovements.length} lançamento(s)</h3>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={exportCsv} className="btn-secondary py-3"><Download size={14} /> CSV</button>
            <button onClick={exportExcel} className="btn-secondary py-3"><Download size={14} /> Excel</button>
            <button onClick={exportPdf} className="btn-secondary py-3"><Download size={14} /> PDF</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left">
            <thead>
              <tr className="border-b border-[rgba(90,31,43,.10)] bg-brand-surface-muted/45">
                {["Data", "Descrição", "Categoria", "Paciente", "Valor", "Status", "Ações"].map((h) => (
                  <th key={h} className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-brand-text/55 last:text-right">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(90,31,43,.08)]">
              {filteredMovements.map((t) => (
                <TransactionRow key={t.id} t={t} onDelete={handleDeleteTransaction} onStatus={updateStatus} />
              ))}
              {filteredMovements.length === 0 && (
                <tr><td colSpan={7} className="px-8 py-14 text-center text-sm text-brand-text/55">Nenhuma movimentação encontrada para os filtros aplicados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {isModalOpen && <NewTransactionModal patients={patients} onClose={() => setIsModalOpen(false)} onSave={loadFinance} />}
    </div>
  );
}

function NewTransactionModal({ onClose, onSave, patients }: any) {
  const [form, setForm] = useState<{
    contractId: string;
    appointmentId: string;
    saleDate: string;
    procedureDate: string;
    patientId: string;
    procedureSold: string;
    fullSaleValue: string;
    paymentMethod: string;
    installments: string;
    bankValue: string;
    inventoryItemIds: string[];
    productName: string;
    batch: string;
    roomValue: string;
    fixedCost: string;
    status: TransactionStatus;
    notes: string;
  }>({
    contractId: "",
    appointmentId: "",
    saleDate: toDatetimeLocal(new Date()),
    procedureDate: "",
    patientId: "",
    procedureSold: "",
    fullSaleValue: "",
    paymentMethod: paymentMethods[0],
    installments: "1",
    bankValue: "",
    inventoryItemIds: [],
    productName: "",
    batch: "",
    roomValue: "0",
    fixedCost: "0",
    status: "PAID",
    notes: "",
  });

  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryOption[]>([]);
  const [appointments, setAppointments] = useState<AppointmentOption[]>([]);
  const [contracts, setContracts] = useState<ContractOption[]>([]);

  const selectedPatient = patients.find((patient: any) => patient.id === form.patientId);
  const selectedInventoryItems = inventoryItems.filter((item) => form.inventoryItemIds.includes(item.id));
  const selectedProductsName = selectedInventoryItems.map((item) => item.product).filter(Boolean).join(" + ");
  const selectedBatches = selectedInventoryItems.map((item) => item.batch).filter(Boolean).join(" + ");

  const fullSaleValue = Number(form.fullSaleValue || 0);
  const bankValue = Number(form.bankValue || 0);
  const productCost = selectedInventoryItems.reduce((sum, item) => sum + Number(item.unitValue || 0), 0);
  const applicationMaterialsValue = selectedInventoryItems.reduce((sum, item) => sum + Number(item.applicationMaterialsValue || 0), 0);
  const roomValue = Number(form.roomValue || 0);
  const fixedCost = Number(form.fixedCost || 0);
  const secretaryCommission = bankValue * 0.05;
  const taxAmount = bankValue * 0.06;
  const totalCost = productCost + applicationMaterialsValue + roomValue + fixedCost + secretaryCommission + taxAmount;
  const netProfit = bankValue - totalCost;
  const reinvestmentProfit = Math.max(0, netProfit) * 0.5;
  const personalProfit = Math.max(0, netProfit) * 0.5;

  useEffect(() => {
    async function loadOptions() {
      const [inventoryRes, appointmentsRes, contractsRes] = await Promise.all([
        fetch("/api/inventory-items"),
        fetch("/api/appointments"),
        fetch("/api/patient-contracts"),
      ]);

      if (inventoryRes.ok) setInventoryItems(await inventoryRes.json());
      if (appointmentsRes.ok) setAppointments(await appointmentsRes.json());
      if (contractsRes.ok) setContracts(await contractsRes.json());
    }

    loadOptions();
  }, []);

  function applyContract(contractId: string) {
    const contract = contracts.find((item) => item.id === contractId);

    if (!contract) {
      setForm((prev) => ({ ...prev, contractId }));
      return;
    }

    const procedureName = getContractProcedureName(contract);
    const fullValue = Number(contract.total || 0);
    const paymentMethod = extractPaymentMethodFromContract(contract.content);
    const installments = extractInstallmentsFromContract(contract.content);

    setForm((prev) => ({
      ...prev,
      contractId,
      saleDate: toDatetimeLocal(contract.createdAt),
      patientId: contract.patientId || prev.patientId,
      procedureSold: procedureName || prev.procedureSold,
      fullSaleValue: String(fullValue || ""),
      bankValue: prev.bankValue || String(fullValue || ""),
      paymentMethod,
      installments,
    }));
  }

  function applyAppointment(appointmentId: string) {
    const appointment = appointments.find((item) => item.id === appointmentId);

    if (!appointment) {
      setForm((prev) => ({ ...prev, appointmentId }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      appointmentId,
      procedureDate: toDatetimeLocal(appointment.date),
      patientId: appointment.patientId || prev.patientId,
      procedureSold: appointment.procedureName || prev.procedureSold,
      fullSaleValue: prev.fullSaleValue || String(appointment.price || ""),
      bankValue: prev.bankValue || String(appointment.price || ""),
    }));
  }

  function addInventoryItem(inventoryItemId: string) {
    const item = inventoryItems.find((inventory) => inventory.id === inventoryItemId);
    if (!item) return;

    setForm((prev) => {
      const nextIds = prev.inventoryItemIds.includes(inventoryItemId)
        ? prev.inventoryItemIds
        : [...prev.inventoryItemIds, inventoryItemId];

      const nextItems = inventoryItems.filter((inventory) => nextIds.includes(inventory.id));

      return {
        ...prev,
        inventoryItemIds: nextIds,
        productName: nextItems.map((inventory) => inventory.product).filter(Boolean).join(" + "),
        batch: nextItems.map((inventory) => inventory.batch).filter(Boolean).join(" + "),
        procedureSold: prev.procedureSold || item.linkedProcedure || "",
      };
    });
  }

  function removeInventoryItem(inventoryItemId: string) {
    setForm((prev) => {
      const nextIds = prev.inventoryItemIds.filter((id) => id !== inventoryItemId);
      const nextItems = inventoryItems.filter((inventory) => nextIds.includes(inventory.id));

      return {
        ...prev,
        inventoryItemIds: nextIds,
        productName: nextItems.map((inventory) => inventory.product).filter(Boolean).join(" + "),
        batch: nextItems.map((inventory) => inventory.batch).filter(Boolean).join(" + "),
      };
    });
  }

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    const allowed = ["application/pdf", "image/png", "image/jpeg", "image/webp", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    const readers = Array.from(files).filter((file) => allowed.includes(file.type) || /\.docx?$/i.test(file.name)).map((file) => new Promise<AttachmentFile>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ name: file.name, type: file.type, size: file.size, dataUrl: reader.result as string });
      reader.readAsDataURL(file);
    }));
    const resolvedFiles = await Promise.all(readers);
    setAttachments((prev) => [...prev, ...resolvedFiles]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const patientName = selectedPatient?.name || "";
    const productName = selectedProductsName || form.productName;
    const batch = selectedBatches || form.batch;

    const notes = buildFinanceNotes({
      saleDate: form.saleDate,
      procedureDate: form.procedureDate,
      patientName,
      procedureSold: form.procedureSold,
      fullSaleValue: form.fullSaleValue,
      paymentMethod: form.paymentMethod,
      installments: form.installments,
      bankValue: form.bankValue,
      productName,
      batch,
      productCost,
      applicationMaterialsValue,
      roomValue,
      fixedCost,
      secretaryCommission,
      taxAmount,
      totalCost,
      netProfit,
      reinvestmentProfit,
      personalProfit,
      status: form.status,
      notes: form.notes,
    });

    const res = await fetch("/api/financial-transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: new Date(form.saleDate).toISOString(),
        description: form.procedureSold || "Lançamento financeiro",
        category: FINANCE_PROCEDURE_CATEGORY,
        amount: bankValue,
        grossAmount: fullSaleValue || bankValue,
        feeAmount: totalCost,
        netAmount: netProfit,
        commissionAmount: secretaryCommission,
        type: "INCOME",
        paymentMethod: form.paymentMethod,
        totalInstallments: Math.max(1, Number(form.installments || 1)),
        status: form.status,
        patientId: form.patientId || null,
        notes,
        attachmentsJson: [
          ...attachments,
          {
            name: "dados-lancamento-financeiro.json",
            type: "application/json",
            size: 0,
            dataUrl: `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify({
              contractId: form.contractId || null,
              appointmentId: form.appointmentId || null,
              saleDate: form.saleDate,
              procedureDate: form.procedureDate,
              patientId: form.patientId || null,
              procedureSold: form.procedureSold,
              fullSaleValue,
              paymentMethod: form.paymentMethod,
              installments: Number(form.installments || 1),
              bankValue,
              inventoryItemIds: form.inventoryItemIds,
              productName: productName || null,
              batch: batch || null,
              productCost,
              applicationMaterialsValue,
              roomValue,
              fixedCost,
              secretaryCommission,
              taxAmount,
              totalCost,
              netProfit,
              reinvestmentProfit,
              personalProfit,
              status: form.status,
            }, null, 2))}`,
          },
        ],
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      alert(data?.error?.formErrors?.join?.(", ") || data?.error || "Erro ao salvar fechamento da venda.");
      return;
    }

    onSave();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-primary-dark/35 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-[30px] border border-[rgba(90,31,43,.14)] bg-brand-surface p-6 shadow-[0_28px_90px_rgba(63,22,32,.22)] animate-soft-in sm:p-8">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="micro-label">Contrato + custos da venda</p>
            <h3 className="text-4xl">Fechamento da venda</h3>
            <p className="mt-2 max-w-2xl text-[13px] leading-6 text-brand-text/62">
              Selecione o contrato já gerado, informe o valor que realmente entrou no banco e complete os custos para ver quanto sobra e como dividir o dinheiro.
            </p>
          </div>
          <button onClick={onClose} className="rounded-full border border-[rgba(90,31,43,.12)] p-2.5 text-brand-text/55 transition hover:bg-[rgba(90,31,43,.08)] hover:text-brand-primary" aria-label="Fechar modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-3xl border border-dashed border-[rgba(90,31,43,.18)] bg-brand-background/70 p-5">
            <p className="micro-label mb-3">1. Contrato / lançamento de venda</p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <SelectField
                label="Selecionar contrato lançado *"
                value={form.contractId}
                onChange={applyContract}
                options={["", ...contracts.map((contract) => contract.id)]}
                labels={contracts.reduce((acc: any, contract) => ({
                  ...acc,
                  [contract.id]: `${formatDateLabel(contract.createdAt)} • ${contract.patient?.name || "Paciente"} • ${contract.title || "Contrato"} • ${fmtCurrency(Number(contract.total || 0))}`,
                }), { "": "Selecione o contrato da venda..." })}
              />

              <SelectField
                label="2. Data do procedimento / agenda"
                value={form.appointmentId}
                onChange={applyAppointment}
                options={["", ...appointments.map((appointment) => appointment.id)]}
                labels={appointments.reduce((acc: any, appointment) => ({
                  ...acc,
                  [appointment.id]: `${formatDateLabel(appointment.date)} • ${appointment.patient?.name || "Paciente"} • ${appointment.procedureName || "Procedimento"}`,
                }), { "": "Selecionar agendamento..." })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="1. Data da venda" type="datetime-local" value={form.saleDate} onChange={(v: string) => setForm({ ...form, saleDate: v })} required />
            <Field label="2. Data do procedimento" type="datetime-local" value={form.procedureDate} onChange={(v: string) => setForm({ ...form, procedureDate: v })} />

            <SelectField
              label="3. Paciente"
              value={form.patientId}
              onChange={(v: string) => setForm({ ...form, patientId: v })}
              options={["", ...patients.map((p: any) => p.id)]}
              labels={patients.reduce((acc: any, p: any) => ({ ...acc, [p.id]: p.name }), { "": "Selecionar paciente..." })}
            />

            <Field label="4. Procedimento vendido" value={form.procedureSold} onChange={(v: string) => setForm({ ...form, procedureSold: v })} required />
            <Field label="5. Valor cheio da venda" type="number" value={form.fullSaleValue} onChange={(v: string) => setForm({ ...form, fullSaleValue: v, bankValue: form.bankValue || v })} required />

            <SelectField label="6. Forma de pagamento" value={form.paymentMethod} onChange={(v: string) => setForm({ ...form, paymentMethod: v })} options={paymentMethods as unknown as string[]} labels={paymentMethods.reduce((acc: any, method: string) => ({ ...acc, [method]: paymentMethodLabel(method) }), {})} />

            <Field label="7. Parcelas" type="number" value={form.installments} onChange={(v: string) => setForm({ ...form, installments: v })} required />
            <Field label="8. Valor que entrou de fato no banco" type="number" value={form.bankValue} onChange={(v: string) => setForm({ ...form, bankValue: v })} required />

            <div className="md:col-span-2">
              <SelectField
                label="9. Produtos utilizados no procedimento"
                value=""
                onChange={addInventoryItem}
                options={["", ...inventoryItems.map((item) => item.id)]}
                labels={inventoryItems.reduce((acc: any, item) => ({
                  ...acc,
                  [item.id]: `${item.product}${item.batch ? ` • Lote ${item.batch}` : ""}${item.linkedProcedure ? ` • ${item.linkedProcedure}` : ""} • ${Number(item.quantity || 0) > 0 ? "Disponível" : "Em falta"} • Custo ${fmtCurrency(Number(item.unitValue || 0))}`,
                }), { "": "Adicionar produto disponível ou em falta..." })}
              />

              {selectedInventoryItems.length > 0 && (
                <div className="mt-3 grid gap-2">
                  {selectedInventoryItems.map((item) => (
                    <div key={item.id} className="flex flex-col gap-2 rounded-2xl border border-[rgba(90,31,43,.10)] bg-brand-background/60 px-4 py-3 text-[12px] sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <strong>{item.product}</strong>
                        <span className="text-brand-text/60">
                          {item.batch ? ` • Lote ${item.batch}` : " • Sem lote"}
                          {item.linkedProcedure ? ` • ${item.linkedProcedure}` : ""}
                          {` • ${Number(item.quantity || 0) > 0 ? "Disponível" : "Em falta"}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-brand-primary">
                          {fmtCurrency(Number(item.unitValue || 0) + Number(item.applicationMaterialsValue || 0))}
                        </span>
                        <button type="button" onClick={() => removeInventoryItem(item.id)} className="text-brand-danger underline">
                          Remover
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <ReadOnlyFinanceField label="10. Lotes" value={selectedBatches || "Selecione os produtos utilizados"} />
            <ReadOnlyFinanceField label="11. Custo dos produtos" value={fmtCurrency(productCost)} />
            <ReadOnlyFinanceField label="12. Materiais de aplicação" value={fmtCurrency(applicationMaterialsValue)} />

            <Field label="13. Valor da sala" type="number" value={form.roomValue} onChange={(v: string) => setForm({ ...form, roomValue: v })} />
            <Field label="14. Custo fixo proporcional" type="number" value={form.fixedCost} onChange={(v: string) => setForm({ ...form, fixedCost: v })} />

            <ReadOnlyFinanceField label="15. Comissão da secretária 5%" value={fmtCurrency(secretaryCommission)} />
            <ReadOnlyFinanceField label="16. Imposto 6%" value={fmtCurrency(taxAmount)} />
            <ReadOnlyFinanceField label="17. Custo total" value={fmtCurrency(totalCost)} />
            <ReadOnlyFinanceField label="18. Lucro líquido" value={fmtCurrency(netProfit)} />
            <ReadOnlyFinanceField label="19. Lucro para reinvestimento" value={fmtCurrency(reinvestmentProfit)} />
            <ReadOnlyFinanceField label="20. Lucro pessoal esperado" value={fmtCurrency(personalProfit)} />

            <SelectField
              label="21. Status financeiro"
              value={form.status}
              onChange={(v: string) => setForm({ ...form, status: v as TransactionStatus })}
              options={statusOptions}
              labels={{ PAID: "Pago", PARTIAL: "Parcial", PENDING: "Pendente", CANCELED: "Cancelado" }}
            />
          </div>

          <label className="block">
            <span>22. Observação</span>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="min-h-24 w-full border p-4 text-sm" placeholder="Diferença a receber, desconto, cortesia, taxa, ajuste ou observação de conferência..." />
          </label>

          <div className="rounded-3xl border border-dashed border-[rgba(90,31,43,.20)] bg-brand-background/70 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="micro-label mb-1">Anexos</p>
                <p className="text-[13px] text-brand-text/62">Comprovante, extrato, print da maquininha ou documento de conferência.</p>
              </div>
              <label className="btn-secondary cursor-pointer py-3">
                <Paperclip size={14} /> Selecionar arquivos
                <input type="file" multiple className="hidden" accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx" onChange={(e) => handleFiles(e.target.files)} />
              </label>
            </div>
            {attachments.length > 0 && (
              <div className="mt-4 grid gap-2">
                {attachments.map((file, index) => (
                  <div key={`${file.name}-${index}`} className="flex items-center justify-between rounded-2xl border border-[rgba(90,31,43,.10)] bg-brand-surface px-4 py-3 text-[12px]">
                    <span className="truncate">{file.name}</span>
                    <div className="flex items-center gap-3">
                      <a href={file.dataUrl} target="_blank" className="text-brand-primary underline">Visualizar</a>
                      <a href={file.dataUrl} download={file.name} className="text-brand-primary underline">Download</a>
                      <button type="button" onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== index))} className="text-brand-danger">Excluir</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-[rgba(90,31,43,.14)] bg-[rgba(90,31,43,.08)] p-5">
            <p className="micro-label text-brand-primary">Divisão do dinheiro</p>
            <p className="mt-2 text-[13px] leading-6 text-brand-text/65">
              O sistema calcula quanto sobra depois dos custos e divide automaticamente o lucro líquido em 50% para reinvestimento e 50% como lucro pessoal esperado.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-5">
              <MiniMetric label="Entrou no banco" value={fmtCurrency(bankValue)} />
              <MiniMetric label="Custo total" value={fmtCurrency(totalCost)} />
              <MiniMetric label="Vai sobrar" value={fmtCurrency(netProfit)} />
              <MiniMetric label="Reinvestimento" value={fmtCurrency(reinvestmentProfit)} />
              <MiniMetric label="Pessoal esperado" value={fmtCurrency(personalProfit)} />
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-[rgba(90,31,43,.10)] pt-5 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary">Salvar fechamento da venda</button>
          </div>
        </form>
      </div>
    </div>
  );
}


function ReadOnlyFinanceField({ label, value }: any) {
  return (
    <label className="block">
      <span>{label}</span>
      <input value={value} readOnly className="h-12 w-full border bg-brand-background/60 px-4 text-sm font-semibold text-brand-text/70" />
    </label>
  );
}

function TransactionRow({ t, onDelete, onStatus }: any) {
  const status = t.status === "COMPLETED" ? "PAID" : t.status;
  const attachments = Array.isArray(t.attachmentsJson) ? t.attachmentsJson : [];
  const statusClass = status === "PAID" ? "text-brand-success bg-brand-success/10" : status === "CANCELED" ? "text-brand-danger bg-brand-danger/10" : "text-brand-warning bg-brand-warning/10";

  return (
    <tr className="group transition hover:bg-[rgba(90,31,43,.04)]">
      <td className="px-6 py-5 text-[12px] text-brand-text/60">{new Date(t.date).toLocaleDateString("pt-BR")}</td>
      <td className="px-6 py-5">
        <p className="text-[13px] font-bold text-brand-strong">{t.description}</p>
        <p className="mt-1 text-[10px] uppercase tracking-[0.15em] text-brand-text/45">{t.paymentMethod || "Forma não informada"}</p>
        {attachments.length > 0 && (
          <div className="mt-2 flex gap-2">
            {attachments.map((file: AttachmentFile, index: number) => (
              <a key={`${file.name}-${index}`} href={file.dataUrl} target="_blank" download={file.name} className="inline-flex items-center gap-1 rounded-full bg-brand-background px-2 py-1 text-[10px] text-brand-primary">
                <Paperclip size={10} /> {file.name.slice(0, 18)}
              </a>
            ))}
          </div>
        )}
      </td>
      <td className="px-6 py-5"><span className="rounded-full border border-[rgba(90,31,43,.10)] bg-brand-background px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-brand-primary">{t.category}</span></td>
      <td className="px-6 py-5 text-[12px] text-brand-text/70">{t.patient?.name || "—"}</td>
      <td className={`px-6 py-5 text-right font-serif text-[20px] ${t.type === "EXPENSE" ? "text-brand-danger" : "text-brand-strong"}`}>
        {t.type === "EXPENSE" ? "- " : ""}{fmtCurrency(t.amount)}
      </td>
      <td className="px-6 py-5"><span className={`rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] ${statusClass}`}>{financialStatusLabels[t.status] || t.status}</span></td>
      <td className="px-6 py-5 text-right">
        <div className="flex items-center justify-end gap-2">
          {status !== "PAID" && <IconButton label="Dar baixa" onClick={() => onStatus(t.id, "PAID")}><Check size={15} /></IconButton>}
          {status !== "PENDING" && <IconButton label="Reabrir" onClick={() => onStatus(t.id, "PENDING")}><RotateCcw size={15} /></IconButton>}
          {status !== "CANCELED" && <IconButton label="Cancelar" onClick={() => onStatus(t.id, "CANCELED")}><X size={15} /></IconButton>}
          <IconButton label="Excluir" danger onClick={() => onDelete(t.id)}><Trash2 size={15} /></IconButton>
        </div>
      </td>
    </tr>
  );
}

function IconButton({ children, label, onClick, danger }: any) {
  return <button onClick={onClick} title={label} className={`rounded-full border border-[rgba(90,31,43,.10)] p-2 transition hover:bg-[rgba(90,31,43,.08)] ${danger ? "text-brand-danger" : "text-brand-primary"}`}>{children}</button>;
}

function FinanceCard({ label, value, accent, isText }: any) {
  const color = accent === "success" ? "text-brand-success" : accent === "danger" ? "text-brand-danger" : accent === "primary" ? "text-brand-primary" : "text-brand-strong";
  return (
    <div className="premium-card p-6">
      <p className="micro-label">{label}</p>
      <p className={`mt-5 font-serif text-3xl ${color}`}>{isText ? value : fmtCurrency(Number(value || 0))}</p>
    </div>
  );
}

function MiniMetric({ label, value }: any) {
  return (
    <div className="rounded-3xl border border-[rgba(90,31,43,.10)] bg-brand-background/55 p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-text/50">{label}</p>
      <p className="mt-3 truncate text-[14px] font-semibold text-brand-strong" title={value}>{value}</p>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required = false }: any) {
  return (
    <label className="block">
      <span>{label}</span>
      <input type={type} value={value} required={required} onChange={(e) => onChange(e.target.value)} className="h-12 w-full border px-4 text-sm" />
    </label>
  );
}

function SelectField({ label, value, onChange, options, labels = {} }: any) {
  return (
    <label className="block">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="h-12 w-full border px-4 text-sm">
        {options.map((option: string, index: number) => <option key={`${option || "empty"}-${index}`} value={option}>{labels[option] || option}</option>)}
      </select>
    </label>
  );
}

function FilterInput({ label, value, onChange, type }: any) {
  return <Field label={label} value={value} onChange={onChange} type={type} />;
}

function FilterSelect({ label, value, onChange, options, labels = {} }: any) {
  return <SelectField label={label} value={value} onChange={onChange} options={options} labels={labels} />;
}
