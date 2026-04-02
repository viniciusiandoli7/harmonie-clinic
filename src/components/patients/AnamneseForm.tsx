"use client";

import { useState } from "react";
import { Save, X, ClipboardCheck } from "lucide-react";

interface AnamneseFormProps {
  patientId: string;
  onSave: (data: any) => void;
  onCancel: () => void;
  patientName?: string; // Adicionei para aparecer no topo
}

export default function AnamneseForm({ patientId, onSave, onCancel, patientName }: AnamneseFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    profession: "",
    sunExposure: "não",
    mainComplaint: "",
    fillersHistory: "",
    botoxHistory: "",
    roacutan: "não",
    medications: "",
    eggAllergy: "não",
    seafoodAllergy: "",
    dentistAnesthesia: "não",
    anesthesiaReaction: "não",
    procedureReaction: "",
    keloidHistory: "não",
    degenerativeDisease: "",
    otherDiseases: "",
    generalAllergies: "",
    herpes: "não",
    smoker: "não",
    bloodPressure: "NORMAL",
    pregnant: "não",
    previousPregnancy: "não",
    intenseExercise: "não",
    skincareRoutine: "",
    weightLossProcess: "não",
    weightLossAmount: "",
    weightGoal: "",
    surgeryGoal: "",
    previousSurgeries: "",
    recentMedVaccine: "",
    permanentImplants: "",
    agreement: false
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleSave = async () => {
    if (!formData.agreement) {
      alert("É necessário confirmar a veracidade das informações no final da ficha.");
      return;
    }

    setIsSaving(true);
    try {
      // Chama a função onSave que vem do componente pai
      await onSave(formData);
    } finally {
      setIsSaving(false);
    }
  };

  const SectionTitle = ({ title }: { title: string }) => (
    <h4 className="mt-12 mb-6 border-b border-[#E9DEC9] pb-2 text-[11px] font-black uppercase tracking-[0.3em] text-[#C8A35F]">
      {title}
    </h4>
  );

  const RadioGroup = ({ label, name, options = ["Sim", "não"] }: { label: string, name: string, options?: string[] }) => (
    <div className="flex flex-col gap-3">
      <label className="text-[10px] font-bold uppercase tracking-widest text-[#96A4C1]">{label}</label>
      <div className="flex gap-8 mt-1">
        {options.map(opt => (
          <label key={opt} className="flex items-center gap-2 text-[13px] font-medium text-[#111] cursor-pointer group">
            <input 
              type="radio" 
              name={name} 
              value={opt.toLowerCase()} 
              checked={formData[name as keyof typeof formData] === opt.toLowerCase()}
              onChange={handleInputChange}
              className="accent-[#C8A35F] h-4 w-4 transition-transform group-hover:scale-110"
            /> {opt}
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-2xl max-w-5xl mx-auto overflow-hidden border border-[#E9DEC9]">
      
      {/* CABEÇALHO CLARO - ADEUS PARTE PRETA */}
      <header className="bg-[#FAF8F3] border-b border-[#E9DEC9] px-10 py-8 flex justify-between items-center">
        <div className="flex items-center gap-5">
          <div className="h-12 w-[2px] bg-[#C8A35F]" />
          <div>
            <h2 className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#C8A35F] mb-1">Harmonie Clinical System</h2>
            <h3 className="text-2xl font-serif text-[#111] uppercase tracking-widest leading-none">
              Anamnese: <span className="text-gray-400">{patientName || "Paciente"}</span>
            </h3>
          </div>
        </div>
        <button 
          onClick={onCancel}
          className="p-2 hover:bg-red-50 text-gray-300 hover:text-red-500 rounded-full transition-all"
        >
          <X size={24} />
        </button>
      </header>

      <div className="p-10 space-y-10">
        
        {/* BLOCO 1: PERFIL */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="group">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#96A4C1] mb-2 group-focus-within:text-[#C8A35F]">Qual sua profissão?</label>
            <input 
              name="profession"
              value={formData.profession}
              onChange={handleInputChange}
              type="text" 
              placeholder="Ex: Arquiteta, Empresária..."
              className="w-full border-b border-[#D9DEEA] bg-transparent py-2 outline-none focus:border-[#C8A35F] text-[15px] font-medium text-[#111]" 
            />
          </div>
          <RadioGroup label="Se expõe ao sol frequentemente?" name="sunExposure" />
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-[#96A4C1] mb-2">Queixa Principal (O que mais te incomoda hoje?)</label>
          <textarea 
            name="mainComplaint"
            value={formData.mainComplaint}
            onChange={handleInputChange}
            placeholder="Descreva aqui o motivo da sua consulta..."
            className="w-full border border-[#D9DEEA] bg-[#FCFCFC] p-4 outline-none focus:border-[#C8A35F] h-28 rounded-lg text-[15px] transition-all" 
          />
        </div>

        {/* BLOCO 2: HISTÓRICO */}
        <SectionTitle title="Histórico de Procedimentos" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#96A4C1] mb-2">Preenchimentos anteriores (região/tempo)?</label>
            <input name="fillersHistory" value={formData.fillersHistory} onChange={handleInputChange} type="text" className="w-full border-b border-[#D9DEEA] bg-transparent py-2 outline-none focus:border-[#C8A35F]" />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#96A4C1] mb-2">Toxina Botulínica anterior (região/tempo)?</label>
            <input name="botoxHistory" value={formData.botoxHistory} onChange={handleInputChange} type="text" className="w-full border-b border-[#D9DEEA] bg-transparent py-2 outline-none focus:border-[#C8A35F]" />
          </div>
        </div>

        {/* BLOCO 3: SAÚDE */}
        <SectionTitle title="Saúde e Medicamentos" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <RadioGroup label="Usa Roacutan?" name="roacutan" />
          <div className="md:col-span-2">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#96A4C1] mb-2">Medicamentos ou Vitaminas em uso?</label>
            <input name="medications" value={formData.medications} onChange={handleInputChange} type="text" className="w-full border-b border-[#D9DEEA] bg-transparent py-2 outline-none focus:border-[#C8A35F]" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <RadioGroup label="Tem tendência a cicatriz ou queloide?" name="keloidHistory" />
          <RadioGroup label="Possui Herpes?" name="herpes" />
        </div>

        {/* TERMO DE RESPONSABILIDADE */}
        <div className="mt-16 bg-[#FAF8F3] p-8 border border-[#E9DEC9] rounded-xl relative">
          <div className="absolute -top-3 left-6 bg-[#C8A35F] text-white px-3 py-1 text-[8px] font-black uppercase tracking-widest rounded-full">Termo de Ciência</div>
          <label className="flex items-start gap-4 cursor-pointer">
            <input 
              type="checkbox" 
              checked={formData.agreement}
              onChange={(e) => setFormData(prev => ({ ...prev, agreement: e.target.checked }))}
              className="mt-1 h-5 w-5 accent-[#4A9B68] shrink-0" 
            />
            <span className="text-[12px] font-bold text-[#111] leading-relaxed uppercase tracking-wide">
              Confirmo que as informações acima são verdadeiras. Autorizo a avaliação estética, 
              ciente de que a omissão de dados pode comprometer minha segurança e o resultado do tratamento.
            </span>
          </label>
        </div>

        {/* BOTÕES DE AÇÃO */}
        <div className="mt-12 flex justify-end gap-6 pt-10 border-t border-[#F5F5F5]">
          <button 
            type="button"
            onClick={onCancel}
            className="text-[11px] font-bold uppercase tracking-widest text-[#96A4C1] hover:text-[#111] transition-all"
          >
            Descartar Alterações
          </button>
          <button 
            type="button"
            disabled={!formData.agreement || isSaving}
            onClick={handleSave}
            className="bg-[#4A9B68] text-white px-12 py-4 rounded-xl text-[11px] font-bold uppercase tracking-[0.25em] flex items-center gap-3 hover:bg-[#3d8055] transition-all disabled:opacity-30 shadow-lg shadow-green-100"
          >
            {isSaving ? "PROCESSANDO..." : <><ClipboardCheck size={18} /> Salvar Ficha de Anamnese</>}
          </button>
        </div>
      </div>
    </div>
  );
}