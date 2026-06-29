"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ChevronLeft, User, FileText, Layout, DollarSign, 
  Calendar, ShieldCheck, MoreHorizontal, Trash2, Edit3,
  PenTool, Images, Clock3, MessageCircle
} from "lucide-react";
import Link from "next/link";

// Componentes internos
import ClinicalEvolutionSection from "@/components/patients/ClinicalEvolutionSection";
import PatientTreatmentPlanSection from "@/components/patients/PatientTreatmentPlanSection";
import PatientSafetySection from "@/components/patients/PatientSafetySection";
import PatientPostCareSection from "@/components/patients/PatientPostCareSection";
import StructuredEvolutionPremiumSection from "@/components/patients/StructuredEvolutionPremiumSection";
import { generateContractPdf } from "@/lib/contractPdf";

export default function PatientDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  
  // ESTADOS
  const [activeTab, setActiveTab] = useState("GERAL");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [patient, setPatient] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]); // 👈 Estado dos contratos
  const [timeline, setTimeline] = useState<any[]>([]);
  const [insights, setInsights] = useState<any>(null);
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // CARREGAMENTO INTEGRADO
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        
        const [pRes, aRes, iRes, planRes, salesRes, contractsRes, timelineRes] = await Promise.all([
          fetch(`/api/patients/${id}`),
          fetch(`/api/appointments?patientId=${id}`),
          fetch(`/api/patients/${id}/insights`),
          fetch(`/api/patients/${id}/evolution`), 
          fetch(`/api/sales?patientId=${id}`),
          fetch(`/api/patients/${id}/contracts`), // 👈 Busca os contratos
          fetch(`/api/patients/${id}/timeline`)
        ]);
        
        const patientData = pRes.ok ? await pRes.json() : null;
        const appointmentsData = aRes.ok ? await aRes.json() : [];
        const insightsData = iRes.ok ? await iRes.json() : null;
        const salesData = salesRes.ok ? await salesRes.json() : [];
        const contractsData = contractsRes.ok ? await contractsRes.json() : [];
        const timelineData = timelineRes.ok ? await timelineRes.json() : { timeline: [] };
        
        let planData = [];
        if (planRes.ok) {
           const json = await planRes.json();
           planData = Array.isArray(json) ? json : [];
        }

        setPatient(patientData);
        setAppointments(appointmentsData);
        setInsights(insightsData);
        setSales(salesData);
        setContracts(contractsData);
        setTimeline(timelineData.timeline || []);
        setPlan(planData[0] || null);

      } catch (error) {
        console.error("Erro ao carregar prontuário Mariana Thomaz Carmona:", error);
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id]);

  const handleDeleteSale = async (saleId: string) => {
    const confirmDelete = window.confirm("ATENÇÃO: Excluir esta venda também apagará os registros dela do Financeiro da clínica. Deseja continuar?");
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/sales/${saleId}`, { method: "DELETE" });
      if (res.ok) {
        setSales(sales.filter(s => s.id !== saleId));
        alert("Venda e transações financeiras excluídas com sucesso!");
      } else {
          alert("Falha ao excluir a venda.")
      }
    } catch (error) {
      console.error("Erro ao deletar", error);
    }
  };

  // --- WHATSAPP CONTRATOS ---
  const sendWhatsAppContract = (contract: any) => {
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/assinar-contrato/${contract.token}`;
    const phone = patient?.phone ? patient.phone.replace(/\D/g, '') : '';
    const message = `Olá, ${patient?.name}! 🌟\n\nAqui é da *Dra. Mariana Thomaz Carmona*.\nSegue o link seguro para você assinar digitalmente o seu contrato:\n\n${link}`;

    if (phone) {
      window.open(`https://api.whatsapp.com/send?phone=55${phone}&text=${encodeURIComponent(message)}`, '_blank');
    } else {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, '_blank');
    }
  };

  const normalizeContractItems = (itemsJson: any, total: number) => {
    if (Array.isArray(itemsJson)) {
      return itemsJson.map((item) => ({
        description: item.description || item.productName || "Procedimento",
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice || item.price || 0,
        total: item.total || item.totalPrice || ((Number(item.unitPrice || item.price || 0)) * Number(item.quantity || 1)),
        observation: item.observation || "",
      }));
    }

    if (itemsJson && typeof itemsJson === "object") {
      return [{
        description: itemsJson.service || itemsJson.description || "Procedimento estético",
        quantity: itemsJson.quantity || 1,
        unitPrice: itemsJson.price || total || 0,
        total: total || itemsJson.price || 0,
        observation: itemsJson.observation || "",
      }];
    }

    return [{
      description: "Procedimento estético",
      quantity: 1,
      unitPrice: total || 0,
      total: total || 0,
      observation: "",
    }];
  };

  const downloadContractPdf = async (contract: any) => {
    try {
      const items = normalizeContractItems(contract.itemsJson, Number(contract.total || 0));
      const subtotal = items.reduce((sum: number, item: any) => sum + Number(item.total || 0), 0) || Number(contract.total || 0);

      await generateContractPdf({
        filename: `${String(contract.title || "contrato")
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "") || "contrato"}-${new Date(contract.createdAt).toISOString().slice(0, 10)}.pdf`,
        title: contract.title || "Contrato de Prestação de Serviços Estéticos",
        patient: {
          name: patient?.name,
          cpf: patient?.cpf,
          rg: patient?.rg,
          phone: patient?.phone,
          birthDate: patient?.birthDate,
        },
        clinic: {
          companyName: "Mariana Thomaz Carmona",
          cnpj: "57.007.483/0001-73",
          address: "Avenida Coronel Sezefredo Fagundes, Nº 2168",
          email: "contato@marianathomazcarmona.com",
        },
        items,
        subtotal,
        discount: 0,
        total: Number(contract.total || subtotal || 0),
        paymentMethodLabel: "Conforme venda registrada",
        paymentDetails: "Contrato gerado a partir do fechamento da venda.",
        contentHtml: contract.content,
        contractDate: contract.createdAt,
        status: contract.status,
        signatureName: contract.signatureName,
        signatureImage: contract.signatureImage,
        signedAt: contract.signedAt,
      });
    } catch (error) {
      console.error("Erro ao gerar PDF do contrato:", error);
      alert("Não foi possível gerar o PDF do contrato.");
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#F7F2EA]">
      <div className="text-center font-serif italic text-[#5A1F2B] animate-pulse">Sincronizando prontuário...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F7F2EA] font-sans antialiased text-[#1E1A18]">
      
      {/* HEADER FIXO */}
      <div className="bg-white/90 backdrop-blur-md border-b border-[#EEE] px-10 py-5 sticky top-0 z-40 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-6">
          <button onClick={() => router.push('/patients')} className="p-2 hover:bg-[#F7F2EA] rounded-full transition-all text-[#5B3A2E99] hover:text-[#1E1A18]">
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
                    <button onClick={() => router.push(`/patients/${id}/edit`)} className="flex items-center gap-3 w-full px-4 py-3 text-[10px] font-bold uppercase hover:bg-[#F7F2EA]">
                      <Edit3 size={14} /> Editar Dados
                    </button>
                  </div>
                )}
              </div>
            </h1>
            <p className="text-[9px] font-bold text-[#5A1F2B] uppercase tracking-[0.2em] mt-1.5">
              {patient?.crmStatus || insights?.status || "Novo Lead • Em Avaliação"}
            </p>
          </div>
        </div>
      </div>

      {/* SUB-NAVEGAÇÃO */}
      <div className="px-10 mt-8 border-b border-[#EEE]">
        <div className="flex gap-12">
          {[
            { id: "GERAL", label: "Informações", icon: <User size={14}/> },
            { id: "TIMELINE", label: "Timeline", icon: <Clock3 size={14}/> },
            { id: "PRONTUARIO", label: "Prontuário & Evolução", icon: <FileText size={14}/> },
            { id: "SEGURANCA", label: "Segurança", icon: <ShieldCheck size={14}/> },
            { id: "PLANO", label: "Plano de Tratamento", icon: <Layout size={14}/> },
            { id: "WHATSAPP", label: "Pós & WhatsApp", icon: <MessageCircle size={14}/> },
            { id: "CONTRATOS", label: "Contratos", icon: <PenTool size={14}/> },
            { id: "FINANCEIRO", label: "Financeiro", icon: <DollarSign size={14}/> },
            { id: "GALERIA", label: "Antes e Depois", icon: <Images size={14}/> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 transition-all relative ${
                activeTab === tab.id ? 'text-[#5A1F2B]' : 'text-[#5B3A2E99] hover:text-[#1E1A18]'
              }`}
            >
              {tab.icon} {tab.label}
              {activeTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#5A1F2B]" />}
            </button>
          ))}
        </div>
      </div>

      <div className="px-10 py-10 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-12">
        
        <main className="min-h-[60vh]">
          {/* ABA INFORMAÇÕES */}
          {activeTab === "GERAL" && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
                <div className="bg-white border border-[rgba(90,31,43,.10)] p-10 rounded-sm shadow-sm grid grid-cols-3 gap-y-10">
                   <DataField label="WhatsApp" value={patient?.phone} highlight />
                   <DataField label="E-mail" value={patient?.email} />
                   <DataField label="Nascimento" value={patient?.birthDate ? new Date(patient.birthDate).toLocaleDateString('pt-BR') : "—"} />
                   <DataField label="Origem" value={patient?.crmSource || "—"} />
                   <DataField label="Indicação" value={patient?.referralName || "—"} />
                   <DataField label="Status CRM" value={patient?.crmStatus || "Novo Lead"} highlight />
                   <DataField label="Imagem autorizada" value={patient?.imageAuthorized ? "Sim" : "Não"} />
                </div>
                
                <h3 className="text-[11px] font-bold uppercase tracking-[0.4em] text-[#5B3A2E99] mt-16 mb-8 flex items-center gap-3">
                  <Calendar size={14} /> Histórico de Visitas
                </h3>
                <div className="bg-white border border-[rgba(90,31,43,.10)] rounded-sm shadow-sm overflow-hidden">
                   <table className="w-full text-left">
                      <thead className="bg-[#FCFAF6] border-b border-[#F0F0F0] text-[9px] font-bold uppercase text-[#BBB] tracking-widest">
                         <tr><th className="px-8 py-4">Data</th><th className="px-8 py-4">Procedimento</th><th className="px-8 py-4 text-right">Valor</th></tr>
                      </thead>
                      <tbody className="text-[12px] divide-y divide-[#F9F9F9]">
                         {appointments.map(app => (
                           <tr key={app.id} className="hover:bg-[#F7F2EA]">
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


          {/* ABA TIMELINE DO PACIENTE */}
          {activeTab === "TIMELINE" && (
            <div className="bg-white border border-[rgba(90,31,43,.10)] p-10 rounded-sm shadow-sm animate-in fade-in duration-500">
              <h3 className="font-serif text-xl uppercase tracking-widest mb-8">Timeline da Paciente</h3>
              <div className="space-y-5">
                {timeline.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-[#5A1F2B]/20 bg-[#F7F2EA]/60 p-10 text-center text-sm text-[#5B3A2E]/60">Nenhum evento registrado ainda.</div>
                ) : timeline.slice(0, 40).map((item: any, index: number) => (
                  <div key={`${item.type}-${item.date}-${index}`} className="relative flex gap-5 border-l border-[#5A1F2B]/20 pl-6 pb-5 last:pb-0">
                    <div className="absolute -left-2 top-0 h-4 w-4 rounded-full bg-[#5A1F2B] border-2 border-[#F7F2EA]" />
                    <div className="flex-1 rounded-2xl border border-[rgba(90,31,43,.10)] bg-[#F7F2EA]/60 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[#5A1F2B]">{item.type}</p>
                          <p className="mt-1 text-sm font-bold text-[#1E1A18]">{item.title}</p>
                          <p className="mt-1 text-[12px] text-[#5B3A2E]/70">{item.detail}</p>
                        </div>
                        <span className="text-[11px] text-[#5B3A2E]/55">{new Date(item.date).toLocaleDateString("pt-BR")}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ABA GALERIA ANTES E DEPOIS */}
          {activeTab === "GALERIA" && (
            <div className="bg-white border border-[rgba(90,31,43,.10)] p-10 rounded-sm shadow-sm animate-in fade-in duration-500">
              <h3 className="font-serif text-xl uppercase tracking-widest mb-4">Galeria Antes e Depois</h3>
              <p className="text-sm text-gray-500 leading-7 max-w-2xl">
                Fotos clínicas e registros autorizados ficam separados para proteger o prontuário da paciente e facilitar o uso apenas quando houver autorização.
              </p>
              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {(patient?.photos || []).length === 0 ? (
                  <div className="md:col-span-2 rounded-3xl border border-dashed border-[#5A1F2B]/20 bg-[#F7F2EA]/60 p-10 text-center text-sm text-[#5B3A2E]/60">
                    Nenhuma imagem cadastrada ainda.
                  </div>
                ) : (patient?.photos || []).map((photo: any) => (
                  <div key={photo.id} className="rounded-3xl border border-[rgba(90,31,43,.10)] bg-[#F7F2EA]/60 p-5">
                    {photo.imageUrl && <img src={photo.imageUrl} alt={photo.title || "Registro clínico"} className="mb-4 h-56 w-full rounded-2xl object-cover" />}
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#5A1F2B]">{new Date(photo.takenAt).toLocaleDateString("pt-BR")}</p>
                    <p className="mt-2 text-sm font-bold text-[#1E1A18]">{photo.title || photo.procedureName || "Registro clínico"}</p>
                    <p className="mt-2 text-[12px] text-[#5B3A2E]/65">Tipo: {photo.photoType} • Autorização: {photo.imageAuthorized ? "Sim" : "Não"}</p>
                    {photo.notes && <p className="mt-3 text-[12px] leading-6 text-[#5B3A2E]/65">{photo.notes}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ABA PRONTUÁRIO COM ASSINATURA AUTOMÁTICA */}
          {activeTab === "PRONTUARIO" && (
              <div className="animate-in fade-in duration-500">
                <ClinicalEvolutionSection 
                  patient={{ id: patient.id, name: patient.name, phone: patient.phone }} 
                  contractSignature={contracts.find(c => c.status === "SIGNED")?.signatureImage}
                />
                <StructuredEvolutionPremiumSection patientId={patient.id} />
              </div>
          )}
          
          {/* ABA SEGURANÇA */}
          {activeTab === "SEGURANCA" && patient?.id && (
            <PatientSafetySection patientId={patient.id} />
          )}

          {/* ABA PLANO DE TRATAMENTO */}
          {activeTab === "PLANO" && patient?.id && (
            <PatientTreatmentPlanSection patientId={patient.id} />
          )}

          {/* ABA WHATSAPP E PÓS */}
          {activeTab === "WHATSAPP" && patient?.id && (
            <PatientPostCareSection patient={{ id: patient.id, name: patient.name, phone: patient.phone }} />
          )}

          {/* ABA PROTOCOLO LEGADO */}
          {false && activeTab === "PLANO" && (
            <div className="bg-white border border-[rgba(90,31,43,.10)] p-10 rounded-sm shadow-sm animate-in fade-in duration-500">
               <h3 className="font-serif text-xl uppercase tracking-widest mb-6">
                 {plan ? `Protocolo: ${plan.treatmentName}` : "Nenhum Plano Ativo"}
               </h3>
               {plan ? (
                 <div className="grid grid-cols-2 gap-10">
                    <div className="border-l-2 border-[#5A1F2B] pl-6">
                      <p className="text-[10px] font-bold text-[#5A1F2B] uppercase tracking-widest mb-1">Sessões</p>
                      <p className="text-lg font-bold">{plan.totalSessions} contratadas</p>
                    </div>
                    <div className="border-l-2 border-[#5A1F2B] pl-6">
                      <p className="text-[10px] font-bold text-[#5A1F2B] uppercase tracking-widest mb-1">Status</p>
                      <p className="text-sm font-bold uppercase text-emerald-600">{plan.status}</p>
                    </div>
                 </div>
               ) : (
                 <p className="text-sm text-gray-400 italic font-serif">Aguardando fechamento de novo protocolo clínico.</p>
               )}
            </div>
          )}

          {/* ABA CONTRATOS */}
          {activeTab === "CONTRATOS" && (
            <div className="bg-white border border-[rgba(90,31,43,.10)] p-10 rounded-sm shadow-sm animate-in fade-in duration-500 font-sans">
               <h3 className="font-serif text-xl uppercase tracking-widest mb-8">Contratos Gerados</h3>
               <div className="space-y-4">
                 {contracts.length > 0 ? contracts.map(c => (
                   <div key={c.id} className="flex justify-between items-center border-b pb-4 group">
                     <div>
                       <p className="text-[10px] font-bold text-gray-400 uppercase">{new Date(c.createdAt).toLocaleDateString()}</p>
                       <p className="text-sm font-bold text-[#1E1A18]">{c.title}</p>
                     </div>
                     <div className="flex items-center gap-3 text-right">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded">
                             {c.status === "SIGNED" ? (
                               <span className="text-emerald-600 bg-emerald-50 px-3 py-1 rounded">✅ Assinado</span>
                             ) : (
                               <span className="text-amber-600 bg-amber-50 px-3 py-1 rounded">⏳ Pendente</span>
                             )}
                          </p>
                        </div>

                        <button
                          onClick={() => downloadContractPdf(c)}
                          className="text-[9px] border border-[#C8A35F] bg-[#FAF8F3] text-[#5A1F2B] px-4 py-2 rounded font-bold uppercase tracking-widest hover:bg-[#F7F2EA] transition-colors flex items-center gap-2 shadow-sm"
                        >
                           <FileText size={12}/> PDF
                        </button>

                        {c.status !== "SIGNED" && (
                          <button
                            onClick={() => sendWhatsAppContract(c)}
                            className="text-[9px] border border-emerald-200 bg-emerald-50 text-emerald-700 px-4 py-2 rounded font-bold uppercase tracking-widest hover:bg-emerald-100 transition-colors flex items-center gap-2 shadow-sm"
                          >
                             <FileText size={12}/> Enviar WhatsApp
                          </button>
                        )}

                        {c.status === "SIGNED" && c.signatureImage && (
                          <img src={c.signatureImage} alt="Visto" className="h-8 object-contain" />
                        )}
                     </div>
                   </div>
                 )) : (
                   <p className="text-sm text-gray-400 italic">Nenhum contrato encontrado.</p>
                 )}
               </div>
            </div>
          )}

          {/* ABA FINANCEIRO */}
          {activeTab === "FINANCEIRO" && (
            <div className="bg-white border border-[rgba(90,31,43,.10)] p-10 rounded-sm shadow-sm animate-in fade-in duration-500 font-sans">
               <h3 className="font-serif text-xl uppercase tracking-widest mb-8">Fluxo Financeiro do Paciente</h3>
               <div className="space-y-4">
                 {sales.length > 0 ? sales.map(s => (
                   <div key={s.id} className="flex justify-between items-center border-b pb-4 group">
                     <div>
                       <p className="text-[10px] font-bold text-gray-400 uppercase">{new Date(s.createdAt).toLocaleDateString()}</p>
                       <p className="text-sm font-bold text-[#1E1A18]">{s.service?.name || "Venda Registrada"}</p>
                     </div>
                     <div className="flex items-center gap-6 text-right">
                        <div>
                          <p className="font-serif text-lg text-[#1E1A18]">R$ {s.finalPrice?.toLocaleString('pt-BR')}</p>
                          <p className="text-[8px] font-bold text-[#5A1F2B] uppercase">Venda Concluída</p>
                        </div>
                        <button 
                          onClick={() => handleDeleteSale(s.id)}
                          className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
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
           <div className="bg-white border border-[rgba(90,31,43,.10)] p-8 shadow-lg rounded-sm sticky top-32 transition-all">
              <h4 className="text-[12px] font-serif uppercase tracking-widest mb-8 border-b border-[#F0F0F0] pb-4 flex justify-between items-center">
                Insight Clínico 
                <div className={`w-2 h-2 rounded-full ${appointments.length > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
              </h4>
              
              <div className="space-y-8">
                 <SummaryBox label="Total de Visitas" value={appointments.length.toString()} />
                 <SummaryBox label="Score de Fidelidade" value={appointments.length > 2 ? "ALTO" : "BAIXO"} highlight={appointments.length > 2} />
                 
                 <div className="mt-10 bg-[#F7F2EA] p-5 border border-[#E9DEC9] rounded-sm relative">
                    <div className="absolute -top-3 left-4 bg-[#5A1F2B] text-white px-2 py-0.5 text-[7px] font-black uppercase tracking-widest">Atenção</div>
                    <p className="text-[11px] leading-relaxed italic text-[#60759B]">
                       “{patient?.notes || "Nenhuma observação crítica registrada no sistema."}”
                    </p>
                 </div>
              </div>
           </div>
        </aside>

      </div>
    </div>
  );
}

// COMPONENTES AUXILIARES
function DataField({ label, value, highlight }: any) {
  return (
    <div>
      <p className="text-[8px] font-bold text-[#BBB] uppercase tracking-[0.2em] mb-1.5">{label}</p>
      <p className={`text-[13px] ${highlight ? 'text-[#5A1F2B] font-bold' : 'text-[#1E1A18]'}`}>{value || "—"}</p>
    </div>
  );
}

function SummaryBox({ label, value, highlight }: any) {
  return (
    <div className="flex justify-between items-end border-b border-[#F9F9F9] pb-4">
       <span className="text-[9px] font-bold text-[#5B3A2E99] uppercase tracking-widest">{label}</span>
       <span className={`text-[12px] font-bold ${highlight ? 'text-emerald-600' : 'text-[#1E1A18]'}`}>{value}</span>
    </div>
  );
}