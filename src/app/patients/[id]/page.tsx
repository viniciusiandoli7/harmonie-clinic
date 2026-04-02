"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ChevronLeft, User, FileText, Layout, DollarSign, 
  Phone, Mail, Calendar, Plus,
  ShieldCheck, MoreHorizontal, Info
} from "lucide-react";
import Link from "next/link";

// Seus componentes internos
import MedicalRecordSystem from "@/components/patients/MedicalRecordSystem";
import ClinicalEvolutionSection from "@/components/patients/ClinicalEvolutionSection";

export default function PatientDetailPage() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("GERAL");
  const [patient, setPatient] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [insights, setInsights] = useState<any>(null); // PARTE 4: Insights Reais
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        // Busca simultânea de Dados Cadastrais, Agendamentos e os Insights Inteligentes
        const [pRes, aRes, iRes] = await Promise.all([
          fetch(`/api/patients/${id}`),
          fetch(`/api/appointments?patientId=${id}`),
          fetch(`/api/patients/${id}/insights`) // Rota da Parte 4
        ]);
        
        setPatient(await pRes.json());
        setAppointments(await aRes.json());
        setInsights(await iRes.json());
      } catch (error) {
        console.error("Erro ao carregar ficha:", error);
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id]);

  const tabs = [
    { id: "GERAL", label: "Informações", icon: <User size={14}/> },
    { id: "PRONTUARIO", label: "Prontuário & Termos", icon: <FileText size={14}/> },
    { id: "PLANO", label: "Protocolo Clínico", icon: <Layout size={14}/> },
    { id: "FINANCEIRO", label: "Financeiro", icon: <DollarSign size={14}/> },
  ];

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#FAF8F3]">
      <div className="text-center font-serif italic text-[#C8A35F] animate-pulse">
        Carregando universo do paciente...
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAF8F3] font-sans antialiased text-[#111]">
      
      {/* HEADER FIXO DE LUXO */}
      <div className="bg-white/90 backdrop-blur-md border-b border-[#EEE] px-10 py-5 sticky top-0 z-40 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-6">
          <Link href="/patients" className="p-2 hover:bg-[#FAF8F3] rounded-full transition-all text-[#96A4C1] hover:text-[#111]">
            <ChevronLeft size={22} />
          </Link>
          <div className="h-10 w-[1px] bg-[#EEE]" />
          <div>
            <h1 className="text-2xl font-serif uppercase tracking-widest leading-none">{patient?.name}</h1>
            <p className="text-[9px] font-bold text-[#C8A35F] uppercase tracking-[0.2em] mt-1.5">
              {insights?.status === "Ativo" ? "Perfil Premium • Ficha Ativa" : "Novo Paciente • Em Avaliação"}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
           <button className="px-5 py-2 border border-[#EEE] text-[10px] font-bold uppercase tracking-widest hover:border-[#111] transition-all">Editar Dados</button>
           <button className="px-5 py-2 bg-[#111] text-white text-[10px] font-bold uppercase tracking-widest hover:bg-[#C8A35F] transition-all shadow-md">Novo Agendamento</button>
        </div>
      </div>

      {/* SUB-NAVEGAÇÃO */}
      <div className="px-10 mt-8 border-b border-[#EEE]">
        <div className="flex gap-12">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 transition-all relative ${
                activeTab === tab.id ? 'text-[#C8A35F]' : 'text-[#96A4C1] hover:text-[#111]'
              }`}
            >
              {tab.icon} {tab.label}
              {activeTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#C8A35F] animate-in slide-in-from-left duration-300" />}
            </button>
          ))}
        </div>
      </div>

      {/* CONTEÚDO PRINCIPAL + SIDEBAR INTELIGENTE */}
      <div className="px-10 py-10 max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-12">
        
        <main className="min-h-[60vh]">
          {/* ABA: INFORMAÇÕES GERAIS */}
          {activeTab === "GERAL" && (
             <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
                <div className="bg-white border border-[#EEF1F5] p-10 rounded-sm shadow-sm flex gap-16">
                   <div className="grid grid-cols-3 gap-y-10 flex-1">
                      <DataField label="Idade" value={patient?.birthDate ? `${new Date().getFullYear() - new Date(patient.birthDate).getFullYear()} anos` : "—"} />
                      <DataField label="Gênero" value="Feminino" />
                      <DataField label="WhatsApp" value={patient?.phone} highlight />
                      <DataField label="E-mail" value={patient?.email} />
                      <DataField label="Nascimento" value={patient?.birthDate ? new Date(patient.birthDate).toLocaleDateString('pt-BR') : "—"} />
                      <DataField label="Origem" value={patient?.crmSource || "Instagram"} />
                   </div>
                </div>
                
                <h3 className="text-[11px] font-bold uppercase tracking-[0.4em] text-[#96A4C1] mt-16 mb-8 flex items-center gap-3">
                  <Calendar size={14} /> Histórico de Visitas
                </h3>
                <div className="bg-white border border-[#EEF1F5] rounded-sm shadow-sm overflow-hidden">
                   <table className="w-full text-left border-collapse">
                      <thead className="bg-[#FCFAF6] border-b border-[#F0F0F0]">
                        <tr>
                          <th className="px-8 py-4 text-[9px] font-bold uppercase tracking-widest text-[#BBB]">Data</th>
                          <th className="px-8 py-4 text-[9px] font-bold uppercase tracking-widest text-[#BBB]">Procedimento</th>
                          <th className="px-8 py-4 text-[9px] font-bold uppercase tracking-widest text-[#BBB]">Status</th>
                          <th className="px-8 py-4 text-right text-[9px] font-bold uppercase tracking-widest text-[#BBB]">Investimento</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F9F9F9]">
                        {appointments.length === 0 ? (
                          <tr><td colSpan={4} className="px-8 py-10 text-center text-xs text-[#96A4C1] italic">Nenhum atendimento registrado.</td></tr>
                        ) : appointments.map(app => (
                          <tr key={app.id} className="hover:bg-[#FAF8F3] transition-colors">
                            <td className="px-8 py-5 text-[12px] font-medium">{new Date(app.date).toLocaleDateString('pt-BR')}</td>
                            <td className="px-8 py-5 text-[11px] font-bold uppercase tracking-wide">{app.procedureName || "Consulta"}</td>
                            <td className="px-8 py-5 text-[9px] font-black tracking-widest text-[#4A9B68]">{app.status}</td>
                            <td className="px-8 py-5 text-right text-[14px] font-serif font-bold text-[#111]">R$ {app.price?.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                          </tr>
                        ))}
                      </tbody>
                   </table>
                </div>
             </div>
          )}

          {activeTab === "PRONTUARIO" && (
             <div className="animate-in fade-in duration-500">
                <MedicalRecordSystem patientId={patient.id} patientName={patient.name} />
                <div className="mt-12 pt-12 border-t border-[#EEE]">
                  <ClinicalEvolutionSection patient={{ id: patient.id, name: patient.name }} />
                </div>
             </div>
          )}
          
          {/* ... Outras abas mantidas conforme seu original ... */}
          {activeTab === "PLANO" && <div className="text-sm italic text-gray-400">Carregando Protocolo...</div>}
          {activeTab === "FINANCEIRO" && <div className="text-sm italic text-gray-400">Carregando Fluxo de Caixa...</div>}
        </main>

        {/* SIDEBAR DE INSIGHTS REAIS (PARTE 4 INTEGRADA) */}
        <aside className="space-y-6">
           <div className="bg-white border border-[#EEF1F5] p-8 shadow-lg rounded-sm sticky top-32 transition-all">
              <h4 className="text-[12px] font-serif uppercase tracking-widest mb-8 border-b border-[#F0F0F0] pb-4 flex justify-between items-center text-[#111]">
                Insight Clínico 
                <div className={`w-2 h-2 rounded-full ${insights?.totalVisits > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
              </h4>
              
              <div className="space-y-8">
                 {/* DADOS CALCULADOS PELA API */}
                 <SummaryBox label="Total de Visitas" value={insights?.totalVisits?.toString() || "0"} />
                 <SummaryBox label="Último Procedimento" value={insights?.lastProcedure || "---"} highlight />
                 <SummaryBox label="Score de Fidelidade" value={insights?.loyaltyScore || "---"} serif />
                 
                 {/* OBSERVAÇÃO CRÍTICA (Busca do campo 'notes' do Prisma) */}
                 <div className="mt-10 bg-[#FAF8F3] p-5 border border-[#E9DEC9] rounded-sm relative">
                    <div className="absolute -top-3 left-4 bg-[#C8A35F] text-white px-2 py-0.5 text-[7px] font-black uppercase tracking-widest">Atenção</div>
                    <p className="text-[9px] font-bold text-[#C8A35F] uppercase tracking-widest mb-2 flex items-center gap-2">
                       <ShieldCheck size={12}/> Observação Crítica
                    </p>
                    <p className="text-[11px] leading-relaxed italic text-[#60759B]">
                       "{insights?.criticalObservation || "Nenhuma observação clínica relevante registrada para este perfil."}"
                    </p>
                 </div>
              </div>
              
              <button className="w-full mt-10 py-3 border border-[#EEE] text-[9px] font-bold uppercase tracking-widest hover:bg-[#111] hover:text-white transition-all">
                 Ver Histórico Completo
              </button>
           </div>
        </aside>

      </div>
    </div>
  );
}

// Sub-componentes Reutilizáveis
function DataField({ label, value, highlight }: { label: string, value: string, highlight?: boolean }) {
  return (
    <div className="group cursor-default">
      <p className="text-[8px] font-bold text-[#BBB] uppercase tracking-[0.2em] mb-1.5 transition-colors group-hover:text-[#C8A35F]">{label}</p>
      <p className={`text-[13px] font-medium transition-all ${highlight ? 'text-[#C8A35F] font-bold' : 'text-[#111]'}`}>{value || "—"}</p>
    </div>
  );
}

function SummaryBox({ label, value, highlight, serif }: { label: string, value: string, highlight?: boolean, serif?: boolean }) {
  return (
    <div className="flex justify-between items-end border-b border-[#F9F9F9] pb-4 transition-all hover:translate-x-1">
       <span className="text-[9px] font-bold text-[#96A4C1] uppercase tracking-widest">{label}</span>
       <span className={`text-[12px] font-bold ${highlight ? 'text-[#C8A35F]' : 'text-[#111]'} ${serif ? 'font-serif text-xl' : ''}`}>{value}</span>
    </div>
  );
}