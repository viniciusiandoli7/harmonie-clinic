"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Gift,
  MessageCircle,
  Plus,
  Search,
  TrendingUp,
  UserRound,
  WalletCards,
} from "lucide-react";
import NotificationBell from "@/components/notifications/NotificationBell";

const fmtCurrency = (v: number) => (v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const fmtDate = (d: string) => new Date(d).toLocaleDateString("pt-BR");
const fmtTime = (d: string) => new Date(d).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

function daysBetween(date: Date, reference = new Date()) {
  const diff = reference.getTime() - date.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [financeStats, setFinanceStats] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [inactivityDays, setInactivityDays] = useState(90);
  const [loading, setLoading] = useState(true);

  async function loadDashboard() {
    setLoading(true);
    try {
      const [tRes, aRes, pRes, fRes] = await Promise.all([
        fetch("/api/financial-transactions"),
        fetch("/api/appointments"),
        fetch("/api/patients?includeInactive=true"),
        fetch("/api/finance/stats"),
      ]);
      setTransactions(tRes.ok ? await tRes.json() : []);
      setAppointments(aRes.ok ? await aRes.json() : []);
      setPatients(pRes.ok ? await pRes.json() : []);
      setFinanceStats(fRes.ok ? await fRes.json() : null);
    } catch (err) {
      console.error("Erro ao carregar dashboard", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const summary = useMemo(() => {
    const now = new Date();
    const sameMonth = (date: string) => {
      const parsed = new Date(date);
      return parsed.getMonth() === now.getMonth() && parsed.getFullYear() === now.getFullYear();
    };
    const paidTransactions = transactions.filter((t) => ["PAID", "COMPLETED"].includes(t.status));
    const income = paidTransactions.filter((t) => t.type === "INCOME" && sameMonth(t.date)).reduce((acc, t) => acc + t.amount, 0);
    const expense = paidTransactions.filter((t) => t.type === "EXPENSE" && sameMonth(t.date)).reduce((acc, t) => acc + t.amount, 0);
    const newPatients = patients.filter((p) => sameMonth(p.createdAt)).length;
    const returningPatientIds = new Set(appointments.filter((a) => a.status !== "CANCELED" && sameMonth(a.date)).map((a) => a.patientId));

    return {
      income: financeStats?.income ?? income,
      expense: financeStats?.expense ?? expense,
      balance: financeStats?.netProfit ?? income - expense,
      averageTicket: financeStats?.averageTicket ?? 0,
      activePatients: patients.filter((p) => p.isActive !== false).length,
      todayCount: appointments.filter((a) => new Date(a.date).toDateString() === now.toDateString() && a.status !== "CANCELED").length,
      newPatients,
      returningPatients: returningPatientIds.size,
    };
  }, [transactions, appointments, patients, financeStats]);

  const upcoming = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    return appointments
      .filter((a) => a.status !== "CANCELED" && new Date(a.date) >= startOfToday)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 6);
  }, [appointments]);

  const birthdaysOfMonth = useMemo(() => {
    const currentMonth = new Date().getMonth();
    return patients
      .filter((p) => p.birthDate && new Date(p.birthDate).getMonth() === currentMonth)
      .sort((a, b) => new Date(a.birthDate).getDate() - new Date(b.birthDate).getDate());
  }, [patients]);

  const reactivationPatients = useMemo(() => {
    const appointmentsByPatient = appointments.reduce<Record<string, any[]>>((acc, app) => {
      if (app.status === "CANCELED") return acc;
      if (!acc[app.patientId]) acc[app.patientId] = [];
      acc[app.patientId].push(app);
      return acc;
    }, {});

    return patients
      .map((patient) => {
        const patientAppointments = appointmentsByPatient[patient.id] || [];
        const lastDate = patientAppointments.length
          ? new Date(Math.max(...patientAppointments.map((a) => new Date(a.date).getTime())))
          : new Date(patient.createdAt);
        return { ...patient, lastInteractionAt: lastDate, inactiveDays: daysBetween(lastDate) };
      })
      .filter((patient) => patient.isActive !== false && patient.inactiveDays >= inactivityDays)
      .sort((a, b) => b.inactiveDays - a.inactiveDays)
      .slice(0, 8);
  }, [patients, appointments, inactivityDays]);

  const filteredPatients = useMemo(() => {
    const term = search.trim().toLowerCase();
    const normalize = (value?: string | null) => (value || "").toLowerCase();

    if (!term) return patients.slice(0, 5);

    return patients
      .filter((p) => {
        const searchable = [p.name, p.phone, p.cpf, p.email, p.crmSource, p.crmStatus, p.referralName]
          .map(normalize)
          .join(" ");
        return searchable.includes(term);
      })
      .slice(0, 8);
  }, [patients, search]);

  const openFirstSearchResult = () => {
    if (!search.trim() || filteredPatients.length === 0) return;
    window.location.href = `/patients/${filteredPatients[0].id}`;
  };

  const whatsappReactivation = (patient: any) => {
    const firstName = patient.name?.split(" ")[0] || "";
    const phone = patient.phone?.replace(/\D/g, "") || "";
    const message = `Olá, ${firstName}! Aqui é a Dra. Mariana. Estava revendo seu histórico e pensei em te chamar para uma reavaliação com calma, para acompanharmos sua pele e planejarmos os próximos cuidados de forma natural e segura.`;
    return `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
  };

  if (loading) {
    return <div className="min-h-screen p-12 font-serif text-2xl italic text-brand-primary">Sincronizando dados da clínica...</div>;
  }

  return (
    <div className="min-h-screen px-2 py-3 font-sans text-brand-text sm:px-4 lg:px-6">
      <header className="flex flex-col gap-6 border-b border-[rgba(90,31,43,.12)] pb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <span className="h-px w-8 bg-brand-primary" />
            <span className="micro-label mb-0 text-brand-primary/70">Bem-vinda, Dra. Mariana</span>
          </div>
          <h1 className="page-title">Dashboard</h1>
          <p className="mt-3 max-w-2xl text-[14px] leading-6 text-brand-text/64">
            Visão executiva da clínica, pacientes, faturamento e oportunidades de reativação.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center md:gap-4">
          <div className="search-shell relative w-full md:w-[360px]">
            <div className="flex h-12 items-center gap-3 rounded-full border border-[rgba(90,31,43,.12)] bg-brand-surface px-4 shadow-card transition focus-within:border-[rgba(90,31,43,.32)] focus-within:shadow-[0_0_0_4px_rgba(90,31,43,.07)]">
              <Search size={16} className="shrink-0 text-brand-primary/55" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => setSearchOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") openFirstSearchResult();
                  if (e.key === "Escape") {
                    setSearch("");
                    setSearchOpen(false);
                  }
                }}
                placeholder="Buscar paciente, telefone ou origem"
                className="patient-search-input h-full min-w-0 flex-1 border-0 bg-transparent text-[12px] font-semibold outline-none"
              />
              {search && (
                <button type="button" onClick={() => setSearch("")} className="rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-brand-primary/55 transition hover:bg-[rgba(90,31,43,.08)]">
                  Limpar
                </button>
              )}
            </div>

            {searchOpen && search.trim() && (
              <div className="absolute left-0 right-0 top-14 z-40 overflow-hidden rounded-[24px] border border-[rgba(90,31,43,.12)] bg-brand-surface shadow-[0_20px_70px_rgba(63,22,32,.14)]">
                <div className="border-b border-[rgba(90,31,43,.08)] px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-text/46">
                    {filteredPatients.length ? `${filteredPatients.length} resultado${filteredPatients.length > 1 ? "s" : ""}` : "Nenhum resultado"}
                  </p>
                </div>
                <div className="max-h-72 overflow-y-auto p-2">
                  {filteredPatients.length === 0 ? (
                    <p className="px-3 py-4 text-[13px] text-brand-text/55">Nenhuma paciente encontrada com esse termo.</p>
                  ) : filteredPatients.map((p) => (
                    <Link key={p.id} href={`/patients/${p.id}`} onClick={() => setSearchOpen(false)} className="flex items-center gap-3 rounded-2xl p-3 transition hover:bg-[rgba(90,31,43,.06)]">
                      <div className="grid h-9 w-9 place-items-center rounded-2xl border border-[rgba(90,31,43,.12)] bg-brand-background font-serif text-base text-brand-primary">{p.name?.charAt(0).toUpperCase()}</div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-bold text-brand-strong">{p.name}</p>
                        <p className="truncate text-[10px] uppercase tracking-[0.14em] text-brand-text/42">{p.phone || "Sem telefone"} • {p.crmSource || "Sem origem"}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <NotificationBell inactiveDays={inactivityDays} />
        </div>
      </header>

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Faturamento do mês" value={fmtCurrency(summary.income)} icon={<WalletCards size={18} />} />
        <MetricCard label="Lucro líquido" value={fmtCurrency(summary.balance)} icon={<TrendingUp size={18} />} accent={summary.balance >= 0 ? "success" : "danger"} />
        <MetricCard label="Gastos do mês" value={fmtCurrency(summary.expense)} icon={<TrendingUp size={18} />} accent="danger" />
        <MetricCard label="Ticket médio" value={fmtCurrency(summary.averageTicket)} icon={<UserRound size={18} />} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <MiniCard label="Pacientes novos" value={summary.newPatients} />
        <MiniCard label="Pacientes retornando" value={summary.returningPatients} />
        <MiniCard label="Agendamentos hoje" value={summary.todayCount} />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_.85fr]">
        <div className="space-y-6">
          <section className="premium-card p-6">
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-brand-primary/10 p-3 text-brand-primary"><MessageCircle size={17} /></div>
                <div>
                  <p className="micro-label mb-1">Alerta de inatividade</p>
                  <h3 className="text-2xl">Pacientes para reativação</h3>
                </div>
              </div>
              <select value={inactivityDays} onChange={(e) => setInactivityDays(Number(e.target.value))} className="h-11 rounded-full border px-4 text-[12px] font-semibold">
                {[60, 90, 120].map((days) => <option key={days} value={days}>{days} dias</option>)}
              </select>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {reactivationPatients.length === 0 ? (
                <p className="text-[13px] text-brand-text/55">Nenhuma paciente dentro do período de inatividade selecionado.</p>
              ) : reactivationPatients.map((p) => (
                <div key={p.id} className="rounded-3xl border border-[rgba(90,31,43,.10)] bg-brand-background/55 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-brand-strong">{p.name}</p>
                      <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-brand-text/45">{p.inactiveDays} dias sem retorno</p>
                    </div>
                    <a href={whatsappReactivation(p)} target="_blank" className="rounded-full bg-brand-success/12 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-success">
                      WhatsApp
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="premium-card p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-2xl bg-brand-primary/10 p-3 text-brand-primary"><Gift size={17} /></div>
              <div>
                <p className="micro-label mb-1">Relacionamento</p>
                <h3 className="text-2xl">Aniversariantes do mês</h3>
              </div>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {birthdaysOfMonth.length === 0 ? (
                <p className="text-[13px] text-brand-text/55">Nenhum aniversariante este mês.</p>
              ) : birthdaysOfMonth.map((p) => (
                <div key={p.id} className="min-w-42 rounded-3xl border border-[rgba(90,31,43,.10)] bg-brand-background/55 p-4 text-center">
                  <p className="truncate text-[13px] font-bold text-brand-strong" title={p.name}>{p.name}</p>
                  <p className="mt-1 text-[12px] font-bold text-brand-primary">{new Date(p.birthDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}</p>
                  <a href={`https://wa.me/55${p.phone?.replace(/\D/g, "")}?text=${encodeURIComponent(`Olá, ${p.name.split(" ")[0]}! A Dra. Mariana deseja um feliz aniversário e um novo ciclo cheio de saúde e beleza natural.`)}`} target="_blank" className="mt-3 inline-flex rounded-full bg-brand-success/12 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-brand-success">Enviar</a>
                </div>
              ))}
            </div>
          </section>

          <section className="premium-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-[rgba(90,31,43,.10)] px-6 py-5">
              <div>
                <p className="micro-label mb-1">Agenda</p>
                <h3 className="text-2xl">Próximas consultas</h3>
              </div>
              <Link href="/appointments" className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-primary">Ver agenda</Link>
            </div>
            <div className="divide-y divide-[rgba(90,31,43,.08)]">
              {upcoming.map((app) => (
                <div key={app.id} className="flex flex-col gap-4 px-6 py-5 transition hover:bg-[rgba(90,31,43,.04)] sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h4 className="text-[14px] font-semibold text-brand-strong">{app.patient?.name || "Paciente não identificado"}</h4>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-brand-text/45">{app.procedureName || "Consulta geral"}</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-[12px] font-semibold text-brand-strong">{fmtDate(app.date)}</p>
                      <p className="text-[11px] font-bold text-brand-primary">{fmtTime(app.date)}</p>
                    </div>
                    <span className="rounded-full border border-[rgba(90,31,43,.12)] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-primary">
                      {app.status === "COMPLETED" ? "Concluído" : "Agendado"}
                    </span>
                  </div>
                </div>
              ))}
              {upcoming.length === 0 && <div className="px-6 py-10 text-center text-sm text-brand-text/55">Nenhuma consulta futura.</div>}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="premium-card p-6">
            <p className="micro-label">Origem dos pacientes</p>
            <h3 className="mt-2 text-3xl">Mês atual</h3>
            <div className="mt-6 space-y-4">
              {Object.entries(financeStats?.patientOrigins || {}).length === 0 ? (
                <p className="text-[13px] text-brand-text/55">Cadastre a origem no CRM para acompanhar o crescimento dos canais.</p>
              ) : Object.entries(financeStats.patientOrigins).map(([source, count]: any) => (
                <div key={source}>
                  <div className="flex justify-between text-[12px] font-semibold text-brand-text/70"><span>{source}</span><span>{count}</span></div>
                  <div className="mt-1 h-2 rounded-full bg-brand-background-secondary/45"><div className="h-full rounded-full bg-brand-primary" style={{ width: `${Math.min(100, count * 16)}%` }} /></div>
                </div>
              ))}
            </div>
          </section>

          <section className="premium-card p-6">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <p className="micro-label">CRM</p>
                <h3 className="mt-2 text-3xl">Pacientes</h3>
              </div>
              <div className="rounded-full border border-[rgba(90,31,43,.12)] p-3 text-brand-primary"><UserRound size={18} /></div>
            </div>
            <div className="space-y-3">
              {filteredPatients.map((p) => (
                <Link key={p.id} href={`/patients/${p.id}`} className="group flex items-center gap-4 rounded-2xl p-2 transition hover:bg-[rgba(90,31,43,.06)]">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[rgba(90,31,43,.12)] bg-brand-background font-serif text-lg text-brand-primary">{p.name?.charAt(0).toUpperCase()}</div>
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate text-[13px] font-bold text-brand-strong group-hover:text-brand-primary">{p.name}</h4>
                    <p className="truncate text-[10px] uppercase tracking-[0.14em] text-brand-text/45">{p.crmStatus || "Novo Lead"} • {p.crmSource || "Sem origem"}</p>
                  </div>
                  <ArrowRight size={14} className="text-brand-text/30 transition group-hover:translate-x-1 group-hover:text-brand-primary" />
                </Link>
              ))}
            </div>
            <Link href="/patients/new" className="btn-primary mt-8 w-full"><Plus size={14} /> Novo paciente</Link>
          </section>
        </aside>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon, accent }: any) {
  const color = accent === "success" ? "text-brand-success" : accent === "danger" ? "text-brand-danger" : "text-brand-primary";
  return (
    <div className="premium-card p-6">
      <div className="flex items-start justify-between">
        <p className="micro-label max-w-[70%]">{label}</p>
        <div className={`rounded-2xl bg-brand-primary/10 p-2.5 ${color}`}>{icon}</div>
      </div>
      <h2 className="mt-6 truncate text-4xl">{value}</h2>
    </div>
  );
}

function MiniCard({ label, value }: any) {
  return (
    <div className="premium-card flex items-center justify-between p-5">
      <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-text/50">{label}</span>
      <span className="font-serif text-3xl text-brand-primary">{value}</span>
    </div>
  );
}
