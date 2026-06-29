"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  CloudUpload,
  Edit3,
  RefreshCcw,
  Save,
  ShieldCheck,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";

const fmtCurrency = (v: number) => (v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtNumber = (v: number) => (v || 0).toLocaleString("pt-BR");

function toInputDate(value?: string | Date | null) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10);
  return date.toISOString().slice(0, 10);
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function monthStart() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

function monthEnd() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
}

function inPeriod(value: string, startDate: string, endDate: string) {
  const date = new Date(value);
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T23:59:59`);
  return date >= start && date <= end;
}

function daysLeftUntil(endDate: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(`${endDate}T00:00:00`);
  return Math.max(0, Math.ceil((end.getTime() - today.getTime()) / 86400000));
}

function periodLength(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1);
}

export default function ExecutiveDashboardPage() {
  const [finance, setFinance] = useState<any>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [backups, setBackups] = useState<any[]>([]);
  const [editingGoal, setEditingGoal] = useState(false);
  const [loadingBackup, setLoadingBackup] = useState(false);
  const [savingGoal, setSavingGoal] = useState(false);
  const [goalForm, setGoalForm] = useState({
    month: currentMonth(),
    startDate: monthStart(),
    endDate: monthEnd(),
    revenueGoal: "0",
    patientGoal: "0",
    evaluationGoal: "0",
    conversionGoal: "0",
    averageTicketGoal: "0",
    notes: "",
  });

  async function load() {
    const [financeRes, patientsRes, appointmentsRes, backupsRes, goalRes, transactionsRes] = await Promise.all([
      fetch("/api/finance/stats"),
      fetch("/api/patients?includeInactive=true"),
      fetch("/api/appointments"),
      fetch("/api/backups"),
      fetch(`/api/goals?month=${currentMonth()}`),
      fetch("/api/financial-transactions"),
    ]);

    if (financeRes.ok) setFinance(await financeRes.json());
    if (patientsRes.ok) setPatients(await patientsRes.json());
    if (appointmentsRes.ok) setAppointments(await appointmentsRes.json());
    if (backupsRes.ok) setBackups(await backupsRes.json());
    if (transactionsRes.ok) setTransactions(await transactionsRes.json());

    if (goalRes.ok) {
      const data = await goalRes.json();
      setGoalForm({
        month: data.month || currentMonth(),
        startDate: toInputDate(data.startDate || monthStart()),
        endDate: toInputDate(data.endDate || monthEnd()),
        revenueGoal: String(data.revenueGoal ?? 0),
        patientGoal: String(data.patientGoal ?? 0),
        evaluationGoal: String(data.evaluationGoal ?? 0),
        conversionGoal: String(data.conversionGoal ?? 0),
        averageTicketGoal: String(data.averageTicketGoal ?? 0),
        notes: data.notes || "",
      });
    }
  }

  useEffect(() => {
    load();
  }, []);

  const indicators = useMemo(() => {
    const startDate = goalForm.startDate || monthStart();
    const endDate = goalForm.endDate || monthEnd();

    const periodTransactions = transactions.filter((t) => inPeriod(t.date, startDate, endDate) && ["PAID", "PARTIAL", "COMPLETED"].includes(t.status));
    const incomeTransactions = periodTransactions.filter((t) => t.type === "INCOME");
    const expenseTransactions = periodTransactions.filter((t) => t.type === "EXPENSE");

    const revenue = incomeTransactions.reduce((acc, t) => acc + Number(t.grossAmount ?? t.amount ?? 0), 0);
    const netIncome = incomeTransactions.reduce((acc, t) => acc + Number(t.netAmount ?? t.amount ?? 0), 0);
    const expense = expenseTransactions.reduce((acc, t) => acc + Number(t.amount ?? 0), 0);
    const profit = netIncome - expense;
    const ticket = incomeTransactions.length ? revenue / incomeTransactions.length : 0;

    const periodPatients = patients.filter((p) => inPeriod(p.createdAt, startDate, endDate));
    const periodAppointments = appointments.filter((a) => inPeriod(a.date, startDate, endDate));
    const completed = periodAppointments.filter((a) => a.status === "COMPLETED").length;
    const scheduled = periodAppointments.filter((a) => a.status !== "CANCELED").length;
    const returning = new Set(periodAppointments.map((a) => a.patientId)).size;

    return {
      leads: periodPatients.length,
      conversion: scheduled ? Math.round((completed / scheduled) * 100) : 0,
      returns: returning,
      referrals: periodPatients.filter((p) => p.crmSource === "Indicação").length,
      procedures: completed,
      revenue,
      ticket,
      profit,
      expense,
      periodAppointments,
      incomeTransactions,
    };
  }, [appointments, patients, transactions, goalForm.startDate, goalForm.endDate]);

  const goalProgress = useMemo(() => {
    const revenueGoal = Number(goalForm.revenueGoal || 0);
    const patientGoal = Number(goalForm.patientGoal || 0);
    const evaluationGoal = Number(goalForm.evaluationGoal || 0);
    const conversionGoal = Number(goalForm.conversionGoal || 0);
    const ticketGoal = Number(goalForm.averageTicketGoal || 0);

    const daysLeft = daysLeftUntil(goalForm.endDate);
    const daysTotal = periodLength(goalForm.startDate, goalForm.endDate);
    const revenueRemaining = Math.max(0, revenueGoal - indicators.revenue);
    const patientsRemaining = Math.max(0, patientGoal - indicators.leads);
    const evaluationsRemaining = Math.max(0, evaluationGoal - indicators.periodAppointments.length);
    const dailyRevenueNeeded = daysLeft ? revenueRemaining / daysLeft : revenueRemaining;

    return {
      revenueGoal,
      patientGoal,
      evaluationGoal,
      conversionGoal,
      ticketGoal,
      daysLeft,
      daysTotal,
      revenueRemaining,
      patientsRemaining,
      evaluationsRemaining,
      dailyRevenueNeeded,
      revenuePercent: revenueGoal ? Math.min(100, Math.round((indicators.revenue / revenueGoal) * 100)) : 0,
      patientPercent: patientGoal ? Math.min(100, Math.round((indicators.leads / patientGoal) * 100)) : 0,
      evaluationPercent: evaluationGoal ? Math.min(100, Math.round((indicators.periodAppointments.length / evaluationGoal) * 100)) : 0,
      conversionPercent: conversionGoal ? Math.min(100, Math.round((indicators.conversion / conversionGoal) * 100)) : 0,
      ticketPercent: ticketGoal ? Math.min(100, Math.round((indicators.ticket / ticketGoal) * 100)) : 0,
    };
  }, [goalForm, indicators]);

  async function saveGoal(e: React.FormEvent) {
    e.preventDefault();
    setSavingGoal(true);

    const payload = {
      month: goalForm.startDate?.slice(0, 7) || currentMonth(),
      startDate: goalForm.startDate,
      endDate: goalForm.endDate,
      revenueGoal: Number(goalForm.revenueGoal || 0),
      patientGoal: Number(goalForm.patientGoal || 0),
      evaluationGoal: Number(goalForm.evaluationGoal || 0),
      conversionGoal: Number(goalForm.conversionGoal || 0),
      averageTicketGoal: Number(goalForm.averageTicketGoal || 0),
      notes: goalForm.notes,
    };

    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const updated = await res.json();
      setEditingGoal(false);
      await load();
    } else {
      alert("Não foi possível salvar as metas.");
    }

    setSavingGoal(false);
  }

  async function runBackup() {
    setLoadingBackup(true);
    await fetch("/api/backups", { method: "POST" });
    setLoadingBackup(false);
    load();
  }

  return (
    <div className="min-h-screen px-2 py-3 font-sans text-brand-text sm:px-4 lg:px-6">
      <header className="flex flex-col gap-6 border-b border-[rgba(90,31,43,.12)] pb-8 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="micro-label text-brand-primary/70">Indicadores gerenciais</p>
          <h1 className="page-title mt-2">Dashboard Executivo</h1>
          <p className="mt-3 max-w-3xl text-[14px] leading-6 text-brand-text/64">
            Metas editáveis por período, acompanhamento do que falta para bater a meta e visão executiva de receita, lucro, pacientes e conversão.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => setEditingGoal((v) => !v)} className="btn-secondary h-12">
            <Edit3 size={15} /> {editingGoal ? "Fechar metas" : "Editar metas"}
          </button>
          <button onClick={load} className="btn-secondary h-12"><RefreshCcw size={15} /> Atualizar</button>
        </div>
      </header>

      <section className="premium-card mt-8 p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="micro-label text-brand-primary/70">Meta ativa</p>
            <h2 className="mt-2 text-3xl">De {new Date(`${goalForm.startDate}T00:00:00`).toLocaleDateString("pt-BR")} até {new Date(`${goalForm.endDate}T00:00:00`).toLocaleDateString("pt-BR")}</h2>
            <p className="mt-2 max-w-3xl text-[13px] leading-6 text-brand-text/62">
              Faltam <strong>{goalProgress.daysLeft} dia(s)</strong> para o fim do período. Para bater a meta de faturamento, ainda faltam <strong>{fmtCurrency(goalProgress.revenueRemaining)}</strong>, equivalente a <strong>{fmtCurrency(goalProgress.dailyRevenueNeeded)}</strong> por dia.
            </p>
          </div>
          <div className="min-w-[220px] rounded-3xl bg-brand-primary/10 p-5 text-right">
            <p className="micro-label text-brand-primary">Meta atingida</p>
            <p className="mt-2 font-serif text-4xl text-brand-primary">{goalProgress.revenuePercent}%</p>
          </div>
        </div>

        <div className="mt-6 h-4 overflow-hidden rounded-full bg-brand-background-secondary/45">
          <div className="h-full rounded-full bg-brand-primary" style={{ width: `${goalProgress.revenuePercent}%` }} />
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          <GoalMini label="Meta" value={fmtCurrency(goalProgress.revenueGoal)} />
          <GoalMini label="Realizado" value={fmtCurrency(indicators.revenue)} />
          <GoalMini label="Falta" value={fmtCurrency(goalProgress.revenueRemaining)} />
          <GoalMini label="Dias restantes" value={goalProgress.daysLeft} />
          <GoalMini label="Média diária necessária" value={fmtCurrency(goalProgress.dailyRevenueNeeded)} />
        </div>

        {editingGoal && (
          <form onSubmit={saveGoal} className="mt-6 rounded-3xl border border-dashed border-[rgba(90,31,43,.18)] bg-brand-background/60 p-5">
            <p className="micro-label mb-4 text-brand-primary">Configurar metas e período</p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <GoalField label="Data inicial" type="date" value={goalForm.startDate} onChange={(v) => setGoalForm({ ...goalForm, startDate: v })} />
              <GoalField label="Data final" type="date" value={goalForm.endDate} onChange={(v) => setGoalForm({ ...goalForm, endDate: v })} />
              <GoalField label="Meta de faturamento" type="number" value={goalForm.revenueGoal} onChange={(v) => setGoalForm({ ...goalForm, revenueGoal: v })} />
              <GoalField label="Meta de pacientes" type="number" value={goalForm.patientGoal} onChange={(v) => setGoalForm({ ...goalForm, patientGoal: v })} />
              <GoalField label="Meta de avaliações" type="number" value={goalForm.evaluationGoal} onChange={(v) => setGoalForm({ ...goalForm, evaluationGoal: v })} />
              <GoalField label="Meta de conversão (%)" type="number" value={goalForm.conversionGoal} onChange={(v) => setGoalForm({ ...goalForm, conversionGoal: v })} />
              <GoalField label="Ticket alvo" type="number" value={goalForm.averageTicketGoal} onChange={(v) => setGoalForm({ ...goalForm, averageTicketGoal: v })} />
              <label className="block xl:col-span-1">
                <span>Observação da meta</span>
                <input value={goalForm.notes} onChange={(e) => setGoalForm({ ...goalForm, notes: e.target.value })} className="h-12 w-full border px-4 text-sm" placeholder="Ex: fase inicial da agenda" />
              </label>
            </div>
            <div className="mt-5 flex justify-end">
              <button disabled={savingGoal} className="btn-primary">
                <Save size={15} /> {savingGoal ? "Salvando..." : "Salvar metas"}
              </button>
            </div>
          </form>
        )}
      </section>

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="Leads" value={indicators.leads} detail={`Faltam ${fmtNumber(goalProgress.patientsRemaining)} para a meta`} progress={goalProgress.patientPercent} icon={<Users size={18} />} />
        <Metric label="Conversão" value={`${indicators.conversion}%`} detail={`Meta ${goalProgress.conversionGoal}%`} progress={goalProgress.conversionPercent} icon={<TrendingUp size={18} />} />
        <Metric label="Ticket médio" value={fmtCurrency(indicators.ticket)} detail={`Ticket alvo ${fmtCurrency(goalProgress.ticketGoal)}`} progress={goalProgress.ticketPercent} icon={<BarChart3 size={18} />} />
        <Metric label="Lucro" value={fmtCurrency(indicators.profit)} detail="Lucro dentro do período da meta" icon={<BarChart3 size={18} />} />
        <Metric label="Retornos" value={indicators.returns} detail="Pacientes com agenda no período" icon={<Users size={18} />} />
        <Metric label="Indicações" value={indicators.referrals} detail="Origem indicação no período" icon={<Users size={18} />} />
        <Metric label="Procedimentos" value={indicators.procedures} detail={`Avaliações/agendas: ${indicators.periodAppointments.length}`} progress={goalProgress.evaluationPercent} icon={<ShieldCheck size={18} />} />
        <Metric label="Receita" value={fmtCurrency(indicators.revenue)} detail={`Faltam ${fmtCurrency(goalProgress.revenueRemaining)}`} progress={goalProgress.revenuePercent} icon={<TrendingUp size={18} />} />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Metric label="Meta de faturamento" value={fmtCurrency(goalProgress.revenueGoal)} icon={<Target size={18} />} />
        <Metric label="Meta de pacientes" value={goalProgress.patientGoal} icon={<Users size={18} />} />
        <Metric label="Meta de avaliações" value={goalProgress.evaluationGoal} icon={<Users size={18} />} />
        <Metric label="Meta de conversão" value={`${goalProgress.conversionGoal}%`} icon={<TrendingUp size={18} />} />
        <Metric label="Ticket alvo" value={fmtCurrency(goalProgress.ticketGoal)} icon={<BarChart3 size={18} />} />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_.9fr]">
        <section className="premium-card p-6">
          <p className="micro-label">Comparação do período</p>
          <h2 className="mt-2 text-3xl">Meta x Receita</h2>
          <div className="mt-8 h-4 overflow-hidden rounded-full bg-brand-background-secondary/45">
            <div className="h-full rounded-full bg-brand-primary" style={{ width: `${goalProgress.revenuePercent}%` }} />
          </div>
          <div className="mt-4 flex justify-between text-[12px] font-semibold text-brand-text/62">
            <span>{fmtCurrency(indicators.revenue)} realizado</span>
            <span>{fmtCurrency(goalProgress.revenueGoal)} meta</span>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <GoalMini label="Custo/despesas" value={fmtCurrency(indicators.expense)} />
            <GoalMini label="Lucro do período" value={fmtCurrency(indicators.profit)} />
            <GoalMini label="Período total" value={`${goalProgress.daysTotal} dias`} />
          </div>
        </section>

        <section className="premium-card p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="micro-label">Backup</p>
              <h2 className="mt-2 text-3xl">Histórico e segurança</h2>
              <p className="mt-3 text-[13px] text-brand-text/62">Backup local manual com registro de histórico. A estrutura já separa o destino para futura sincronização em nuvem.</p>
            </div>
            <button onClick={runBackup} disabled={loadingBackup} className="btn-primary whitespace-nowrap"><CloudUpload size={15} /> {loadingBackup ? "Gerando..." : "Backup"}</button>
          </div>
          <div className="mt-6 space-y-3">
            {backups.length === 0 ? <p className="text-sm text-brand-text/55">Nenhum backup registrado.</p> : backups.slice(0, 5).map((backup) => (
              <div key={backup.id} className="flex items-center justify-between rounded-2xl border border-[rgba(90,31,43,.10)] bg-brand-background/60 px-4 py-3 text-[12px]">
                <span>{new Date(backup.createdAt).toLocaleString("pt-BR")}</span>
                <span className="font-bold text-brand-primary">{backup.target} • {backup.status}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function Metric({ label, value, icon, detail, progress }: any) {
  return (
    <div className="premium-card p-6">
      <div className="flex items-start justify-between">
        <p className="micro-label max-w-[70%]">{label}</p>
        <div className="rounded-2xl bg-brand-primary/10 p-2.5 text-brand-primary">{icon}</div>
      </div>
      <p className="mt-6 font-serif text-4xl text-brand-strong">{value}</p>
      {detail && <p className="mt-2 text-[12px] leading-5 text-brand-text/55">{detail}</p>}
      {typeof progress === "number" && (
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-brand-background-secondary/45">
          <div className="h-full rounded-full bg-brand-primary" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
}

function GoalMini({ label, value }: any) {
  return (
    <div className="rounded-3xl border border-[rgba(90,31,43,.10)] bg-brand-background/60 p-4">
      <p className="micro-label">{label}</p>
      <p className="mt-2 font-serif text-2xl text-brand-strong">{value}</p>
    </div>
  );
}

function GoalField({ label, value, onChange, type = "text" }: any) {
  return (
    <label className="block">
      <span>{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="h-12 w-full border px-4 text-sm" />
    </label>
  );
}
