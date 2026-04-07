"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, MapPin, Stethoscope, Megaphone, CheckCircle } from "lucide-react";

type PatientFormData = {
  id?: string;
  name: string; email: string; phone: string; birthDate: string;
  cpf: string; rg: string; notes: string; isActive: boolean;
  zipCode: string; address: string; addressNumber: string; addressComplement: string;
  neighborhood: string; city: string; state: string;
  crmSource: string; interestProcedure: string;
  
  // Anamnese Completa
  profession: string; sunExposure: boolean; mainComplaint: string;
  previousFillers: string; previousBotox: string; takingRoacutan: boolean;
  medications: string; allergicToEgg: boolean; allergicToSeafood: string;
  dentalAnesthesia: boolean; dentalAnesthesiaReaction: boolean;
  procedureReaction: string; keloidTendency: boolean; degenerativeDisease: string;
  diseases: string; allergies: string; hasHerpes: boolean; smoker: boolean;
  bloodPressure: string; pregnantOrNursing: boolean; previousPregnancies: boolean;
  exercises: boolean; skinCareRoutine: string; weightLoss: string;
  intendsToLoseWeight: string; intendsSurgery: string; surgeries: string;
  recentTreatmentOrVaccine: string; permanentImplants: string; consentSigned: boolean;
};

type Props = {
  mode: "create" | "edit";
  patient?: any;
};

// ==========================================
// COMPONENTES E FUNÇÕES EXTRAÍDOS PARA FORA
// (Isso resolve o bug de perder o foco ao digitar)
// ==========================================

const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
};

const formatCPF = (value: string) => {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
};

