"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Bell, CalendarDays, DollarSign, Search, UserRound, TrendingUp, ArrowRight, Plus, Activity } from "lucide-react";

const fmtCurrency = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const fmtDate = (d: string) => new Date(d).toLocaleDateString("pt-BR");
const fmtTime = (d: string) => new Date(d).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadDashboard() {
    setLoading(true);
    try {
      const [tRes, aRes, pRes] = await Promise.all([
        fetch("/api/financial-transactions"),
        fetch("/api/appointments"),
        fetch("/api/patients?includeInactive=true"),
      ]);
      setTransactions(await tRes.json());
      setAppointments(await aRes.json());
      setPatients(await pRes.json());
    } catch (err) {
      console.error("Erro ao carregar dashboard", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadDashboard(); }, []);

  const summary = useMemo(() => {
    const isSameMonth = (date: string) => new Date(date).getMonth() === new Date().getMonth();
    const income = transactions.filter(t => t.type === "INCOME" && isSameMonth(t.date)).reduce((acc, t) => acc + t.amount, 0);
    const expense = transactions.filter(t => t.type === "EXPENSE" && isSameMonth(t.date)).reduce((acc, t) => acc + t.amount, 0);
    return {
      income,
      expense,
      balance: income - expense,
      activePatients: patients.filter(p => p.isActive !== false).length,
      todayCount: appointments.filter(a => new Date(a.date).toDateString() === new Date().toDateString() && a.status !== "CANCELED").length
    };
  }, [transactions, appointments, patients]);

  const upcoming = useMemo(() => {
    return appointments
      .filter(a => a.status !== "CANCELED" && new Date(a.date) >= new Date())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 6);
  }, [appointments]);

  if (loading) return <div className="min-h-screen bg-[#FAFAFA] p-20 font-serif italic text-[#C5A059]">Sincronizando dados vitais...</div>;

  return (
    <div className="min-h-screen bg-[#FAFAFA] px-8 py-10 md:px-14 font-sans antialiased text-[#1A1A1A]">
      <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-[#EEECE7] pb-10 gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
             <span className="h-[1px] w-8 bg-[#C5A059]"></span>
             <span className="micro-label !mb-0 text-[#C5A059]">Bem-Vinda, Dra. Mariana</span>
          </div>
          <h1 className="text-5xl font-serif leading-none tracking-tight">Dashboard</h1>
        </div>

        <div className="flex items-center gap-8">
          <div className="flex h-10 w-64 items-center gap-3 border-b border-[#EEECE7] focus-within:border-[#C5A059] transition-colors">
            <Search size={14} className="text-[#C5A059]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="BUSCAR PACIENTE..."
              className="w-full bg-transparent text-[10px] font-bold uppercase tracking-widest outline-none placeholder:text-[#94A3B8]"
            />
          </div>
          <button className="relative text-[#1A1A1A] hover:text-[#C5A059] transition-colors">
            <Bell size={20} strokeWidth={1.5} className="text-[#C5A059]" />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[#C5A059]" />
          </button>
        </div>
      </header>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <FinanceCard label="Faturamento Mensal" value={fmtCurrency(summary.income)} icon={<DollarSign size={18} />} trend="Ativo" />
        <FinanceCard label="Lucro Líquido" value={fmtCurrency(summary.balance)} icon={<TrendingUp size={18} />} trend="Ativo" />
        <FinanceCard label="Total de Pacientes" value={summary.activePatients.toString()} icon={<UserRound size={18} />} trend="Base" />
        <FinanceCard label="Agendamentos" value={summary.todayCount.toString()} icon={<CalendarDays size={18} />} subtext="Consultas hoje" />
      </div>

      <div className="mt-12 grid grid-cols-1 gap-8 xl:grid-cols-[1.6fr_1fr]">
        <section className="card p-0 overflow-hidden bg-white border border-[#EEECE7] rounded-xl shadow-sm">
          <div className="px-10 py-6 border-b border-[#F9F9F9] flex justify-between items-center">
            <div className="flex items-center gap-3">
               <Activity size={16} className="text-[#C5A059]" />
               <h3 className="text-xl font-serif uppercase tracking-widest">Próximas Consultas</h3>
            </div>
            <Link href="/appointments" className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#C5A059] hover:text-[#1A1A1A] transition-colors">Ver Agenda Completa</Link>
          </div>
          <div className="divide-y divide-[#F9F9F9]">
            {upcoming.map((app) => (
              <div key={app.id} className="px-10 py-6 flex items-center justify-between hover:bg-[#FAFAFA] transition-colors">
                <div className="flex-1">
                  <h4 className="text-[15px] font-semibold text-[#1A1A1A]">{app.patient?.name || "Paciente Não Identificado"}</h4>
                  <p className="text-[10px] uppercase tracking-widest text-[#94A3B8] mt-1">{app.procedureName || "Consulta Geral"}</p>
                </div>
                <div className="flex items-center gap-12">
                   <div className="text-right">
                     <p className="text-[12px] font-medium text-[#1A1A1A]">{fmtDate(app.date)}</p>
                     <p className="text-[10px] text-[#C5A059] uppercase font-bold">{fmtTime(app.date)}</p>
                   </div>
                   <span className="text-[9px] font-bold tracking-[0.15em] border border-[#C5A059] text-[#C5A059] px-3 py-1.5 uppercase rounded-sm">Agendado</span>
                </div>
              </div>
            ))}
            {upcoming.length === 0 && (
              <div className="px-10 py-12 text-center text-sm text-gray-400 font-medium">Nenhuma consulta futura agendada.</div>
            )}
          </div>
        </section>

        <section className="card p-10 bg-white border border-[#EEECE7] rounded-xl shadow-sm">
          <div className="flex items-start justify-between mb-10">
            <div>
              <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest mb-1">Gestão de Base</p>
              <h3 className="text-3xl font-serif text-[#1A1A1A]">Pacientes</h3>
            </div>
            <div className="h-12 w-12 flex items-center justify-center border border-[#C5A059] rounded-full text-[#C5A059]">
               <UserRound size={20} />
            </div>
          </div>

          <div className="space-y-6">
            {patients.slice(0, 5).map((p) => (
              <Link key={p.id} href={`/patients/${p.id}`} className="group flex items-center gap-5 p-2 -ml-2 hover:bg-[#FAFAFA] transition-all rounded-lg">
                <div className="h-10 w-10 flex items-center justify-center border border-[#EEECE7] group-hover:border-[#C5A059] text-[#C5A059] font-serif text-lg transition-colors rounded-md bg-white">
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[13px] font-bold uppercase tracking-tight text-[#1A1A1A] group-hover:text-[#C5A059] transition-colors truncate">{p.name}</h4>
                  <p className="text-[10px] text-[#94A3B8] truncate uppercase tracking-tighter">{p.phone || "Sem contato"}</p>
                </div>
                <ArrowRight size={14} className="text-[#EEECE7] group-hover:text-[#C5A059] group-hover:translate-x-1 transition-all" />
              </Link>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-[#F9F9F9]">
            <Link href="/patients/new" className="w-full flex items-center justify-center gap-3 bg-[#1A1A1A] hover:bg-[#C5A059] text-white py-4 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all">
              <Plus size={14} /> Novo Paciente
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

function FinanceCard({ label, value, icon, trend, subtext }: any) {
  return (
    <div className="p-8 flex flex-col justify-between min-h-[180px] bg-white border border-[#EEECE7] rounded-xl shadow-sm">
      <div className="flex justify-between items-start">
        <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest leading-relaxed max-w-[70%]">{label}</p>
        <div className="text-[#C5A059] p-2 bg-[#FAF8F3] border border-[#E9DEC9] rounded-md">
          {icon}
        </div>
      </div>
      
      <div className="mt-4">
        <h2 className="text-3xl lg:text-4xl font-serif text-[#1A1A1A] truncate">{value}</h2>
        <div className="mt-4 flex items-center justify-between border-t border-[#F9F9F9] pt-4">
           <span className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-widest">{subtext || "Mês Corrente"}</span>
           {trend && <span className="text-[10px] font-bold text-[#C5A059] uppercase tracking-widest">{trend}</span>}
        </div>
      </div>
    </div>
  );
}