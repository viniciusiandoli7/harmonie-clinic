"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bell, Plus, Search } from "lucide-react";
import PatientCard from "@/components/patients/PatientCard";
import CreateSaleModal from "@/components/finance/CreateSaleModal";

export default function PatientsPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<any>(null);

  async function loadPatients() {
    try {
      setLoading(true);
      const res = await fetch("/api/patients?includeInactive=true");
      if (res.ok) {
        const data = await res.json();
        setPatients(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Erro ao carregar pacientes:", error);
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
              className="w-full bg-transparent text-[10px] font-bold uppercase tracking-widest outline-none"
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
        <Link href="/patients/new" className="bg-[#1A1A1A] text-white px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest hover:bg-[#C5A059] flex items-center gap-2">
          <Plus size={14} /> Novo Paciente
        </Link>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <div className="col-span-full text-center py-20 text-gray-400 italic">Sincronizando...</div>
        ) : (
          filtered.map((p) => (
            <PatientCard key={p.id} p={p} onOpenSale={(p) => setSelectedPatient(p)} />
          ))
        )}
      </div>

      {selectedPatient && (
        <CreateSaleModal 
          open={!!selectedPatient} 
          onClose={() => setSelectedPatient(null)} 
          patient={selectedPatient} 
        />
      )}
    </div>
  );
}