const formatCEP = (value: string) => {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5, 8)}`;
};

const TabButton = ({ id, icon: Icon, label, activeTab, setActiveTab }: any) => (
  <button type="button" onClick={() => setActiveTab(id)} className={`flex items-center gap-2 px-5 py-3 text-[11px] font-bold uppercase tracking-widest transition-all border-b-2 ${activeTab === id ? "border-[#C8A35F] text-[#C8A35F] bg-[#FCFAF6]" : "border-transparent text-gray-400 hover:text-gray-600"}`}>
    <Icon size={14} /> {label}
  </button>
);

const CustomInput = ({ label, field, type = "text", placeholder = "", mask, formData, handleChange }: any) => (
  <div className="w-full">
    <label className="mb-2 block text-[13px] text-gray-600">{label}</label>
    <input type={type} value={formData[field as keyof PatientFormData] as string} onChange={(e) => {
        let val = e.target.value;
        if (mask === "phone") val = formatPhone(val);
        if (mask === "cpf") val = formatCPF(val);
        if (mask === "cep") val = formatCEP(val);
        handleChange(field, val);
      }} placeholder={placeholder} className="w-full border border-gray-300 rounded-md py-2 px-3 text-[14px] outline-none focus:border-[#C8A35F] bg-white text-gray-800" />
  </div>
);

const RadioSimNao = ({ label, field, formData, handleChange }: any) => (
  <div className="w-full">
    <label className="mb-2 block text-[13px] text-gray-600">{label}</label>
    <div className="flex gap-4">
      <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
        <input type="radio" checked={formData[field] === true} onChange={() => handleChange(field, true)} className="accent-[#C8A35F]" /> Sim
      </label>
      <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
        <input type="radio" checked={formData[field] === false} onChange={() => handleChange(field, false)} className="accent-[#C8A35F]" /> Não
      </label>
    </div>
  </div>
);

// ==========================================
// COMPONENTE PRINCIPAL DO FORMULÁRIO
// ==========================================

export default function PatientForm({ mode, patient }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"GERAL" | "ENDERECO" | "CRM" | "ANAMNESE">("ANAMNESE");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState<PatientFormData>({
    name: patient?.name || "", email: patient?.email || "", phone: patient?.phone || "",
    birthDate: patient?.birthDate ? patient.birthDate.slice(0, 10) : "",
    cpf: patient?.cpf || "", rg: patient?.rg || "", notes: patient?.notes || "", isActive: patient?.isActive ?? true,
    zipCode: patient?.zipCode || "", address: patient?.address || "", addressNumber: patient?.addressNumber || "",
    addressComplement: patient?.addressComplement || "", neighborhood: patient?.neighborhood || "",
    city: patient?.city || "", state: patient?.state || "",
    crmSource: patient?.crmSource || "", interestProcedure: patient?.interestProcedure || "",
    
    // Anamnese
    profession: patient?.anamnesis?.profession || "", sunExposure: patient?.anamnesis?.sunExposure || false,
    mainComplaint: patient?.anamnesis?.mainComplaint || "", previousFillers: patient?.anamnesis?.previousFillers || "",
    previousBotox: patient?.anamnesis?.previousBotox || "", takingRoacutan: patient?.anamnesis?.takingRoacutan || false,
    medications: patient?.anamnesis?.medications || "", allergicToEgg: patient?.anamnesis?.allergicToEgg || false,
    allergicToSeafood: patient?.anamnesis?.allergicToSeafood || "", dentalAnesthesia: patient?.anamnesis?.dentalAnesthesia || false,
    dentalAnesthesiaReaction: patient?.anamnesis?.dentalAnesthesiaReaction || false, procedureReaction: patient?.anamnesis?.procedureReaction || "",
    keloidTendency: patient?.anamnesis?.keloidTendency || false, degenerativeDisease: patient?.anamnesis?.degenerativeDisease || "",
    diseases: patient?.anamnesis?.diseases || "", allergies: patient?.anamnesis?.allergies || "",
    hasHerpes: patient?.anamnesis?.hasHerpes || false, smoker: patient?.anamnesis?.smoker || false,
    bloodPressure: patient?.anamnesis?.bloodPressure || "", pregnantOrNursing: patient?.anamnesis?.pregnantOrNursing || false,
    previousPregnancies: patient?.anamnesis?.previousPregnancies || false, exercises: patient?.anamnesis?.exercises || false,
    skinCareRoutine: patient?.anamnesis?.skinCareRoutine || "", weightLoss: patient?.anamnesis?.weightLoss || "",
    intendsToLoseWeight: patient?.anamnesis?.intendsToLoseWeight || "", intendsSurgery: patient?.anamnesis?.intendsSurgery || "",
    surgeries: patient?.anamnesis?.surgeries || "", recentTreatmentOrVaccine: patient?.anamnesis?.recentTreatmentOrVaccine || "",
    permanentImplants: patient?.anamnesis?.permanentImplants || "", consentSigned: patient?.anamnesis?.consentSigned || false,
  });

  const handleChange = (field: keyof PatientFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // --- EFEITO MÁGICO: BUSCA DE CEP AUTOMÁTICA ---
  useEffect(() => {
    const cepNumeros = formData.zipCode.replace(/\D/g, "");
    
    if (cepNumeros.length === 8) {
      fetch(`https://viacep.com.br/ws/${cepNumeros}/json/`)
        .then((res) => res.json())
        .then((data) => {
          if (!data.erro) {
            setFormData((prev) => ({
              ...prev,
              address: data.logradouro || prev.address,
              neighborhood: data.bairro || prev.neighborhood,
              city: data.localidade || prev.city,
              state: data.uf || prev.state,
            }));
          }
        })
        .catch((err) => console.error("Erro ao buscar CEP:", err));
    }
  }, [formData.zipCode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const url = mode === "create" ? "/api/patients" : `/api/patients/${patient?.id}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Erro ao salvar paciente");

      router.push(mode === "create" ? `/patients/${data.id}` : `/patients/${patient?.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-[#E9DEC9] shadow-sm rounded-xl overflow-hidden font-sans">
      <div className="flex border-b border-[#E9DEC9] bg-[#FAFAFA] overflow-x-auto">
        <TabButton id="GERAL" icon={User} label="Dados Pessoais" activeTab={activeTab} setActiveTab={setActiveTab} />
        <TabButton id="ENDERECO" icon={MapPin} label="Endereço" activeTab={activeTab} setActiveTab={setActiveTab} />
        <TabButton id="CRM" icon={Megaphone} label="Marketing / CRM" activeTab={activeTab} setActiveTab={setActiveTab} />
        <TabButton id="ANAMNESE" icon={Stethoscope} label="Ficha de Anamnese" activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>

      <div className="p-8 max-h-[70vh] overflow-y-auto">
        {error && <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600 font-light">{error}</div>}

        {activeTab === "GERAL" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CustomInput label="Nome Completo *" field="name" placeholder="Ex: Maria Silva" formData={formData} handleChange={handleChange} />
              <CustomInput label="E-mail" field="email" type="email" placeholder="paciente@exemplo.com" formData={formData} handleChange={handleChange} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <CustomInput label="Telefone / WhatsApp" field="phone" mask="phone" placeholder="(11) 99999-8888" formData={formData} handleChange={handleChange} />
              <CustomInput label="Data de Nascimento" field="birthDate" type="date" formData={formData} handleChange={handleChange} />
              <CustomInput label="CPF" field="cpf" mask="cpf" placeholder="000.000.000-00" formData={formData} handleChange={handleChange} />
              <CustomInput label="RG" field="rg" placeholder="00.000.000-0" formData={formData} handleChange={handleChange} />
            </div>
            <div>
              <label className="mb-2 block text-[13px] text-gray-600">Alerta Crítico (Insight Clínico)</label>
              <textarea value={formData.notes} onChange={(e) => handleChange("notes", e.target.value)} className="w-full border border-gray-300 rounded-md py-2 px-3 text-[14px] outline-none focus:border-[#C8A35F] bg-white text-gray-800 min-h-15" />
            </div>
          </div>
        )}

        {activeTab === "ENDERECO" && (
          <div className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <CustomInput label="CEP" field="zipCode" mask="cep" placeholder="00000-000" formData={formData} handleChange={handleChange} />
              <div className="md:col-span-2"><CustomInput label="Endereço / Rua" field="address" formData={formData} handleChange={handleChange} /></div>
              <CustomInput label="Número" field="addressNumber" formData={formData} handleChange={handleChange} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <CustomInput label="Complemento" field="addressComplement" formData={formData} handleChange={handleChange} />
              <CustomInput label="Bairro" field="neighborhood" formData={formData} handleChange={handleChange} />
              <div className="grid grid-cols-2 gap-4">
                <CustomInput label="Cidade" field="city" formData={formData} handleChange={handleChange} />
                <CustomInput label="Estado" field="state" formData={formData} handleChange={handleChange} />
              </div>
            </div>
          </div>
        )}

        {activeTab === "CRM" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="mb-2 block text-[13px] text-gray-600">Como nos conheceu?</label>
                <select value={formData.crmSource} onChange={(e) => handleChange("crmSource", e.target.value)} className="w-full border border-gray-300 rounded-md py-2 px-3 text-[14px] outline-none focus:border-[#C8A35F] bg-white text-gray-800">
                  <option value="">Selecione...</option>
                  <option value="Instagram">Instagram</option>
                  <option value="Google">Google</option>
                  <option value="Indicação">Indicação</option>
                  <option value="Fachada">Fachada</option>
                </select>
              </div>
              <CustomInput label="Procedimento de Maior Interesse" field="interestProcedure" formData={formData} handleChange={handleChange} />
            </div>
          </div>
        )}

        {activeTab === "ANAMNESE" && (
          <div className="space-y-5 animate-in fade-in duration-300 pb-10">
            <CustomInput label="Qual sua profissão?" field="profession" placeholder="Qual sua profissão?..." formData={formData} handleChange={handleChange} />
            <RadioSimNao label="Se expõe ao sol frequentemente?" field="sunExposure" formData={formData} handleChange={handleChange} />
            <CustomInput label="Queixa Principal" field="mainComplaint" placeholder="Queixa Principal..." formData={formData} handleChange={handleChange} />
            <CustomInput label="Já fez preenchimento? Quais regiões e a quanto tempo?" field="previousFillers" placeholder="Já fez preenchimento?..." formData={formData} handleChange={handleChange} />
            <CustomInput label="Já aplicou toxina botulínica? Há quanto tempo e quais regiões?" field="previousBotox" placeholder="Já aplicou toxina botulínica?..." formData={formData} handleChange={handleChange} />
            <RadioSimNao label="Está tomando roacutan?" field="takingRoacutan" formData={formData} handleChange={handleChange} />
            <CustomInput label="Está tomando algum medicamento? Vitaminas ou suplementos? Quais?" field="medications" placeholder="Está tomando algum medicamento?..." formData={formData} handleChange={handleChange} />
            <RadioSimNao label="Tem alergia do ovo (albumina)?" field="allergicToEgg" formData={formData} handleChange={handleChange} />
            <CustomInput label="Tem alergias a fruto do mar (camarão/lagosta)?" field="allergicToSeafood" placeholder="Tem alergias a fruto do mar?..." formData={formData} handleChange={handleChange} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <RadioSimNao label="Já levou anestesia de dentista?" field="dentalAnesthesia" formData={formData} handleChange={handleChange} />
              <RadioSimNao label="Teve alguma reação a anesteia de dentista?" field="dentalAnesthesiaReaction" formData={formData} handleChange={handleChange} />
            </div>

            <CustomInput label="Já teve alguma reação indesejada a algum procedimento?" field="procedureReaction" placeholder="Já teve alguma reação indesejada?..." formData={formData} handleChange={handleChange} />
            <RadioSimNao label="Tem tendência a cicatriz ou quelóide?" field="keloidTendency" formData={formData} handleChange={handleChange} />
            <CustomInput label="Tem alguma doença degenerativa?" field="degenerativeDisease" placeholder="Tem alguma doença degenerativa?..." formData={formData} handleChange={handleChange} />
            <CustomInput label="Tem alguma doença?" field="diseases" placeholder="Tem alguma doença?..." formData={formData} handleChange={handleChange} />
            <CustomInput label="Possui alergia a algum produto, comida, medicamento ou outros?" field="allergies" placeholder="Possui alergia a algum produto?..." formData={formData} handleChange={handleChange} />
            <RadioSimNao label="Possui herpes?" field="hasHerpes" formData={formData} handleChange={handleChange} />
            <RadioSimNao label="Fumante?" field="smoker" formData={formData} handleChange={handleChange} />

            {/* Pressão */}
            <div>
              <label className="mb-2 block text-[13px] text-gray-600">Pressão</label>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer"><input type="radio" checked={formData.bloodPressure === "ALTA"} onChange={() => handleChange("bloodPressure", "ALTA")} className="accent-[#C8A35F]" /> ALTA</label>
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer"><input type="radio" checked={formData.bloodPressure === "NORMAL"} onChange={() => handleChange("bloodPressure", "NORMAL")} className="accent-[#C8A35F]" /> NORMAL</label>
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer"><input type="radio" checked={formData.bloodPressure === "BAIXA"} onChange={() => handleChange("bloodPressure", "BAIXA")} className="accent-[#C8A35F]" /> BAIXA</label>
              </div>
            </div>

            <RadioSimNao label="Está grávida ou amamentando?" field="pregnantOrNursing" formData={formData} handleChange={handleChange} />
            <RadioSimNao label="Já passou por alguma gestação?" field="previousPregnancies" formData={formData} handleChange={handleChange} />
            <RadioSimNao label="Faz exercícios físicos intensos?" field="exercises" formData={formData} handleChange={handleChange} />
            <CustomInput label="Tem cuidados de skincare (cuidados com a pele) em casa? O que usa?" field="skinCareRoutine" placeholder="Tem cuidados de skincare?..." formData={formData} handleChange={handleChange} />
            
            {/* Peso */}
            <div>
              <label className="mb-2 block text-[13px] text-gray-600">Passou por algum processo de emagrecimento severo? Quantos kg perdeu?</label>
              <div className="flex flex-col gap-2">
                {["+5kg", "+10kg", "+20kg", "+40kg", "não"].map(peso => (
                  <label key={peso} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input type="radio" checked={formData.weightLoss === peso} onChange={() => handleChange("weightLoss", peso)} className="accent-[#C8A35F]" /> {peso}
                  </label>
                ))}
              </div>
            </div>

            <CustomInput label="Pretende emagrecer?" field="intendsToLoseWeight" placeholder="Pretende emagrecer?..." formData={formData} handleChange={handleChange} />
            <CustomInput label="Pretende passar por alguma cirurgia?" field="intendsSurgery" placeholder="Pretende passar por alguma cirurgia?..." formData={formData} handleChange={handleChange} />
            <CustomInput label="Já fez alguma cirurgia? Há quanto tempo?" field="surgeries" placeholder="Já fez alguma cirurgia?..." formData={formData} handleChange={handleChange} />
            <CustomInput label="Está em tratamento medicamentoso ou tomou vacina nos últimos 30 dias?" field="recentTreatmentOrVaccine" placeholder="Está em tratamento medicamentoso?..." formData={formData} handleChange={handleChange} />
            <CustomInput label="Possui implantes permanentes (PMMA, Silicone, Hidrogel)" field="permanentImplants" placeholder="Possui implantes permanentes?..." formData={formData} handleChange={handleChange} />
            
            <div className="pt-4 mt-4 border-t border-gray-200">
              <p className="text-[12px] text-gray-600 mb-3 leading-relaxed">
                Afirmo que todas as informações prestadas nesta ficha são verdadeiras e completas,
                conforme meu conhecimento. Autorizo a profissional responsável a conduzir a
                avaliação estética, ciente de que a omissão ou distorção de dados pode comprometer
                minha segurança.
              </p>
              <label className="flex items-center gap-2 text-sm text-gray-800 cursor-pointer font-medium">
                <input type="checkbox" checked={formData.consentSigned} onChange={(e) => handleChange("consentSigned", e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-[#C8A35F] focus:ring-[#C8A35F]" />
                Li e concordo
              </label>
            </div>
          </div>
        )}
      </div>

      <div className="bg-[#FCFAF6] border-t border-[#E9DEC9] p-6 flex justify-between items-center">
        <p className="text-[10px] text-[#96A4C1] uppercase tracking-widest hidden md:block">Preencha as abas antes de salvar.</p>
        <div className="flex gap-4">
          <button type="button" onClick={() => router.back()} className="px-6 py-3 text-[11px] font-bold uppercase tracking-widest text-[#96A4C1] hover:text-[#111] transition-all">Cancelar</button>
          <button type="submit" disabled={saving || !formData.name} className="flex items-center gap-2 bg-[#25D366] px-8 py-3 text-[11px] font-bold uppercase tracking-widest text-white hover:bg-[#1EBE5A] transition-all active:scale-95 disabled:opacity-60 rounded-md shadow-md">
            <CheckCircle size={14} />
            {saving ? "Salvando..." : "Salvar Cadastro"}
          </button>
        </div>
      </div>
    </form>
  );
}