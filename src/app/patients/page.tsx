"use client";

import Link from "next/link";
import CreateSaleModal from "@/components/finance/CreateSaleModal";
import { useEffect, useMemo, useState } from "react";
import { Bell, Plus, Search, Phone, User, Filter, MoreHorizontal, Mail, CalendarDays } from "lucide-react";

export default function PatientsPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [saleModalPatient, setSaleModalPatient] = useState<any>(null);

  async function loadPatients() {
    try {
      setLoading(true);
      const res = await fetch("/api/patients?includeInactive=true");
      const data = await res.json();
      setPatients(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadPatients(); }, []);

  const filtered = useMemo(() => {
    return patients.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()));
  }, [patients, search]);

  return (
    <div className="min-h-screen bg-[#FDFDFD] px-8 py-8 md:px-12 font-sans antialiased text-[#1A1A1A]">
      
      {/* HEADER MINIMALISTA (AJUSTE DE CORES PARA ALTO CONTRASTE) */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[#F5F5F5] pb-8 gap-6">
        <div>
          <p className="text-[10px] uppercase tracking-[0.4em] text-[#C5A059] font-bold">Harmonie Executive</p>
          <h1 className="mt-2 text-4xl font-serif text-[#1A1A1A]">Pacientes CRM</h1>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex h-10 w-72 items-center gap-3 border-b border-[#EEECE7] transition-colors focus-within:border-[#C5A059]">
            <Search size={14} className="text-[#BBB]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="BUSCAR PACIENTE..."
              className="w-full bg-transparent text-[10px] font-bold uppercase tracking-widest outline-none placeholder:text-[#BBB]"
            />
          </div>
          <button className="relative text-[#BBB] hover:text-[#1A1A1A]">
            <Bell size={18} strokeWidth={1.5} />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[#C5A059]" />
          </button>
        </div>
      </div>

      <div className="mt-10 flex items-center justify-between">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#94A3B8]">Base de Clientes</h2>
        <Link href="/patients/new" className="bg-[#1A1A1A] text-white px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest hover:bg-[#C5A059] transition-all flex items-center gap-2 shadow-sm">
          <Plus size={14} /> Novo Paciente
        </Link>
      </div>

      {/* GRID DE CARDS DELICADOS COM AVATAR CLARO */}
      <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((p) => (
          <div key={p.id} className="group bg-white border border-[#EEECE7] p-7 transition-all duration-300 hover:border-[#C5A059]/40 hover:shadow-lg rounded-sm">
            <div className="flex justify-between items-start mb-6">
              
              {/* AVATAR CLARO - REMOVIDO O PRETO */}
              <div className="h-14 w-14 flex items-center justify-center border border-[#EEECE7] bg-[#FCFAF6] text-2xl font-serif font-medium text-[#C5A059] rounded-none shadow-sm group-hover:border-[#C5A059] transition-colors">
                {p.name[0]}
              </div>
              
              <div className="flex flex-col items-end gap-2">
                 <span className={`px-2.5 py-1 text-[8px] font-bold uppercase tracking-widest border rounded-none ${p.isActive === false ? 'text-gray-400 border-[#EEECE7]' : 'text-[#C5A059] border-[#C5A059] bg-[#FCFAF6]'}`}>
                   {p.isActive === false ? "Inativo" : "Ativo"}
                 </span>
                 <button className="text-gray-300 hover:text-[#1A1A1A] transition-colors"><MoreHorizontal size={14}/></button>
              </div>
            </div>

            <h3 className="text-[20px] font-serif mb-1 text-[#1A1A1A] group-hover:text-[#C5A059] transition-colors">{p.name}</h3>
            <p className="text-[11px] text-[#94A3B8] font-semibold tracking-tight mb-6 flex items-center gap-2">
              <Phone size={12} className="text-[#C5A059]" /> {p.phone || "Não informado"}
            </p>

            <div className="grid grid-cols-2 gap-4 pt-5 border-t border-[#F5F5F5] space-y-3">
              <div className="flex items-center gap-3">
                 <Mail size={14} className="text-[#C5A059]" />
                 <div>
                    <p className="text-[8px] font-bold text-[#BBB] uppercase tracking-widest mb-1">E-mail</p>
                    <p className="text-[11px] font-medium text-[#1A1A1A] truncate w-full">{p.email || "—"}</p>
                 </div>
              </div>
              <div className="flex items-center gap-3 justify-end text-right">
                 <CalendarDays size={14} className="text-[#C5A059]" />
                 <div>
                    <p className="text-[8px] font-bold text-[#BBB] uppercase tracking-widest mb-1">Desde</p>
                    <p className="text-[11px] font-medium text-[#1A1A1A]">{p.createdAt ? new Date(p.createdAt).toLocaleDateString('pt-BR', {month: 'short', year: 'numeric'}) : "—"}</p>
                 </div>
              </div>
            </div>

            {/* BOTÕES DE AÇÃO REFINADOS (QUINA SECA) */}
            <div className="mt-8 flex gap-2 pt-6 border-t border-[#F5F5F5] opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
              <Link href={`/patients/${p.id}`} className="flex-1 bg-white text-[#1A1A1A] py-2.5 text-[9px] font-bold uppercase tracking-widest text-center border border-[#EEECE7] hover:bg-[#1A1A1A] hover:text-white rounded-none transition-colors">Abrir Ficha</Link>
              <button onClick={() => setSaleModalPatient(p)} className="flex-1 bg-[#C5A059] text-white py-2.5 text-[9px] font-bold uppercase tracking-widest shadow-sm hover:bg-[#1A1A1A] rounded-none transition-colors">Fechar Venda</button>
            </div>
          </div>
        ))}
      </div>

      <CreateSaleModal open={!!saleModalPatient} onClose={() => setSaleModalPatient(null)} patient={saleModalPatient} />
    </div>
  );
}