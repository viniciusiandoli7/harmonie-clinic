"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ChevronLeft, User, FileText, Layout, DollarSign, 
  Calendar, ShieldCheck, MoreHorizontal, Trash2, Edit3,
  ClipboardList, ArrowRight
} from "lucide-react";
import Link from "next/link";

// Componentes internos
import MedicalRecordSystem from "@/components/patients/MedicalRecordSystem";
import ClinicalEvolutionSection from "@/components/patients/ClinicalEvolutionSection";

export default function PatientDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  
  // ESTADOS
  const [activeTab, setActiveTab] = useState("GERAL");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [patient, setPatient] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [insights, setInsights] = useState<any>(null);
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // CARREGAMENTO INTEGRADO
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        
        const [pRes, aRes, iRes, planRes, salesRes] = await Promise.all([
          fetch(`/api/patients/${id}`),
          fetch(`/api/appointments?patientId=${id}`),
          fetch(`/api/patients/${id}/insights`),
          fetch(`/api/evolution-plans?patientId=${id}`),
          fetch(`/api/sales?patientId=${id}`)
        ]);
        
        // Verificações defensivas (evita erro de JSON se a rota der 404)
        const patientData = pRes.ok ? await pRes.json() : null;
        const appointmentsData = aRes.ok ? await aRes.json() : [];
        const insightsData = iRes.ok ? await iRes.json() : null;
        const salesData = salesRes.ok ? await salesRes.json() : [];
        
        let planData = [];
        if (planRes.ok) {
           const json = await planRes.json();
           planData = Array.isArray(json) ? json : [];
        }

        setPatient(patientData);
        setAppointments(appointmentsData);
        setInsights(insightsData);
        setSales(salesData);
        setPlan(planData[0] || null);

      } catch (error) {
        console.error("Erro ao carregar prontuário Harmonie:", error);
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#FAF8F3]">
      <div className="text-center font-serif italic text-[#C8A35F] animate-pulse">Sincronizando prontuário...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAF8F3] font-sans antialiased text-[#111]">
      
      {/* HEADER FIXO - NAVEGAÇÃO PUSH PARA BASE */}
      <div className="bg-white/90 backdrop-blur-md border-b border-[#EEE] px-10 py-5 sticky top-0 z-40 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => router.push('/patients')} 
            className="p-2 hover:bg-[#FAF8F3] rounded-full transition-all text-[#96A4C1] hover:text-[#111]"
          >
            <ChevronLeft size={22} />
          </button>
          <div className="h-10 w-px bg-[#EEE]" />
          <div>
            <h1 className="text-2xl font-serif uppercase tracking-widest leading-none flex items-center gap-4">
              {patient?.name}
              <div className="relative">
                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-1 hover:bg-gray-100 rounded-full">
                  <MoreHorizontal size={18} className="text-[#BBB]" />
                </button>
                {isMenuOpen && (
                  <div className="absolute left-0 mt-2 w-48 bg-white border border-[#EEE] rounded-sm shadow-xl z-20 animate-in fade-in zoom-in duration-200">
                    <button onClick={() => router.push(`/patients/${id}/edit`)} className="flex items-center gap-3 w-full px-4 py-3 text-[10px] font-bold uppercase hover:bg-[#FAF8F3]">
                      <Edit3 size={14} /> Editar Dados
                    </button>
                    <button className="flex items-center gap-3 w-full px-4 py-3 text-[10px] font-bold uppercase text-red-500 hover:bg-red-50">
                      <Trash2 size={14} /> Excluir Registro
                    </button>
                  </div>
                )}
              </div>
            </h1>
            <p className="text-[9px] font-bold text-[#C8A35F] uppercase tracking-[0.2em] mt-1.5">
              {insights?.status || "Novo Paciente • Em Avaliação"}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
           <button onClick={() => router.push(`/patients/${id}/edit`)} className="px-5 py-2 border border-[#EEE] text-[10px] font-bold uppercase tracking-widest hover:border-[#111]">Editar Dados</button>
           <button className="px-5 py-2 bg-[#111] text-white text-[10px] font-bold uppercase tracking-widest hover:bg-[#C8A35F]">Novo Agendamento</button>
        </div>
      </div>

      {/* SUB-NAVEGAÇÃO */}
      <div className="px-10 mt-8 border-b border-[#EEE]">
        <div className="flex gap-12">
          {[
            { id: "GERAL", label: "Informações", icon: <User size={14}/> },
            { id: "PRONTUARIO", label: "Prontuário & Termos", icon: <FileText size={14}/> },
            { id: "PLANO", label: "Protocolo Clínico", icon: <Layout size={14}/> },
            { id: "FINANCEIRO", label: "Financeiro", icon: <DollarSign size={14}/> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 transition-all relative ${
                activeTab === tab.id ? 'text-[#C8A35F]' : 'text-[#96A4C1] hover:text-[#111]'
              }`}
            >
              {tab.icon} {tab.label}
              {activeTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#C8A35F]" />}
            </button>
          ))}
        </div>
      </div>

      <div className="px-10 py-10 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-12">
        
        <main className="min-h-[60vh]">
          {/* ABA INFORMAÇÕES */}
          {activeTab === "GERAL" && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
                <div className="bg-white border border-[#EEF1F5] p-10 rounded-sm shadow-sm grid grid-cols-3 gap-y-10">
                   <DataField label="WhatsApp" value={patient?.phone} highlight />
                   <DataField label="E-mail" value={patient?.email} />
                   <DataField label="Nascimento" value={patient?.birthDate ? new Date(patient.birthDate).toLocaleDateString('pt-BR') : "—"} />
                   <DataField label="Origem" value={patient?.crmSource || "Instagram"} />
                </div>
                
                <h3 className="text-[11px] font-bold uppercase tracking-[0.4em] text-[#96A4C1] mt-16 mb-8 flex items-center gap-3">
                  <Calendar size={14} /> Histórico de Visitas
                </h3>
                <div className="bg-white border border-[#EEF1F5] rounded-sm shadow-sm overflow-hidden">
                   <table className="w-full text-left">
                      <thead className="bg-[#FCFAF6] border-b border-[#F0F0F0] text-[9px] font-bold uppercase text-[#BBB] tracking-widest">
                         <tr><th className="px-8 py-4">Data</th><th className="px-8 py-4">Procedimento</th><th className="px-8 py-4 text-right">Valor</th></tr>
                      </thead>
                      <tbody className="text-[12px] divide-y divide-[#F9F9F9]">
                         {appointments.map(app => (
                           <tr key={app.id} className="hover:bg-[#FAF8F3]">
                             <td className="px-8 py-4">{new Date(app.date).toLocaleDateString()}</td>
                             <td className="px-8 py-4 font-bold">{app.procedureName || "Consulta"}</td>
                             <td className="px-8 py-4 text-right font-serif">R$ {app.price?.toLocaleString('pt-BR')}</td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
              </div>
          )}

          {/* ABA PRONTUÁRIO */}
          {activeTab === "PRONTUARIO" && (
              <div className="animate-in fade-in duration-500">
                <MedicalRecordSystem patientId={patient.id} patientName={patient.name} />
                <div className="mt-12 pt-12 border-t border-[#EEE]">
                  <ClinicalEvolutionSection patient={{ id: patient.id, name: patient.name }} />
                </div>
              </div>
          )}
          
          {/* ABA PROTOCOLO */}
          {activeTab === "PLANO" && (
            <div className="bg-white border border-[#EEF1F5] p-10 rounded-sm shadow-sm animate-in fade-in duration-500">
               <h3 className="font-serif text-xl uppercase tracking-widest mb-6">
                 {plan ? `Protocolo: ${plan.treatmentName}` : "Nenhum Plano Ativo"}
               </h3>
               {plan ? (
                 <div className="grid grid-cols-2 gap-10">
                    <div className="border-l-2 border-[#C8A35F] pl-6">
                      <p className="text-[10px] font-bold text-[#C8A35F] uppercase tracking-widest mb-1">Sessões</p>
                      <p className="text-lg font-bold">{plan.totalSessions} contratadas</p>
                    </div>
                    <div className="border-l-2 border-[#C8A35F] pl-6">
                      <p className="text-[10px] font-bold text-[#C8A35F] uppercase tracking-widest mb-1">Status</p>
                      <p className="text-sm font-bold uppercase text-emerald-600">{plan.status}</p>
                    </div>
                 </div>
               ) : (
                 <p className="text-sm text-gray-400 italic font-serif">Aguardando fechamento de novo protocolo clínico.</p>
               )}
            </div>
          )}

          {/* ABA FINANCEIRO (COM DADOS DE VENDAS) */}
          {activeTab === "FINANCEIRO" && (
            <div className="bg-white border border-[#EEF1F5] p-10 rounded-sm shadow-sm animate-in fade-in duration-500 font-sans">
               <h3 className="font-serif text-xl uppercase tracking-widest mb-8">Fluxo Financeiro do Paciente</h3>
               <div className="space-y-4">
                 {sales.length > 0 ? sales.map(s => (
                   <div key={s.id} className="flex justify-between items-center border-b pb-4">
                     <div>
                       <p className="text-[10px] font-bold text-gray-400 uppercase">{new Date(s.createdAt).toLocaleDateString()}</p>
                       <p className="text-sm font-bold text-[#111]">{s.service?.name || "Venda Registrada"}</p>
                     </div>
                     <div className="text-right">
                        <p className="font-serif text-lg text-[#111]">R$ {s.finalPrice?.toLocaleString('pt-BR')}</p>
                        <p className="text-[8px] font-bold text-[#C8A35F] uppercase">{s.paymentMethod}</p>
                     </div>
                   </div>
                 )) : (
                   <p className="text-sm text-gray-400 italic">Nenhum registro de venda encontrado para este CPF.</p>
                 )}
               </div>
            </div>
          )}
        </main>

        {/* SIDEBAR DE INSIGHTS */}
        <aside className="space-y-6">
           <div className="bg-white border border-[#EEF1F5] p-8 shadow-lg rounded-sm sticky top-32 transition-all">
              <h4 className="text-[12px] font-serif uppercase tracking-widest mb-8 border-b border-[#F0F0F0] pb-4 flex justify-between items-center">
                Insight Clínico 
                <div className={`w-2 h-2 rounded-full ${appointments.length > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
              </h4>
              
              <div className="space-y-8">
                 <SummaryBox label="Total de Visitas" value={appointments.length.toString()} />
                 <SummaryBox label="Score de Fidelidade" value={appointments.length > 2 ? "ALTO" : "BAIXO"} highlight={appointments.length > 2} />
                 
                 <div className="mt-10 bg-[#FAF8F3] p-5 border border-[#E9DEC9] rounded-sm relative">
                    <div className="absolute -top-3 left-4 bg-[#C8A35F] text-white px-2 py-0.5 text-[7px] font-black uppercase tracking-widest">Atenção</div>
                    <p className="text-[11px] leading-relaxed italic text-[#60759B]">
                       "{patient?.notes || "Nenhuma observação crítica registrada no sistema."}"
                    </p>
                 </div>
              </div>
              
              <button 
                onClick={() => setActiveTab("PRONTUARIO")}
                className="w-full mt-10 py-3 border border-[#EEE] text-[9px] font-bold uppercase tracking-widest hover:bg-[#111] hover:text-white transition-all flex items-center justify-center gap-2"
              >
                  Ver Histórico Completo <ArrowRight size={12}/>
              </button>
           </div>
        </aside>

      </div>
    </div>
  );
}

// SUB-COMPONENTES AUXILIARES
function DataField({ label, value, highlight }: any) {
  return (
    <div>
      <p className="text-[8px] font-bold text-[#BBB] uppercase tracking-[0.2em] mb-1.5">{label}</p>
      <p className={`text-[13px] ${highlight ? 'text-[#C8A35F] font-bold' : 'text-[#111]'}`}>{value || "—"}</p>
    </div>
  );
}

function SummaryBox({ label, value, highlight }: any) {
  return (
    <div className="flex justify-between items-end border-b border-[#F9F9F9] pb-4">
       <span className="text-[9px] font-bold text-[#96A4C1] uppercase tracking-widest">{label}</span>
       <span className={`text-[12px] font-bold ${highlight ? 'text-emerald-600' : 'text-[#111]'}`}>{value}</span>
    </div>
  );
}