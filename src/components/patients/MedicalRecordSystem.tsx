"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Plus, ChevronDown, Save, X, FileText, Check, Eye,
  Bold, Italic, List, AlignLeft, AlignCenter, Clock, Lock, ShieldCheck,
  ListOrdered, Underline, Trash2, AlignRight
} from "lucide-react";
import { CONSENT_TEMPLATES } from "@/constants/templates";
import AnamneseForm from "./AnamneseForm";

interface Props {
  patientId: string;
  patientName: string;
}

export default function MedicalRecordSystem({ patientId, patientName }: Props) {
  const [records, setRecords] = useState<any[]>([]);
  const [activeForm, setActiveForm] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const editorRef = useRef<HTMLDivElement>(null);

  // Trava de rolagem da página principal quando o modal abre
  useEffect(() => {
    if (activeForm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [activeForm]);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/medical-records?patientId=${patientId}`);
      const data = await res.json();
      setRecords(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRecords(); }, [patientId]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Excluir permanentemente este prontuário?")) return;
    try {
      const res = await fetch(`/api/medical-records?id=${id}`, { method: "DELETE" });
      if (res.ok) loadRecords();
    } catch (error) {
      alert("Erro ao excluir.");
    }
  };

  const handleOpenForm = (type: string) => {
    setSelectedRecord(null);
    setActiveForm(type);
    setShowOptions(false);
    setTimeout(() => {
      if (editorRef.current && type !== "ANAMNESE") {
        const template = CONSENT_TEMPLATES[type] || "";
        editorRef.current.innerHTML = template.replace("[NOME DO PACIENTE]", patientName);
      }
    }, 100);
  };

  const handleViewRecord = (record: any) => {
    setSelectedRecord(record);
    setActiveForm(record.type);
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.innerHTML = typeof record.content === 'string' ? record.content : "";
      }
    }, 100);
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) editorRef.current.focus();
  };

  const handleSave = async () => {
    const content = editorRef.current?.innerHTML || "";
    try {
      const res = await fetch("/api/medical-records", {
        method: "POST",
        body: JSON.stringify({ patientId, type: activeForm, content }),
      });
      if (res.ok) {
        setActiveForm(null);
        loadRecords();
      }
    } catch (error) {
      alert("Erro ao salvar.");
    }
  };

  const options = [
    "ANAMNESE", "ULTRASSOM MICRO E MACROFOCADO", "TOXINA BOTULÍNICA", 
    "SKINBOOSTER", "PREENCHIMENTO", "PEIM", "PEELING", "PDRN", 
    "MICROAGULHAMENTO", "MESOTERAPIA", "LIMPEZA DE PELE PROFUNDA",
    "LAVIEEN", "JATO DE PLASMA", "FIOS DE PDO BIOESTIMULADOR"
  ];

  return (
    <div className="mt-12 font-sans max-w-[1400px] mx-auto antialiased">
      {/* HEADER DA SEÇÃO */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[#EEF1F5] pb-6 mb-10 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
             <span className="h-[1px] w-6 bg-[#C8A35F]"></span>
             <span className="text-[9px] uppercase tracking-[0.3em] text-[#C8A35F] font-bold">Clinical Records</span>
          </div>
          <h2 className="text-[30px] text-[#111] font-medium" style={{ fontFamily: 'Georgia, serif' }}>Prontuário Digital</h2>
        </div>
        
        <div className="relative">
          <button onClick={() => setShowOptions(!showOptions)} className="bg-[#111] px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-white hover:bg-[#C8A35F] flex items-center gap-3 transition-all rounded-full shadow-lg">
            <Plus size={14} /> Novo Registro <ChevronDown size={12} />
          </button>
          {showOptions && (
            <div className="absolute right-0 z-50 mt-2 w-64 bg-white border border-[#E9DEC9] shadow-2xl rounded-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
              <div className="p-2.5 bg-[#FCFAF6] border-b border-[#E9DEC9] text-[9px] font-bold text-[#C8A35F] uppercase tracking-widest text-center">Procedimentos</div>
              {options.map(opt => (
                <button key={opt} onClick={() => handleOpenForm(opt)} className="w-full px-5 py-4 text-left text-[10px] font-bold uppercase text-[#444] border-b border-[#F9F9F9] last:border-0 hover:bg-[#FAF8F3] hover:text-[#C8A35F] transition-colors">{opt}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* LISTAGEM DE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {records.map((record) => (
          <div key={record.id} className="relative bg-white border border-[#EEE] p-6 hover:border-[#C8A35F]/40 hover:shadow-xl transition-all duration-300 group rounded-xl">
            <button onClick={() => handleDelete(record.id)} className="absolute top-4 right-4 p-1.5 text-[#DDD] hover:text-rose-500 transition-colors"><Trash2 size={14}/></button>
            <div className="flex justify-between items-center mb-5 pr-6">
              <div className="p-2.5 bg-[#111] text-[#C8A35F] rounded-lg shadow-md"><FileText size={16} /></div>
              <span className="text-[9px] font-bold text-[#BBB] uppercase tracking-widest">{new Date(record.createdAt).toLocaleDateString('pt-BR')}</span>
            </div>
            <h4 className="text-[13px] font-bold text-[#111] mb-6 h-10 overflow-hidden leading-tight uppercase tracking-tight pr-4">{record.type}</h4>
            <button onClick={() => handleViewRecord(record)} className="w-full py-2.5 bg-[#FAF8F3] text-[9px] font-bold uppercase tracking-widest text-[#111] border border-[#E9DEC9] group-hover:bg-[#111] group-hover:text-white transition-all rounded-lg flex items-center justify-center gap-2">
              <Eye size={14} /> Abrir Registro
            </button>
          </div>
        ))}
      </div>

      {/* MODAL DO EDITOR (CORRIGIDO) */}
      {activeForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#FAF8F3]/70 backdrop-blur-sm p-4 md:p-8 animate-in fade-in duration-300">
          <div className="w-full max-w-5xl bg-white h-full max-h-[88vh] flex flex-col shadow-[0_40px_80px_rgba(0,0,0,0.15)] rounded-3xl overflow-hidden border border-[#D9DEEA]">
            
            {/* BARRA SUPERIOR ESCURA - TEXTO CORRIGIDO PARA DOURADO */}
            <div className="bg-[#111] px-8 py-5 flex justify-between items-center border-b border-[#C8A35F]/30">
              <div className="flex items-center gap-4">
                <div className="h-6 w-[1.5px] bg-[#C8A35F]"></div>
                {/* Título agora em Dourado para visibilidade total */}
                <h3 className="text-[#C8A35F] font-semibold uppercase tracking-[0.25em] text-[14px]" style={{ fontFamily: 'Georgia, serif' }}>
                  {activeForm}
                </h3>
                <span className="hidden md:inline text-white/20 text-[9px] uppercase tracking-widest border-l border-white/10 pl-4">Harmonie Clinical System</span>
              </div>
              <button onClick={() => { setActiveForm(null); setSelectedRecord(null); }} className="bg-white/5 text-white/50 hover:text-white px-5 py-2 rounded-full text-[9px] font-bold uppercase tracking-widest border border-white/10 transition-all flex items-center gap-2">
                <X size={14} /> Fechar
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-[#F9F9F9] p-6 lg:p-10 scrollbar-hide">
              {activeForm === "ANAMNESE" ? (
                <div className="max-w-3xl mx-auto"><AnamneseForm patientId={patientId} onSave={handleSave} onCancel={() => setActiveForm(null)} /></div>
              ) : (
                <div className="max-w-4xl mx-auto space-y-8">
                  {/* Info Bar */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-[#96A4C1] uppercase tracking-[0.2em] ml-1 flex items-center gap-2"><Clock size={10}/> Data de Registro</label>
                      <div className="w-full p-3.5 bg-white border border-[#D9DEEA] text-[13px] text-[#111] font-medium rounded-xl shadow-sm italic">
                        {selectedRecord ? new Date(selectedRecord.createdAt).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-[#96A4C1] uppercase tracking-[0.2em] ml-1 flex items-center gap-2"><Lock size={10}/> Nível de Segurança</label>
                      <div className="w-full p-3.5 bg-white border border-[#D9DEEA] text-[11px] text-[#4A9B68] font-bold rounded-xl shadow-sm uppercase tracking-tighter flex items-center gap-2">
                         <ShieldCheck size={14}/> Autenticado por Harmonie Clinic
                      </div>
                    </div>
                  </div>

                  {/* EDITOR ESTILO WORD */}
                  <div className="bg-white border border-[#D9DEEA] shadow-xl flex flex-col min-h-[550px] rounded-2xl overflow-hidden">
                    {/* TOOLBAR */}
                    <div className="px-6 py-3.5 border-b border-[#F5F5F5] bg-[#FCFAF6] flex flex-wrap gap-2 items-center">
                      <ToolbarBtn onClick={() => execCommand('bold')} icon={<Bold size={16}/>} title="Negrito" />
                      <ToolbarBtn onClick={() => execCommand('italic')} icon={<Italic size={16}/>} title="Itálico" />
                      <ToolbarBtn onClick={() => execCommand('underline')} icon={<Underline size={16}/>} title="Sublinhado" />
                      <div className="w-[1px] h-5 bg-[#D9DEEA] mx-1" />
                      <ToolbarBtn onClick={() => execCommand('insertUnorderedList')} icon={<List size={16}/>} title="Lista" />
                      <ToolbarBtn onClick={() => execCommand('insertOrderedList')} icon={<ListOrdered size={16}/>} title="Lista Numerada" />
                      <div className="w-[1px] h-5 bg-[#D9DEEA] mx-1" />
                      <ToolbarBtn onClick={() => execCommand('justifyLeft')} icon={<AlignLeft size={16}/>} />
                      <ToolbarBtn onClick={() => execCommand('justifyCenter')} icon={<AlignCenter size={16}/>} />
                      <ToolbarBtn onClick={() => execCommand('justifyRight')} icon={<AlignRight size={16}/>} />
                      <div className="ml-auto text-[8px] font-bold text-[#C8A35F] uppercase tracking-[0.3em] px-4 hidden lg:block border-l border-[#D9DEEA]">
                        Interface Editorial
                      </div>
                    </div>
                    
                    {/* ÁREA DE TEXTO */}
                    <div 
                      ref={editorRef}
                      contentEditable={!selectedRecord}
                      suppressContentEditableWarning={true}
                      className="flex-1 p-10 lg:p-16 outline-none text-[16px] leading-[1.8] min-h-[500px] font-sans text-[#333] bg-transparent overflow-y-auto selection:bg-[#C8A35F]/20"
                      style={{ fontFamily: 'Georgia, serif' }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* BOTÃO FINALIZAR */}
            {!selectedRecord && activeForm !== "ANAMNESE" && (
              <div className="p-8 bg-white border-t border-[#EEF1F5] flex justify-center shadow-inner">
                <button 
                  onClick={handleSave} 
                  className="bg-[#111] text-white px-32 py-4 text-[10px] font-bold uppercase tracking-[0.3em] flex items-center gap-4 hover:bg-[#C8A35F] transition-all shadow-2xl rounded-full"
                >
                  <Check size={18} className="text-[#C8A35F]" /> Confirmar e Assinar Registro
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ToolbarBtn({ onClick, icon, title }: { onClick: () => void, icon: React.ReactNode, title?: string }) {
  return (
    <button 
      onClick={onClick}
      title={title}
      className="p-2 text-[#96A4C1] hover:bg-white hover:text-[#C8A35F] border border-transparent hover:border-[#E9DEC9] transition-all rounded-lg"
    >
      {icon}
    </button>
  );
}