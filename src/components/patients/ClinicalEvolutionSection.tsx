"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity, Camera, FileText, Pencil, Plus, Trash2, 
  X, CheckCircle2, ShieldCheck, Stethoscope
} from "lucide-react";

type Patient = { id: string; name: string; phone?: string | null; };

type EvolutionSession = {
  id: string;
  sessionNumber: number;
  sessionDate: string;
  performedProcedure?: string | null;
  bodyMeasurements?: string | null;
  clinicalNotes?: string | null;
  imagesJson?: any; 
};

type EvolutionPlan = {
  id: string;
  treatmentName: string;
  packageName?: string | null;
  totalSessions: number;
  completedSessions: number;
  status: "ACTIVE" | "FINISHED" | "CANCELED";
  sessions: EvolutionSession[];
};

type Props = { patient: Patient; contractSignature?: string | null; };

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric"
  });
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.18em] text-[#96A4C1]">{children}</label>;
}

// ☁️ MOTOR CLOUDINARY
async function uploadToCloudinary(file: File) {
  const cloudName = "domf1tnzd"; 
  const uploadPreset = "harmonie_fotos"; 
  
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { 
    method: "POST", 
    body: formData 
  });
  
  const data = await res.json();
  if (!res.ok) {
    console.error("DETALHE DO ERRO CLOUDINARY:", data);
    throw new Error(data.error?.message || "Erro no upload");
  }
  return data.secure_url; 
}

