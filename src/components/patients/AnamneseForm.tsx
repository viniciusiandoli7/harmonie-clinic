"use client";

import { useState } from "react";
import { Save, X } from "lucide-react";

interface AnamneseFormProps {
  patientId: string;
  onSave: (data: any) => void;
  onCancel: () => void;
}

export default function AnamneseForm({ patientId, onSave, onCancel }: AnamneseFormProps) {
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

  const SectionTitle = ({ title }: { title: string }) => (
    <h4 className="mt-8 mb-4 border-b border-[#E9DEC9] pb-2 text-[12px] font-bold uppercase tracking-[0.2em] text-[#C8A35F]">
      {title}
    </h4>
  );

  const RadioGroup = ({ label, name, options = ["Sim", "não"] }: { label: string, name: string, options?: string[] }) => (
    <div className="flex flex-col gap-2">
      <label className="text-[11px] font-bold uppercase text-[#96A4C1]">{label}</label>
      <div className="flex gap-6 mt-1">
        {options.map(opt => (
          <label key={opt} className="flex items-center gap-2 text-[14px] text-[#111111] cursor-pointer">
            <input 
              type="radio" 
              name={name} 
              value={opt.toLowerCase()} 
              checked={formData[name as keyof typeof formData] === opt.toLowerCase()}
              onChange={handleInputChange}
              className="accent-[#C8A35F] h-4 w-4"
            /> {opt}
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <div className="bg-[#FAF8F3] p-8 font-sans max-w-5xl mx-auto shadow-inner rounded-sm">
      <div className="flex justify-between items-center mb-10">
        <h3 className="text-[24px] font-semibold text-[#111111]" style={{ fontFamily: 'Georgia, serif' }}>Ficha de Anamnese Estética</h3>
        <span className="text-[11px] text-[#96A4C1] uppercase tracking-widest">Data: {new Date().toLocaleDateString('pt-BR')}</span>
      </div>

      <div className="space-y-8">
        {/* BLOCO 1: PERFIL E QUEIXA */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="block text-[11px] font-bold uppercase text-[#96A4C1] mb-2">Qual sua profissão?</label>
            <input 
              name="profession"
              value={formData.profession}
              onChange={handleInputChange}
              type="text" 
              placeholder="Ex: Advogada, Médica..."
              className="w-full border-b border-[#D9DEEA] bg-transparent py-2 outline-none focus:border-[#C8A35F] text-[#111111]" 
            />
          </div>
          <RadioGroup label="Se expõe ao sol frequentemente?" name="sunExposure" />
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase text-[#96A4C1] mb-2">Queixa Principal</label>
          <textarea 
            name="mainComplaint"
            value={formData.mainComplaint}
            onChange={handleInputChange}
            placeholder="Descreva o que mais te incomoda hoje..."
            className="w-full border border-[#D9DEEA] bg-white p-4 outline-none focus:border-[#C8A35F] h-24 rounded-sm text-[#111111]" 
          />
        </div>

        {/* BLOCO 2: HISTÓRICO ESTÉTICO */}
        <SectionTitle title="Histórico de Procedimentos" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="block text-[11px] font-bold uppercase text-[#96A4C1] mb-2">Já fez preenchimento? Quais regiões e a quanto tempo?</label>
            <input name="fillersHistory" value={formData.fillersHistory} onChange={handleInputChange} type="text" className="w-full border-b border-[#D9DEEA] bg-transparent py-2 outline-none focus:border-[#C8A35F]" />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase text-[#96A4C1] mb-2">Já aplicou toxina botulínica? Há quanto tempo e quais regiões?</label>
            <input name="botoxHistory" value={formData.botoxHistory} onChange={handleInputChange} type="text" className="w-full border-b border-[#D9DEEA] bg-transparent py-2 outline-none focus:border-[#C8A35F]" />
          </div>
        </div>

        {/* BLOCO 3: SAÚDE GERAL */}
        <SectionTitle title="Saúde e Medicamentos" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <RadioGroup label="Está tomando Roacutan?" name="roacutan" />
          <div className="md:col-span-2">
            <label className="block text-[11px] font-bold uppercase text-[#96A4C1] mb-2">Tomando algum medicamento/vitaminas? Quais?</label>
            <input name="medications" value={formData.medications} onChange={handleInputChange} type="text" className="w-full border-b border-[#D9DEEA] bg-transparent py-2 outline-none focus:border-[#C8A35F]" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <RadioGroup label="Tem alergia a ovo (albumina)?" name="eggAllergy" />
          <div className="md:col-span-2">
            <label className="block text-[11px] font-bold uppercase text-[#96A4C1] mb-2">Tem alergia a fruto do mar (camarão/lagosta)?</label>
            <input name="seafoodAllergy" value={formData.seafoodAllergy} onChange={handleInputChange} type="text" className="w-full border-b border-[#D9DEEA] bg-transparent py-2 outline-none focus:border-[#C8A35F]" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <RadioGroup label="Já levou anestesia de dentista?" name="dentistAnesthesia" />
          <RadioGroup label="Teve alguma reação à anestesia?" name="anesthesiaReaction" />
        </div>

        {/* BLOCO 4: REAÇÕES E DOENÇAS */}
        <SectionTitle title="Restrições Médicas" />
        <div className="space-y-6">
          <div>
            <label className="block text-[11px] font-bold uppercase text-[#96A4C1] mb-2">Já teve alguma reação indesejada a algum procedimento?</label>
            <input name="procedureReaction" value={formData.procedureReaction} onChange={handleInputChange} type="text" className="w-full border-b border-[#D9DEEA] bg-transparent py-2 outline-none focus:border-[#C8A35F]" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <RadioGroup label="Tem tendência a cicatriz ou queloide?" name="keloidHistory" />
            <RadioGroup label="Possui Herpes?" name="herpes" />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-[#96A4C1] mb-2">Tem alguma doença degenerativa?</label>
            <input name="degenerativeDisease" value={formData.degenerativeDisease} onChange={handleInputChange} type="text" className="w-full border-b border-[#D9DEEA] bg-transparent py-2 outline-none focus:border-[#C8A35F]" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <RadioGroup label="É Fumante?" name="smoker" />
            <RadioGroup label="Pressão Arterial" name="bloodPressure" options={["ALTA", "NORMAL", "BAIXA"]} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <RadioGroup label="Está grávida ou amamentando?" name="pregnant" />
            <RadioGroup label="Já passou por alguma gestação?" name="previousPregnancy" />
          </div>
        </div>

        {/* BLOCO 5: ESTILO DE VIDA E METAS */}
        <SectionTitle title="Estilo de Vida e Objetivos" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <RadioGroup label="Faz exercícios físicos intensos?" name="intenseExercise" />
          <div>
            <label className="block text-[11px] font-bold uppercase text-[#96A4C1] mb-2">Cuidados de skincare em casa? O que usa?</label>
            <input name="skincareRoutine" value={formData.skincareRoutine} onChange={handleInputChange} type="text" className="w-full border-b border-[#D9DEEA] bg-transparent py-2 outline-none focus:border-[#C8A35F]" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <RadioGroup label="Processo de emagrecimento severo?" name="weightLossProcess" />
           <div>
            <label className="block text-[11px] font-bold uppercase text-[#96A4C1] mb-2">Quantos kg perdeu?</label>
            <input name="weightLossAmount" value={formData.weightLossAmount} onChange={handleInputChange} type="text" placeholder="Ex: 10kg" className="w-full border-b border-[#D9DEEA] bg-transparent py-2 outline-none focus:border-[#C8A35F]" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="block text-[11px] font-bold uppercase text-[#96A4C1] mb-2">Pretende emagrecer quanto?</label>
            <input name="weightGoal" value={formData.weightGoal} onChange={handleInputChange} type="text" className="w-full border-b border-[#D9DEEA] bg-transparent py-2 outline-none focus:border-[#C8A35F]" />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase text-[#96A4C1] mb-2">Pretende passar por alguma cirurgia?</label>
            <input name="surgeryGoal" value={formData.surgeryGoal} onChange={handleInputChange} type="text" className="w-full border-b border-[#D9DEEA] bg-transparent py-2 outline-none focus:border-[#C8A35F]" />
          </div>
        </div>

        {/* FINALIZAÇÃO */}
        <SectionTitle title="Informações Adicionais" />
        <div className="space-y-6">
          <div>
            <label className="block text-[11px] font-bold uppercase text-[#96A4C1] mb-2">Possui implantes permanentes (PMMA, Silicone, Hidrogel)?</label>
            <input name="permanentImplants" value={formData.permanentImplants} onChange={handleInputChange} type="text" className="w-full border-b border-[#D9DEEA] bg-transparent py-2 outline-none focus:border-[#C8A35F]" />
          </div>

          <div className="bg-white p-6 border border-[#E9DEC9] rounded-sm">
            <label className="flex items-start gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={formData.agreement}
                onChange={(e) => setFormData(prev => ({ ...prev, agreement: e.target.checked }))}
                className="mt-1 h-4 w-4 accent-[#4A9B68]" 
              />
              <span className="text-[13px] text-[#111111] leading-relaxed">
                Afirmo que todas as informações prestadas nesta ficha são verdadeiras e completas, conforme meu conhecimento. 
                Autorizo a profissional responsável a conduzir a avaliação estética, ciente de que a omissão ou distorção 
                de dados pode comprometer minha segurança e o resultado do tratamento.
              </span>
            </label>
          </div>
        </div>

        <div className="mt-12 flex justify-end gap-4 border-t border-[#EEF1F5] pt-8">
          <button 
            type="button"
            onClick={onCancel}
            className="px-8 py-3 text-[11px] font-bold uppercase tracking-widest text-[#64748B] hover:text-[#111111] transition-all"
          >
            Cancelar
          </button>
          <button 
            type="button"
            disabled={!formData.agreement}
            onClick={() => onSave(formData)}
            className="bg-[#4A9B68] text-white px-10 py-3 text-[11px] font-bold uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-[#3d8055] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Save size={16} /> Salvar Anamnese
          </button>
        </div>
      </div>
    </div>
  );
}