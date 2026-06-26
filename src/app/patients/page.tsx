"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import PatientCard from "@/components/patients/PatientCard";
import CreateSaleModal from "@/components/finance/CreateSaleModal";
import NotificationBell from "@/components/notifications/NotificationBell";

// Separamos o conteúdo principal para o Suspense poder protegê-lo
function PatientsContent() {
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
    const term = search.trim().toLowerCase();
    if (!term) return patients;
    return patients.filter((p) => [p.name, p.phone, p.cpf, p.email, p.crmSource, p.crmStatus]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(term)
    );
  }, [patients, search]);

  return (
    <div className="min-h-screen bg-[#FDFDFD] px-8 py-8 md:px-12 font-sans antialiased text-[#1E1A18]">
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[#F5F5F5] pb-8 gap-6">
        <div>
          <p className="text-[10px] uppercase tracking-[0.4em] text-[#5A1F2B] font-bold">Mariana Executive</p>
          <h1 className="mt-2 text-4xl font-serif text-[#1E1A18]">Pacientes CRM</h1>
        </div>
        <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center md:gap-4">
          <div className="search-shell flex h-12 w-full items-center gap-3 rounded-full border border-[rgba(90,31,43,.12)] bg-brand-surface px-4 shadow-card md:w-80">
            <Search size={15} className="shrink-0 text-brand-primary/55" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar paciente, telefone ou CPF"
              className="patient-search-input h-full min-w-0 flex-1 border-0 bg-transparent text-[12px] font-semibold outline-none"
            />
          </div>
          <NotificationBell />
        </div>
      </div>

      <div className="mt-10 flex items-center justify-between">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#94A3B8]">Base de Clientes</h2>
        <Link href="/patients/new" className="bg-[#1E1A18] text-white px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest hover:bg-[#5A1F2B] flex items-center gap-2">
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

// A página principal agora exporta o conteúdo envelopado e protegido
export default function PatientsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-400 italic">Carregando CRM...</div>}>
      <PatientsContent />
    </Suspense>
  );
}