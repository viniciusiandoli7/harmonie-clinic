"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, CloudUpload, Download, RefreshCcw, ShieldCheck, TrendingUp, Users } from "lucide-react";

const fmtCurrency = (v: number) => (v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function ExecutiveDashboardPage() {
  const [finance, setFinance] = useState<any>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [backups, setBackups] = useState<any[]>([]);
  const [goal, setGoal] = useState<any>(null);
  const [loadingBackup, setLoadingBackup] = useState(false);

  async function load() {
    const [financeRes, patientsRes, appointmentsRes, backupsRes, goalRes] = await Promise.all([
      fetch("/api/finance/stats"),
      fetch("/api/patients?includeInactive=true"),
      fetch("/api/appointments"),
      fetch("/api/backups"),
      fetch("/api/goals"),
    ]);
    if (financeRes.ok) setFinance(await financeRes.json());
    if (patientsRes.ok) setPatients(await patientsRes.json());
    if (appointmentsRes.ok) setAppointments(await appointmentsRes.json());
    if (backupsRes.ok) setBackups(await backupsRes.json());
    if (goalRes.ok) setGoal(await goalRes.json());
  }

  useEffect(() => { load(); }, []);

  const indicators = useMemo(() => {
    const now = new Date();
    const sameMonth = (date: string) => {
      const parsed = new Date(date);
      return parsed.getMonth() === now.getMonth() && parsed.getFullYear() === now.getFullYear();
    };
    const monthAppointments = appointments.filter((a) => sameMonth(a.date));
    const completed = monthAppointments.filter((a) => a.status === "COMPLETED").length;
    const scheduled = monthAppointments.filter((a) => a.status !== "CANCELED").length;
    const returning = new Set(monthAppointments.map((a) => a.patientId)).size;

    return {
      leads: patients.filter((p) => sameMonth(p.createdAt)).length,
      conversion: scheduled ? Math.round((completed / scheduled) * 100) : 0,
      returns: returning,
      referrals: patients.filter((p) => p.crmSource === "Indicação" && sameMonth(p.createdAt)).length,
      procedures: completed,
      revenue: finance?.income || 0,
      ticket: finance?.averageTicket || 0,
      profit: finance?.netProfit || 0,
    };
  }, [appointments, patients, finance]);

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
          <p className="mt-3 max-w-2xl text-[14px] leading-6 text-brand-text/64">Leads, conversão, ticket médio, lucro, retornos, indicações, procedimentos, receita e comparação mensal.</p>
        </div>
        <button onClick={load} className="btn-secondary h-12"><RefreshCcw size={15} /> Atualizar</button>
      </header>

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="Leads" value={indicators.leads} icon={<Users size={18} />} />
        <Metric label="Conversão" value={`${indicators.conversion}%`} icon={<TrendingUp size={18} />} />
        <Metric label="Ticket médio" value={fmtCurrency(indicators.ticket)} icon={<BarChart3 size={18} />} />
        <Metric label="Lucro" value={fmtCurrency(indicators.profit)} icon={<BarChart3 size={18} />} />
        <Metric label="Retornos" value={indicators.returns} icon={<Users size={18} />} />
        <Metric label="Indicações" value={indicators.referrals} icon={<Users size={18} />} />
        <Metric label="Procedimentos" value={indicators.procedures} icon={<ShieldCheck size={18} />} />
        <Metric label="Receita" value={fmtCurrency(indicators.revenue)} icon={<TrendingUp size={18} />} />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Metric label="Meta de faturamento" value={fmtCurrency(goal?.revenueGoal || finance?.monthlyGoal || 0)} icon={<TrendingUp size={18} />} />
        <Metric label="Meta de pacientes" value={goal?.patientGoal || 0} icon={<Users size={18} />} />
        <Metric label="Meta de avaliações" value={goal?.evaluationGoal || 0} icon={<Users size={18} />} />
        <Metric label="Meta de conversão" value={`${goal?.conversionGoal || 0}%`} icon={<TrendingUp size={18} />} />
        <Metric label="Ticket alvo" value={fmtCurrency(goal?.averageTicketGoal || 0)} icon={<BarChart3 size={18} />} />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_.9fr]">
        <section className="premium-card p-6">
          <p className="micro-label">Comparação mensal</p>
          <h2 className="mt-2 text-3xl">Meta x Receita</h2>
          <div className="mt-8 h-4 overflow-hidden rounded-full bg-brand-background-secondary/45">
            <div className="h-full rounded-full bg-brand-primary" style={{ width: `${finance?.goalPercentage || 0}%` }} />
          </div>
          <div className="mt-4 flex justify-between text-[12px] font-semibold text-brand-text/62">
            <span>{fmtCurrency(finance?.income || 0)} realizado</span>
            <span>{fmtCurrency(finance?.monthlyGoal || 0)} meta</span>
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

function Metric({ label, value, icon }: any) {
  return (
    <div className="premium-card p-6">
      <div className="flex items-start justify-between">
        <p className="micro-label max-w-[70%]">{label}</p>
        <div className="rounded-2xl bg-brand-primary/10 p-2.5 text-brand-primary">{icon}</div>
      </div>
      <p className="mt-6 font-serif text-4xl text-brand-strong">{value}</p>
    </div>
  );
}