export default function ClinicalEvolutionSection({ patient, contractSignature }: Props) {
  const [plans, setPlans] = useState<EvolutionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);

  // Estados para Prontuário Manual (SEM VENDA)
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualTreatmentName, setManualTreatmentName] = useState("");
  const [manualSessions, setManualSessions] = useState(1);
  const [creatingManual, setCreatingManual] = useState(false);

  // Estados para nova sessão dentro do prontuário
  const [sessionNumber, setSessionNumber] = useState(1);
  const [performedProcedure, setPerformedProcedure] = useState("");
  const [bodyMeasurements, setBodyMeasurements] = useState("");
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  async function loadPlans() {
    setLoading(true);
    try {
      const res = await fetch(`/api/patients/${patient.id}/evolution`, { cache: "no-store" });
      const data = await res.json();
      setPlans(Array.isArray(data) ? data : []);
    } catch (err) { 
      console.error(err); 
    } finally { 
      setLoading(false); 
    }
  }

  useEffect(() => { loadPlans(); }, [patient.id]);

  // 🛡️ REFINAMENTO: Função para criar Prontuário Manual direto pela Médica
  async function handleCreateManualPlan(e: React.FormEvent) {
    e.preventDefault();
    if (!manualTreatmentName) return alert("Digite o nome da avaliação ou tratamento.");
    
    setCreatingManual(true);
    try {
      const res = await fetch(`/api/patients/${patient.id}/evolution`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          treatmentName: manualTreatmentName,
          totalSessions: manualSessions,
          notes: "Criado manualmente no prontuário."
        })
      });

      if (res.ok) {
        setManualTreatmentName("");
        setManualSessions(1);
        setShowManualForm(false);
        loadPlans();
      } else {
        alert("Erro ao criar prontuário manual.");
      }
    } finally {
      setCreatingManual(false);
    }
  }

  async function removePlan(planId: string) {
    if (!window.confirm("Excluir este histórico e todas as sessões associadas?")) return;
    await fetch(`/api/evolution-plans/${planId}`, { method: "DELETE" });
    loadPlans();
  }

  const handleExportPDF = async (plan: EvolutionPlan) => {
    const element = document.getElementById(`evolution-plan-${plan.id}`);
    if (!element) return;
    const printWindow = window.open('', '', 'width=900,height=800');
    printWindow?.document.write(`<html><head><title>Evolução</title><style>body { font-family: serif; padding: 40px; color: #1E1A18; background: #F7F2EA !important; } .no-print, button, input, textarea { display: none !important; } .pdf-h { border-bottom: 2px solid #5A1F2B; margin-bottom: 30px; padding-bottom: 10px; }</style></head><body><div class="pdf-h"><h1 style="color: #5A1F2B; text-transform: uppercase; font-size: 12px;">Mariana Thomaz Carmona</h1><h2 style="font-size: 24px;">Acompanhamento: ${patient.name}</h2></div>${element.innerHTML}</body></html>`);
    printWindow?.document.close();
    setTimeout(() => { printWindow?.print(); printWindow?.close(); }, 1200);
  };

  async function handleCreateImagesUpload(files: FileList | null) {
    if (!files?.length) return;
    setUploadingImages(true);
    try {
      const urls = await Promise.all(Array.from(files).map(file => uploadToCloudinary(file)));
      setUploadedImages(prev => [...prev, ...urls]);
    } catch (err: any) { 
      alert("Erro ao subir fotos: " + err.message); 
    } finally { setUploadingImages(false); }
  }

  async function createSession(planId: string) {
    if (!performedProcedure) return alert("Preencha o procedimento realizado hoje.");
    const res = await fetch(`/api/evolution-plans/${planId}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionNumber, performedProcedure, bodyMeasurements, clinicalNotes, images: uploadedImages }),
    });
    if (res.ok) {
      setPerformedProcedure(""); setBodyMeasurements(""); setClinicalNotes(""); setUploadedImages([]);
      loadPlans();
    }
  }

  async function removeSession(sessionId: string) {
    if (!window.confirm("Excluir registro da sessão?")) return;
    await fetch(`/api/evolution-sessions/${sessionId}`, { method: "DELETE" });
    loadPlans();
  }

  const activePlan = useMemo(() => plans.find(p => p.id === expandedPlanId) ?? null, [plans, expandedPlanId]);
  useEffect(() => { if (activePlan) setSessionNumber((activePlan.completedSessions || 0) + 1); }, [activePlan]);

  return (
    <div className="space-y-6 font-sans">
      
      {/* 🛡️ REFINAMENTO: Cabeçalho com o botão de Criar Prontuário Manual */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white border border-[#ECE7DD] p-5 rounded-sm shadow-sm gap-4">
        <div>
          <h3 className="font-serif text-lg text-[#111]">Histórico Clínico</h3>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">
            Pacotes vendidos e avaliações manuais
          </p>
        </div>
        <button 
          onClick={() => setShowManualForm(!showManualForm)}
          className="h-10 bg-[#111] text-white px-6 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#C8A35F] transition-all whitespace-nowrap"
        >
          {showManualForm ? <X size={14} /> : <Plus size={14} />}
          {showManualForm ? "Cancelar" : "Iniciar Prontuário"}
        </button>
      </div>

      {/* FORMULÁRIO DE PRONTUÁRIO MANUAL */}
      {showManualForm && (
        <form onSubmit={handleCreateManualPlan} className="bg-white border-l-4 border-l-[#C8A35F] border-t border-b border-r border-[#ECE7DD] p-6 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
            <Stethoscope size={18} className="text-[#C8A35F]" />
            <h4 className="font-serif text-lg uppercase text-[#111]">Nova Linha de Prontuário</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-3">
              <FieldLabel>Nome da Avaliação ou Tratamento *</FieldLabel>
              <input 
                value={manualTreatmentName} 
                onChange={(e) => setManualTreatmentName(e.target.value)} 
                placeholder="Ex: Avaliação Facial, Acompanhamento Pós-Cirúrgico..."
                className="h-11 w-full border border-[#ECE7DD] bg-[#FCFAF6] px-3 text-sm outline-none focus:border-[#C8A35F] focus:bg-white transition-colors" 
                required
              />
            </div>
            <div>
              <FieldLabel>Qtd. Prevista de Sessões</FieldLabel>
              <input 
                type="number" 
                min="1"
                value={manualSessions} 
                onChange={(e) => setManualSessions(Number(e.target.value))} 
                className="h-11 w-full border border-[#ECE7DD] bg-[#FCFAF6] px-3 text-sm outline-none focus:border-[#C8A35F] focus:bg-white transition-colors" 
                required
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button 
              type="submit" 
              disabled={creatingManual}
              className="h-10 bg-[#C8A35F] text-white px-8 text-[10px] font-bold uppercase tracking-widest hover:bg-[#b08d4e] transition-all disabled:opacity-50"
            >
              {creatingManual ? "Iniciando..." : "Iniciar Histórico"}
            </button>
          </div>
        </form>
      )}

      {/* MENSAGEM SE TIVER VAZIO E O FORMULÁRIO FECHADO */}
      {plans.length === 0 && !loading && !showManualForm && (
        <div className="bg-white border border-[#ECE7DD] rounded-sm p-10 text-center shadow-sm">
           <h3 className="font-serif text-lg text-[#111] mb-2">Nenhum Histórico</h3>
           <p className="text-[11px] text-gray-400 uppercase tracking-widest">
             Inicie um prontuário manualmente ou feche uma venda no financeiro.
           </p>
        </div>
      )}

      {/* LISTA DE PRONTUÁRIOS (VENDAS OU MANUAIS) */}
      <div className="space-y-4">
        {plans.map((plan) => (
          <div key={plan.id} id={`evolution-plan-${plan.id}`} className="border border-[#ECE7DD] bg-white rounded-sm overflow-hidden">
            
            {/* CABEÇALHO DO PRONTUÁRIO */}
            <div className="flex justify-between items-center px-6 py-5 border-b border-gray-50 bg-[#FCFAF6]/50">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-serif text-xl uppercase text-[#111]">{plan.treatmentName}</h4>
                  {!plan.packageName && (
                    <span className="text-[8px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded uppercase font-bold tracking-wider">Manual</span>
                  )}
                </div>
                <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">
                  Sessões: {plan.completedSessions}/{plan.totalSessions}
                  {plan.packageName ? ` • Pacote Vendido: ${plan.packageName}` : ''}
                </p>
              </div>
              <div className="flex gap-2 no-print">
                <button onClick={() => handleExportPDF(plan)} className="h-9 border border-[#C8A35F] px-4 text-[10px] font-bold uppercase text-[#C8A35F] flex items-center gap-2 hover:bg-[#FAF8F3] transition-colors">
                  <FileText size={14} /> PDF
                </button>
                <button onClick={() => setExpandedPlanId(expandedPlanId === plan.id ? null : plan.id)} className={`h-9 px-6 text-[10px] font-bold uppercase transition-all shadow-sm ${expandedPlanId === plan.id ? 'bg-gray-100 text-gray-600' : 'bg-[#111] text-white hover:bg-[#C8A35F]'}`}>
                  {expandedPlanId === plan.id ? "Fechar" : "Registrar Sessão"}
                </button>
                <button onClick={() => removePlan(plan.id)} className="h-9 border border-red-50 px-2 text-red-200 hover:text-red-500 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {expandedPlanId === plan.id && (
              <div className="p-6 bg-white animate-in fade-in duration-300">
                {/* FORM DE NOVA SESSÃO */}
                <div className="bg-[#FAF8F3] border border-[#ECE7DD] p-6 mb-10 rounded-sm shadow-inner no-print">
                  <div className="grid gap-6 md:grid-cols-4 mb-6">
                    <div>
                      <FieldLabel>Nº Sessão</FieldLabel>
                      <input type="number" value={sessionNumber} onChange={(e) => setSessionNumber(Number(e.target.value))} className="h-11 w-full border border-[#ECE7DD] bg-white px-3 text-sm outline-none focus:border-[#C8A35F]" />
                    </div>
                    <div className="md:col-span-3">
                      <FieldLabel>Procedimento realizado hoje *</FieldLabel>
                      <input value={performedProcedure} onChange={(e) => setPerformedProcedure(e.target.value)} placeholder="Ex: Avaliação Inicial, Aplicação de Toxina..." className="h-11 w-full border border-[#ECE7DD] bg-white px-3 text-sm outline-none focus:border-[#C8A35F]" />
                    </div>
                  </div>
                  <div className="grid gap-6 md:grid-cols-2 mb-6">
                    <div>
                      <FieldLabel>Medidas e Parâmetros</FieldLabel>
                      <textarea value={bodyMeasurements} onChange={(e) => setBodyMeasurements(e.target.value)} className="min-h-24 w-full border border-[#ECE7DD] bg-white p-3 text-sm outline-none focus:border-[#C8A35F] resize-none" />
                    </div>
                    <div>
                      <FieldLabel>Notas Clínicas</FieldLabel>
                      <textarea value={clinicalNotes} onChange={(e) => setClinicalNotes(e.target.value)} className="min-h-24 w-full border border-[#ECE7DD] bg-white p-3 text-sm outline-none focus:border-[#C8A35F] resize-none" />
                    </div>
                  </div>
                  <div className="flex justify-between items-end gap-8 border-t border-[#ECE7DD] pt-6">
                    <div className="flex-1">
                      <FieldLabel>Fotos da Sessão</FieldLabel>
                      <label className={`flex h-12 cursor-pointer items-center justify-center gap-3 border-2 border-dashed rounded transition-all ${uploadingImages ? 'border-gray-200 bg-gray-50' : 'border-[#C8A35F]/30 bg-white hover:border-[#C8A35F] hover:bg-[#FCFAF6]'}`}>
                        {uploadingImages ? <Activity size={18} className="animate-spin text-gray-400" /> : <Camera size={18} className="text-[#C8A35F]" />}
                        <span className="text-[10px] font-bold uppercase text-[#C8A35F]">{uploadingImages ? "Subindo..." : "Selecionar Fotos"}</span>
                        <input type="file" accept="image/*" multiple className="hidden" disabled={uploadingImages} onChange={(e) => handleCreateImagesUpload(e.target.files)} />
                      </label>
                      <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                        {uploadedImages.map((img, i) => (
                          <div key={i} className="h-16 w-16 border rounded overflow-hidden relative shadow-sm group shrink-0">
                            <img src={img} className="h-full w-full object-cover" />
                            <button onClick={() => setUploadedImages(prev => prev.filter((_, idx) => idx !== i))} className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><X size={14}/></button>
                          </div>
                        ))}
                      </div>
                    </div>
                    <button onClick={() => createSession(plan.id)} className="h-12 bg-[#111] text-white px-10 text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-[#C8A35F] shadow-lg active:scale-95 transition-all">
                      <Plus size={18} /> Salvar Registro
                    </button>
                  </div>
                </div>

                {/* HISTÓRICO DE SESSÕES DAQUELE PRONTUÁRIO */}
                <div className="space-y-6">
                  {plan.sessions.map((session) => {
                    const sessionImages = Array.isArray(session.imagesJson) ? session.imagesJson : (typeof session.imagesJson === 'string' ? JSON.parse(session.imagesJson) : []);
                    return (
                      <div key={session.id} className="border border-[#ECE7DD] bg-white p-6 rounded-sm flex flex-col md:flex-row gap-8 relative group">
                        <button onClick={() => removeSession(session.id)} className="absolute top-4 right-4 text-gray-200 hover:text-red-500 no-print opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16} /></button>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-4">
                            <span className="text-[10px] font-black text-[#C8A35F] uppercase bg-[#FAF8F3] px-2 py-1 rounded">Sessão {session.sessionNumber}</span>
                            <span className="text-[11px] text-gray-400 font-medium">{formatDate(session.sessionDate)}</span>
                          </div>
                          <div className="space-y-4">
                              <div><FieldLabel>Procedimento</FieldLabel><p className="text-sm text-[#111] font-medium leading-relaxed">{session.performedProcedure || "—"}</p></div>
                              <div className="grid grid-cols-2 gap-8 mt-4">
                                  <div><FieldLabel>Medidas e Parâmetros</FieldLabel><p className="text-[12px] text-gray-600 whitespace-pre-line">{session.bodyMeasurements || "—"}</p></div>
                                  <div><FieldLabel>Notas Clínicas</FieldLabel><p className="text-[12px] text-gray-600 whitespace-pre-line">{session.clinicalNotes || "—"}</p></div>
                              </div>
                              {sessionImages.length > 0 && (
                                  <div className="mt-4 flex gap-2 flex-wrap">
                                      {sessionImages.map((img: string, i: number) => (
                                          <a key={i} href={img} target="_blank" rel="noreferrer" className="h-20 w-20 border rounded shadow-sm overflow-hidden hover:scale-105 transition-transform"><img src={img} className="h-full w-full object-cover" /></a>
                                      ))}
                                  </div>
                              )}
                          </div>
                        </div>
                        
                        <div className="w-full md:w-56 bg-[#FCFAF6] border border-[#ECE7DD] p-5 flex flex-col items-center justify-center text-center rounded-sm shadow-sm">
                          <span className="text-[8px] font-bold text-[#96A4C1] uppercase tracking-widest mb-3">Visto de Autenticidade</span>
                          {contractSignature ? (
                            <div className="animate-in fade-in zoom-in duration-700">
                              <img src={contractSignature} className="h-12 object-contain mix-blend-multiply mb-2" />
                              <div className="flex items-center justify-center gap-1.5 text-[8px] text-emerald-600 font-black uppercase tracking-tighter"><CheckCircle2 size={12} /> Validado via Contrato</div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-1">
                              <ShieldCheck size={20} className="text-amber-300 mb-1" />
                              <span className="text-[8px] text-amber-500 font-bold uppercase italic leading-tight text-center">Aguardando Assinatura</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}