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
type TransactionStatus = "PENDING" | "PAID" | "CANCELED" | "COMPLETED";

type AttachmentFile = {
  name: string;
  type: string;
  size: number;
  dataUrl: string;
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

const statusOptions: TransactionStatus[] = ["PENDING", "PAID", "CANCELED"];
const fmtCurrency = (v: number) => (v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const todayInputDate = () => new Date().toISOString().slice(0, 10);
const monthStartInputDate = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
};

const uniqueOptions = (options: readonly string[]) => Array.from(new Set(options));
const financialCategoryFilterOptions = uniqueOptions(["", ...incomeCategories, ...expenseCategories]);

export default function FinancePage() {
  const [stats, setStats] = useState<any>(null);
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
      const [statsRes, patientsRes] = await Promise.all([
        fetch("/api/finance/stats"),
        fetch("/api/patients?includeInactive=true"),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (patientsRes.ok) setPatients(await patientsRes.json());
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
            <Plus size={15} /> Nova transação
          </button>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <FinanceCard label="Gastos do mês" value={stats?.expense} />
        <FinanceCard label="Meta mensal" value={stats?.monthlyGoal} />
        <FinanceCard label="Meta atingida" value={`${stats?.goalPercentage || 0}%`} isText />
        <FinanceCard label="Lucro líquido" value={stats?.netProfit} accent={stats?.netProfit >= 0 ? "success" : "danger"} />
        <FinanceCard label="Saldo disponível" value={stats?.totalBalance} accent="primary" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_.8fr]">
        <div className="premium-card p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="micro-label">Fechamento do mês</p>
              <h2 className="mt-2 text-3xl">Resumo automático</h2>
            </div>
            <div className="h-16 w-16 rounded-full border border-[rgba(90,31,43,.12)] bg-brand-background p-1">
              <div className="flex h-full w-full items-center justify-center rounded-full bg-brand-primary text-[12px] font-bold text-brand-background">
                {stats?.goalPercentage || 0}%
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
    description: string;
    amount: string;
    type: TransactionType;
    category: string;
    date: string;
    paymentMethod: string;
    status: TransactionStatus;
    patientId: string;
    notes: string;
  }>({
    description: "",
    amount: "",
    type: "INCOME",
    category: incomeCategories[0],
    date: new Date().toISOString().slice(0, 16),
    paymentMethod: paymentMethods[0],
    status: "PENDING",
    patientId: "",
    notes: "",
  });
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const categories = form.type === "INCOME" ? incomeCategories : expenseCategories;

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
    await fetch("/api/financial-transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        amount: parseFloat(form.amount),
        date: new Date(form.date).toISOString(),
        patientId: form.patientId || null,
        notes: form.notes || null,
        attachmentsJson: attachments,
      }),
    });
    onSave();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-primary-dark/35 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[30px] border border-[rgba(90,31,43,.14)] bg-brand-surface p-6 shadow-[0_28px_90px_rgba(63,22,32,.22)] animate-soft-in sm:p-8">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="micro-label">Lançamento financeiro</p>
            <h3 className="text-4xl">Nova transação</h3>
          </div>
          <button onClick={onClose} className="rounded-full border border-[rgba(90,31,43,.12)] p-2.5 text-brand-text/55 transition hover:bg-[rgba(90,31,43,.08)] hover:text-brand-primary" aria-label="Fechar modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Descrição" value={form.description} onChange={(v: string) => setForm({ ...form, description: v })} required />
            <Field label="Valor" type="number" value={form.amount} onChange={(v: string) => setForm({ ...form, amount: v })} required />
            <SelectField label="Tipo" value={form.type} onChange={(v: string) => setForm({ ...form, type: v as TransactionType, category: (v === "INCOME" ? incomeCategories[0] : expenseCategories[0]) })} options={["INCOME", "EXPENSE"]} labels={{ INCOME: "Entrada", EXPENSE: "Saída" }} />
            <SelectField label="Categoria" value={form.category} onChange={(v: string) => setForm({ ...form, category: v })} options={categories as unknown as string[]} />
            <Field label="Data" type="datetime-local" value={form.date} onChange={(v: string) => setForm({ ...form, date: v })} required />
            <SelectField label="Forma de pagamento" value={form.paymentMethod} onChange={(v: string) => setForm({ ...form, paymentMethod: v })} options={paymentMethods as unknown as string[]} />
            <SelectField label="Status" value={form.status} onChange={(v: string) => setForm({ ...form, status: v as TransactionStatus })} options={statusOptions} labels={{ PENDING: "Pendente", PAID: "Pago", CANCELED: "Cancelado" }} />
            <SelectField label="Paciente" value={form.patientId} onChange={(v: string) => setForm({ ...form, patientId: v })} options={["", ...patients.map((p: any) => p.id)]} labels={patients.reduce((acc: any, p: any) => ({ ...acc, [p.id]: p.name }), { "": "Sem paciente vinculado" })} />
          </div>

          <label className="block">
            <span>Observações</span>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="min-h-28 w-full border p-4 text-sm" placeholder="Informações internas, parcelamento, comissão, taxa da maquininha..." />
          </label>

          <div className="rounded-3xl border border-dashed border-[rgba(90,31,43,.20)] bg-brand-background/70 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="micro-label mb-1">Anexos</p>
                <p className="text-[13px] text-brand-text/62">PDF, PNG, JPEG, WEBP, DOC e DOCX.</p>
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

          <div className="flex flex-col-reverse gap-3 border-t border-[rgba(90,31,43,.10)] pt-5 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary">Salvar transação</button>
          </div>
        </form>
      </div>
    </div>
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
