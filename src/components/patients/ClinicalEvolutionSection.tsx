"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity, Camera, ClipboardList, Pencil, Plus, Trash2, 
  Upload, X, FileText, CheckCircle2, ShieldCheck 
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
  return new Date(value).toLocaleDateString("pt-BR");
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.18em] text-[#96A4C1]">{children}</label>;
}

// ☁️ MOTOR CLOUDINARY - DADOS EXTRAÍDOS DO SEU ÚLTIMO PRINT
async function uploadToCloudinary(file: File) {
  const cloudName = "domf1tnzd"; 
  const uploadPreset = "harmonie_fotos"; // 👈 AJUSTADO PARA O NOME DO SEU ÚLTIMO PRINT
  
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { 
    method: "POST", 
    body: formData 
  });
  
  const data = await res.json();
  if (!res.ok) {
    // Se der erro, vamos ver o que o Cloudinary diz no console
    console.error("DETALHE DO ERRO CLOUDINARY:", data);
    throw new Error(data.error?.message || "Erro no upload");
  }
  return data.secure_url; 
}

export default function ClinicalEvolutionSection({ patient, contractSignature }: Props) {
  const [plans, setPlans] = useState<EvolutionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);

  // Estados para nova sessão
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
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }

  useEffect(() => { loadPlans(); }, [patient.id]);

  async function removePlan(planId: string) {
    if (!window.confirm("Excluir este plano e todas as sessões?")) return;
    await fetch(`/api/evolution-plans/${planId}`, { method: "DELETE" });
    loadPlans();
  }

  const handleExportPDF = async (plan: EvolutionPlan) => {
    const element = document.getElementById(`evolution-plan-${plan.id}`);
    if (!element) return;
    const printWindow = window.open('', '', 'width=900,height=800');
    printWindow?.document.write(`<html><head><title>Evolução</title><script src="https://unpkg.com/@tailwindcss/browser@4"></script><style>body { font-family: serif; padding: 40px; color: #111; background: #fff !important; } .no-print, button, input { display: none !important; } .pdf-h { border-bottom: 2px solid #C8A35F; margin-bottom: 30px; padding-bottom: 10px; }</style></head><body><div class="pdf-h"><h1 style="color: #C8A35F; text-transform: uppercase; font-size: 12px;">Harmonie Clinic</h1><h2 style="font-size: 24px;">Acompanhamento: ${patient.name}</h2></div>${element.innerHTML}</body></html>`);
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
    if (!performedProcedure) return alert("Preencha o procedimento.");
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
    if (!window.confirm("Excluir registro?")) return;
    await fetch(`/api/evolution-sessions/${sessionId}`, { method: "DELETE" });
    loadPlans();
  }

  const activePlan = useMemo(() => plans.find(p => p.id === expandedPlanId) ?? null, [plans, expandedPlanId]);
  useEffect(() => { if (activePlan) setSessionNumber((activePlan.completedSessions || 0) + 1); }, [activePlan]);

  return (
    <div className="space-y-6 font-sans">
      <div className="space-y-4">
        {plans.map((plan) => (
          <div key={plan.id} id={`evolution-plan-${plan.id}`} className="border border-[#ECE7DD] bg-white rounded-sm overflow-hidden">
            <div className="flex justify-between items-center px-6 py-5 border-b border-gray-50 bg-[#FCFAF6]/50">
              <div>
                <h4 className="font-serif text-xl uppercase text-[#111]">{plan.treatmentName}</h4>
                <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">Sessões: {plan.completedSessions}/{plan.totalSessions}</p>
              </div>
              <div className="flex gap-2 no-print">
                <button onClick={() => handleExportPDF(plan)} className="h-9 border border-[#C8A35F] px-4 text-[10px] font-bold uppercase text-[#C8A35F] flex items-center gap-2"><FileText size={14} /> PDF</button>
                <button onClick={() => setExpandedPlanId(expandedPlanId === plan.id ? null : plan.id)} className={`h-9 px-6 text-[10px] font-bold uppercase transition-all shadow-sm ${expandedPlanId === plan.id ? 'bg-gray-100 text-gray-600' : 'bg-[#111] text-white hover:bg-[#C8A35F]'}`}>{expandedPlanId === plan.id ? "Fechar" : "Registrar Sessão"}</button>
                <button onClick={() => removePlan(plan.id)} className="h-9 border border-red-50 px-2 text-red-200 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
              </div>
            </div>

            {expandedPlanId === plan.id && (
              <div className="p-6 bg-white animate-in fade-in duration-300">
                <div className="bg-[#FAF8F3] border border-[#ECE7DD] p-6 mb-10 rounded-sm shadow-inner no-print">
                  <div className="grid gap-6 md:grid-cols-4 mb-6">
                    <div><FieldLabel>Nº Sessão</FieldLabel><input type="number" value={sessionNumber} onChange={(e) => setSessionNumber(Number(e.target.value))} className="h-11 w-full border border-gray-200 bg-white px-3 text-sm outline-none focus:border-[#C8A35F]" /></div>
                    <div className="md:col-span-3"><FieldLabel>Procedimento realizado hoje *</FieldLabel><input value={performedProcedure} onChange={(e) => setPerformedProcedure(e.target.value)} className="h-11 w-full border border-gray-200 bg-white px-3 text-sm outline-none focus:border-[#C8A35F]" /></div>
                  </div>
                  <div className="grid gap-6 md:grid-cols-2 mb-6">
                    <div><FieldLabel>Medidas</FieldLabel><textarea value={bodyMeasurements} onChange={(e) => setBodyMeasurements(e.target.value)} className="min-h-24 w-full border border-gray-200 bg-white p-3 text-sm outline-none focus:border-[#C8A35F]" /></div>
                    <div><FieldLabel>Notas Clínicas</FieldLabel><textarea value={clinicalNotes} onChange={(e) => setClinicalNotes(e.target.value)} className="min-h-24 w-full border border-gray-200 bg-white p-3 text-sm outline-none focus:border-[#C8A35F]" /></div>
                  </div>
                  <div className="flex justify-between items-end gap-8 border-t border-gray-200 pt-6">
                    <div className="flex-1">
                      <FieldLabel>Fotos da Sessão</FieldLabel>
                      <label className={`flex h-12 cursor-pointer items-center justify-center gap-3 border-2 border-dashed rounded transition-all ${uploadingImages ? 'border-gray-200 bg-gray-50' : 'border-[#C8A35F]/30 bg-white hover:border-[#C8A35F] hover:bg-[#FCFAF6]'}`}>
                        {uploadingImages ? <Activity size={18} className="animate-spin text-gray-400" /> : <Camera size={18} className="text-[#C8A35F]" />}
                        <span className="text-[10px] font-bold uppercase text-[#C8A35F]">{uploadingImages ? "Subindo..." : "Selecionar Fotos"}</span>
                        <input type="file" accept="image/*" multiple className="hidden" disabled={uploadingImages} onChange={(e) => handleCreateImagesUpload(e.target.files)} />
                      </label>
                      <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                        {uploadedImages.map((img, i) => (
                          <div key={i} className="h-16 w-16 border rounded overflow-hidden relative shadow-sm group shrink-0"><img src={img} className="h-full w-full object-cover" /><button onClick={() => setUploadedImages(prev => prev.filter((_, idx) => idx !== i))} className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><X size={14}/></button></div>
                        ))}
                      </div>
                    </div>
                    <button onClick={() => createSession(plan.id)} className="h-12 bg-[#111] text-white px-10 text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-[#C8A35F] shadow-lg active:scale-95"><Plus size={18} /> Salvar Registro</button>
                  </div>
                </div>

                <div className="space-y-6">
                  {plan.sessions.map((session) => {
                    const sessionImages = Array.isArray(session.imagesJson) ? session.imagesJson : (typeof session.imagesJson === 'string' ? JSON.parse(session.imagesJson) : []);
                    return (
                      <div key={session.id} className="border border-gray-100 bg-white p-6 rounded-sm flex flex-col md:flex-row gap-8 relative group">
                        <button onClick={() => removeSession(session.id)} className="absolute top-4 right-4 text-gray-200 hover:text-red-500 no-print opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16} /></button>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-4"><span className="text-[10px] font-black text-[#C8A35F] uppercase bg-[#FAF8F3] px-2 py-1 rounded">Sessão {session.sessionNumber}</span><span className="text-[11px] text-gray-400 font-medium">{formatDate(session.sessionDate)}</span></div>
                          <div className="space-y-4">
                              <div><FieldLabel>Procedimento</FieldLabel><p className="text-sm text-gray-800 font-medium leading-relaxed">{session.performedProcedure || "—"}</p></div>
                              <div className="grid grid-cols-2 gap-8 mt-4">
                                  <div><FieldLabel>Medidas</FieldLabel><p className="text-[12px] text-gray-600 italic whitespace-pre-line">{session.bodyMeasurements || "—"}</p></div>
                                  <div><FieldLabel>Notas Clínicas</FieldLabel><p className="text-[12px] text-gray-600 italic whitespace-pre-line">{session.clinicalNotes || "—"}</p></div>
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
                        
                        <div className="w-full md:w-56 bg-[#FCFAF6] border border-[#F2EEE7] p-5 flex flex-col items-center justify-center text-center rounded-sm shadow-sm">
                          <span className="text-[8px] font-bold text-[#96A4C1] uppercase tracking-widest mb-3">Visto de Autenticidade</span>
                          {contractSignature ? (
                            <div className="animate-in fade-in zoom-in duration-700">
                              <img src={contractSignature} className="h-12 object-contain mix-blend-multiply mb-2" />
                              <div className="flex items-center justify-center gap-1.5 text-[8px] text-emerald-600 font-black uppercase tracking-tighter"><CheckCircle2 size={12} /> Validado via Contrato</div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-1">
                              <ShieldCheck size={20} className="text-amber-300 mb-1" />
                              <span className="text-[8px] text-amber-500 font-bold uppercase italic leading-tight text-center">Aguardando Assinatura do Contrato</span>
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