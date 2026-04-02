"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Search, Plus, TrendingUp, Filter, 
  Activity, Download, X, Check
} from "lucide-react";

export default function FinancePage() {
  const [stats, setStats] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- CARREGAR DADOS ---
  async function loadFinance() {
    try {
      setLoading(true);
      const res = await fetch("/api/finance/stats");
      const data = await res.json();
      setStats(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadFinance(); }, []);

  // --- LÓGICA DE FILTRO REAL ---
  const filteredMovements = useMemo(() => {
    if (!stats?.recentMovements) return [];
    return stats.recentMovements.filter((t: any) => 
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase())
    );
  }, [stats, search]);

  // --- FUNÇÃO DE EXPORTAR (CSV para Excel) ---
  const handleExport = () => {
    if (!stats?.recentMovements) return;
    const headers = ["Data", "Descrição", "Categoria", "Valor", "Tipo"];
    const rows = stats.recentMovements.map((t: any) => [
      new Date(t.date).toLocaleDateString('pt-BR'),
      t.description,
      t.category,
      t.amount,
      t.type
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `financeiro_harmonie_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="min-h-screen bg-[#FAF8F3] flex items-center justify-center font-serif italic text-[#C5A059]">Sincronizando inteligência...</div>;

  return (
    <div className="min-h-screen bg-[#FAF8F3] px-8 py-8 md:px-12 font-sans antialiased text-[#1A1A1A]">
      
      {/* HEADER */}
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between border-b border-[#EEECE7] pb-8">
        <div>
          <p className="text-[10px] uppercase tracking-[0.4em] text-[#C5A059] font-bold italic">Harmonie Financial Intelligence</p>
          <h1 className="mt-2 text-5xl font-serif">Financeiro</h1>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex h-10 w-72 items-center gap-3 border-b border-[#D9DEEA] focus-within:border-[#C5A059] transition-colors">
            <Search size={14} className="text-[#B3BED2]" />
            <input 
              placeholder="BUSCAR TRANSAÇÃO..." 
              className="w-full bg-transparent text-[10px] font-bold uppercase tracking-widest outline-none placeholder:text-[#C1CAD9]"
              value={search} onChange={e => setSearch(e.target.value)}
            />
          </div>
          {/* BOTÃO NOVA TRANSAÇÃO FUNCIONAL */}
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-[#1A1A1A] text-white px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest hover:bg-[#C5A059] transition-all shadow-xl"
          >
            + Nova Transação
          </button>
        </div>
      </div>

      {/* DASHBOARD CARDS */}
      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <FinanceCard label="Lucro Líquido (Mês)" value={stats.netProfit} trend="+12%" icon={<TrendingUp size={14}/>} />
        <FinanceCard label="Disponível em Caixa" value={stats.totalBalance} color="#C5A059" />
        <FinanceCard label="Previsão de Recebíveis" value={stats.receivables} />
        
        {/* SAÚDE DO NEGÓCIO */}
        <div className="bg-white border-2 border-[#C5A059] p-7 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -top-4 -right-4 opacity-[0.03]"><Activity size={120} /></div>
          <div>
            <p className="text-[9px] font-black text-[#C5A059] uppercase tracking-[0.3em] mb-4">Saúde do Negócio</p>
            <div className="text-3xl font-serif italic">{stats.healthScore}</div>
          </div>
          <div className="mt-6">
            <p className="text-[9px] text-[#94A3B8] uppercase font-bold tracking-widest">Meta Trimestre: 85%</p>
            <div className="h-[2px] w-full bg-[#F5F5F5] mt-2"><div className="h-full bg-[#C5A059] w-[85%]" /></div>
          </div>
        </div>
      </div>

      {/* TABELA COM FILTRO E EXPORTAÇÃO FUNCIONAIS */}
      <div className="mt-12 bg-white border border-[#EEECE7] rounded-none overflow-hidden shadow-sm">
        <div className="px-10 py-6 border-b border-[#F9F9F9] flex justify-between items-center bg-[#FCFAF9]/50">
           <div className="flex items-center gap-3">
              <div className="w-1 h-4 bg-[#C5A059]" />
              <h3 className="text-[11px] font-bold uppercase tracking-[0.3em]">Movimentações Recentes</h3>
           </div>
           <div className="flex items-center gap-6">
              {/* BOTÃO EXPORTAR FUNCIONAL */}
              <button 
                onClick={handleExport}
                className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-[#94A3B8] hover:text-[#1A1A1A] transition-all"
              >
                 <Download size={14}/> Exportar
              </button>
              <Filter size={15} className="text-[#96A4C1] cursor-pointer hover:text-[#C5A059]" />
           </div>
        </div>

        <table className="w-full text-left">
          <thead>
            <tr className="bg-[#FCFAF6] border-b border-[#EEECE7]">
              <th className="px-10 py-5 text-[9px] font-bold uppercase tracking-[0.2em] text-[#BBB]">Data</th>
              <th className="px-10 py-5 text-[9px] font-bold uppercase tracking-[0.2em] text-[#BBB]">Descrição</th>
              <th className="px-10 py-5 text-[9px] font-bold uppercase tracking-[0.2em] text-[#BBB]">Categoria</th>
              <th className="px-10 py-5 text-right text-[9px] font-bold uppercase tracking-[0.2em] text-[#BBB]">Valor Bruto</th>
              <th className="px-10 py-5 text-right text-[9px] font-bold uppercase tracking-[0.2em] text-[#BBB]">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F9F9F9]">
             {filteredMovements.map((t: any) => (
               <TransactionRow key={t.id} t={t} />
             ))}
          </tbody>
        </table>
      </div>

      {/* MODAL DE NOVA TRANSAÇÃO */}
      {isModalOpen && <NewTransactionModal onClose={() => setIsModalOpen(false)} onSave={loadFinance} />}
    </div>
  );
}

// --- SUB-COMPONENTES ---

function NewTransactionModal({ onClose, onSave }: any) {
  const [form, setForm] = useState({ description: "", amount: "", type: "INCOME", category: "PROCEDIMENTO" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/finance/transactions", { 
      method: "POST", 
      body: JSON.stringify({ ...form, amount: parseFloat(form.amount), date: new Date() }) 
    });
    onSave();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-md p-10 border border-[#C5A059]/30 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        <div className="flex justify-between items-center mb-10">
          <h3 className="text-xl font-serif italic">Nova Transação</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-black"><X size={20}/></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1">
            <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400">Descrição</label>
            <input required className="w-full border-b border-[#EEE] py-2 text-[12px] outline-none focus:border-[#C5A059]" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400">Valor (R$)</label>
              <input type="number" required className="w-full border-b border-[#EEE] py-2 text-[12px] outline-none" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400">Tipo</label>
              <select className="w-full border-b border-[#EEE] py-2 text-[10px] font-bold uppercase" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                <option value="INCOME">Entrada (+)</option>
                <option value="EXPENSE">Saída (-)</option>
              </select>
            </div>
          </div>
          <button type="submit" className="w-full bg-[#1A1A1A] text-white py-4 text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-[#C5A059] transition-all">Confirmar Lançamento</button>
        </form>
      </div>
    </div>
  );
}

function FinanceCard({ label, value, trend, icon, color }: any) {
  return (
    <div className="bg-white border border-[#EEECE7] p-8 shadow-sm group hover:border-[#C5A059]/40 transition-all">
      <p className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-[0.3em] mb-4">{label}</p>
      <p className="text-3xl font-serif text-[#1A1A1A]" style={{ color }}>R$ {(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
      {trend && <div className="mt-4 flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{icon} {trend} <span className="text-[#94A3B8] font-medium">vs anterior</span></div>}
    </div>
  );
}

function TransactionRow({ t }: any) {
  return (
    <tr className="hover:bg-[#FCFAF9] transition-colors group">
      <td className="px-10 py-5 text-[11px] text-[#94A3B8]">{new Date(t.date).toLocaleDateString('pt-BR')}</td>
      <td className="px-10 py-5 text-[12px] font-bold uppercase tracking-tight text-[#1A1A1A]">{t.description}</td>
      <td className="px-10 py-5"><span className="text-[8px] font-black border border-[#EEECE7] px-2.5 py-1 text-[#C5A059] bg-[#FCFAF6] uppercase group-hover:border-[#C5A059] transition-all">{t.category}</span></td>
      <td className={`px-10 py-5 text-right font-serif text-[16px] font-bold ${t.type === 'EXPENSE' ? 'text-red-400' : 'text-[#1A1A1A]'}`}>
        {t.type === 'EXPENSE' ? '- ' : ''} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
      </td>
      <td className="px-10 py-5 text-right"><div className={`inline-block w-2.5 h-2.5 rounded-full ${t.type === 'INCOME' ? 'bg-emerald-500' : 'bg-red-400'}`} /></td>
    </tr>
  );
}