"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, FileText, RefreshCcw } from "lucide-react";

const fmtCurrency = (v: number) => (v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const currentMonth = () => new Date().toISOString().slice(0, 7);

export default function MonthlyReportPage() {
  const [month, setMonth] = useState(currentMonth());
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/reports/monthly?month=${month}`);
    if (res.ok) setReport(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const html = useMemo(() => {
    if (!report) return "";
    return `
      <html><head><title>Relatório mensal Mariana Thomaz Carmona</title>
      <style>
      body{font-family:Arial,sans-serif;background:#F7F2EA;color:#1E1A18;padding:32px}h1,h2{font-family:Georgia,serif;color:#5A1F2B}section{background:#FBF8F2;border:1px solid rgba(90,31,43,.15);border-radius:18px;padding:20px;margin:14px 0}table{width:100%;border-collapse:collapse}th,td{border-bottom:1px solid rgba(90,31,43,.12);padding:10px;text-align:left;font-size:12px}th{text-transform:uppercase;color:#5A1F2B;font-size:10px}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.kpi{background:#F7F2EA;border-radius:14px;padding:14px}.label{font-size:9px;text-transform:uppercase;color:#5B3A2E;letter-spacing:.16em}.value{font-size:22px;color:#1E1A18;margin-top:8px}
      </style></head><body>
      <h1>Relatório Mensal — Mariana Thomaz Carmona</h1><p>Período: ${report.month}</p>
      <section><h2>Resumo financeiro</h2><div class="grid">
        <div class="kpi"><div class="label">Faturamento</div><div class="value">${fmtCurrency(report.financial.income)}</div></div>
        <div class="kpi"><div class="label">Lucro líquido</div><div class="value">${fmtCurrency(report.financial.netProfit)}</div></div>
        <div class="kpi"><div class="label">Ticket médio</div><div class="value">${fmtCurrency(report.financial.averageTicket)}</div></div>
        <div class="kpi"><div class="label">Meta atingida</div><div class="value">${report.financial.goalPercentage}%</div></div>
      </div></section>
      <section><h2>Agenda e conversão</h2><div class="grid">
        <div class="kpi"><div class="label">Novas pacientes</div><div class="value">${report.patients.newPatients}</div></div>
        <div class="kpi"><div class="label">Comparecimentos</div><div class="value">${report.appointments.completed}</div></div>
        <div class="kpi"><div class="label">Conversão</div><div class="value">${report.conversions.conversionRate}%</div></div>
        <div class="kpi"><div class="label">Faltas</div><div class="value">${report.appointments.noShows}</div></div>
      </div></section>
      <section><h2>Procedimentos</h2><table><tr><th>Procedimento</th><th>Quantidade</th><th>Receita</th></tr>${(report.procedures || []).map((p: any) => `<tr><td>${p.procedure}</td><td>${p.count}</td><td>${fmtCurrency(p.revenue)}</td></tr>`).join("")}</table></section>
      <section><h2>Origem das pacientes</h2><table><tr><th>Origem</th><th>Pacientes</th><th>Valor fechado</th></tr>${(report.patients.byOrigin || []).map((p: any) => `<tr><td>${p.origin}</td><td>${p.patients}</td><td>${fmtCurrency(p.closedValue)}</td></tr>`).join("")}</table></section>
      <section><h2>Estoque</h2><p>Itens abaixo do mínimo: ${report.stock.lowStock.length}. Itens vencendo: ${report.stock.expiringSoon.length}.</p></section>
      <script>window.print()</script></body></html>`;
  }, [report]);

  function exportPdf() {
    const win = window.open("", "_blank");
    if (win && html) { win.document.write(html); win.document.close(); }
  }

  return (
    <div className="min-h-screen px-2 py-3 font-sans text-brand-text sm:px-4 lg:px-6">
      <header className="flex flex-col gap-6 border-b border-[rgba(90,31,43,.12)] pb-8 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="micro-label text-brand-primary/70">Gestão mensal</p>
          <h1 className="page-title mt-2">Relatório do mês</h1>
          <p className="mt-3 max-w-2xl text-[14px] leading-6 text-brand-text/64">Resumo para decisão: faturamento, lucro, agenda, conversão, origem das pacientes, procedimentos e estoque.</p>
        </div>
        <div className="flex gap-3">
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="h-12 rounded-full border border-[rgba(90,31,43,.12)] px-4" />
          <button onClick={load} className="btn-secondary h-12"><RefreshCcw size={15} /> Gerar</button>
          <button onClick={exportPdf} disabled={!report} className="btn-primary h-12"><Download size={15} /> PDF</button>
        </div>
      </header>

      {loading ? <div className="mt-10 font-serif text-2xl text-brand-primary">Gerando relatório...</div> : report ? (
        <main className="mt-8 space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Kpi label="Faturamento" value={fmtCurrency(report.financial.income)} />
            <Kpi label="Lucro líquido" value={fmtCurrency(report.financial.netProfit)} />
            <Kpi label="Ticket médio" value={fmtCurrency(report.financial.averageTicket)} />
            <Kpi label="Meta atingida" value={`${report.financial.goalPercentage}%`} />
          </div>
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Card title="Captação e conversão">
              <Row label="Novas pacientes" value={report.patients.newPatients} />
              <Row label="Avaliações registradas" value={report.conversions.total} />
              <Row label="Fechamentos" value={report.conversions.closed} />
              <Row label="Taxa de conversão" value={`${report.conversions.conversionRate}%`} />
            </Card>
            <Card title="Agenda inteligente">
              <Row label="Agendamentos" value={report.appointments.total} />
              <Row label="Comparecimentos" value={report.appointments.completed} />
              <Row label="Faltas" value={report.appointments.noShows} />
              <Row label="Taxa de comparecimento" value={`${report.appointments.attendanceRate}%`} />
            </Card>
          </div>
          <Card title="Procedimentos mais vendidos">
            {(report.procedures || []).slice(0, 8).map((p: any) => <Row key={p.procedure} label={`${p.procedure} • ${p.count}x`} value={fmtCurrency(p.revenue)} />)}
          </Card>
          <Card title="Origem das pacientes">
            {(report.patients.byOrigin || []).map((p: any) => <Row key={p.origin} label={`${p.origin} • ${p.patients} paciente(s)`} value={fmtCurrency(p.closedValue)} />)}
          </Card>
        </main>
      ) : (
        <div className="premium-card mt-10 p-10 text-center"><FileText className="mx-auto text-brand-primary" /><p className="mt-4 text-sm text-brand-text/60">Selecione o mês e gere o relatório.</p></div>
      )}
    </div>
  );
}

function Kpi({ label, value }: any) { return <div className="premium-card p-6"><p className="micro-label">{label}</p><p className="mt-4 font-serif text-4xl text-brand-strong">{value}</p></div>; }
function Card({ title, children }: any) { return <section className="premium-card p-6"><h2 className="font-serif text-3xl text-brand-strong">{title}</h2><div className="mt-5 divide-y divide-[rgba(90,31,43,.10)]">{children}</div></section>; }
function Row({ label, value }: any) { return <div className="flex items-center justify-between gap-4 py-3 text-sm"><span className="text-brand-text/62">{label}</span><strong className="text-brand-primary">{value}</strong></div>; }
