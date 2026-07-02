"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, MapPin, Stethoscope, Megaphone, CheckCircle } from "lucide-react";
import { conversionStatuses, patientOrigins, patientProfiles, patientStatuses } from "@/lib/brand";

type PatientFormData = {
  id?: string;
  name: string; email: string; phone: string; birthDate: string;
  cpf: string; rg: string; notes: string; isActive: boolean;
  zipCode: string; address: string; addressNumber: string; addressComplement: string;
  neighborhood: string; city: string; state: string;
  crmSource: string; referralName: string; crmStatus: string; imageAuthorized: boolean; interestProcedure: string;
  patientProfile: string; commercialNotes: string; conversionStatus: string; proposedValue: string; closedValue: string; lostReason: string; firstEvaluationAt: string; nextSuggestedAt: string;
  
  // Anamnese Completa
  profession: string; sunExposure: boolean; mainComplaint: string; previousAestheticProcedures: string;
  previousFillers: string; previousBotox: string; takingRoacutan: boolean; roacutanDetails: string;
  medications: string; allergicToEgg: boolean; allergicToSeafood: string;
  dentalAnesthesia: boolean; dentalAnesthesiaReaction: boolean;
  procedureReaction: string; keloidTendency: boolean; degenerativeDisease: string;
  diseases: string; allergies: string; hasHerpes: boolean; smoker: boolean;
  bloodPressure: string; pregnantOrNursing: boolean; previousPregnancies: boolean;
  exercises: boolean; skinCareRoutine: string; weightLoss: string;
  intendsToLoseWeight: string; intendsSurgery: string; surgeries: string;
  recentTreatmentOrVaccine: string; permanentImplants: string; consentSigned: boolean; waterIntake: string; cancerHistory: boolean; circulationProblems: string; usesAspirin: boolean;
  usesAnticoagulant: boolean; hasAutoimmuneDisease: boolean; hasDiabetes: boolean; hasEpilepsy: boolean; activeInfection: boolean; recentDentalProcedure: boolean; fillerComplicationHistory: string; clinicalRiskNotes: string;
};

type Props = {
  mode: "create" | "edit";
  patient?: any;
};

// ==========================================
// COMPONENTES E FUNÇÕES EXTRAÍDOS PARA FORA
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
  <button type="button" onClick={() => setActiveTab(id)} className={`flex items-center gap-2 px-5 py-3 text-[11px] font-bold uppercase tracking-widest transition-all border-b-2 ${activeTab === id ? "border-[#5A1F2B] text-[#5A1F2B] bg-[#FCFAF6]" : "border-transparent text-gray-400 hover:text-gray-600"}`}>
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
      }} placeholder={placeholder} className="w-full border border-gray-300 rounded-md py-2 px-3 text-[14px] outline-none focus:border-[#5A1F2B] bg-white text-gray-800" />
  </div>
);

const RadioSimNao = ({ label, field, formData, handleChange }: any) => (
  <div className="w-full">
    <label className="mb-2 block text-[13px] text-gray-600">{label}</label>
    <div className="flex gap-4">
      <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
        <input type="radio" checked={formData[field] === true} onChange={() => handleChange(field, true)} className="accent-[#5A1F2B]" /> Sim
      </label>
      <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
        <input type="radio" checked={formData[field] === false} onChange={() => handleChange(field, false)} className="accent-[#5A1F2B]" /> Não
      </label>
    </div>
  </div>
);

// ==========================================
// COMPONENTE PRINCIPAL DO FORMULÁRIO
// ==========================================

export default function PatientForm({ mode, patient }: Props) {
  const router = useRouter();
  
  // 👈 CORREÇÃO: Começa na aba GERAL
  const [activeTab, setActiveTab] = useState<"GERAL" | "ENDERECO" | "CRM" | "ANAMNESE">("GERAL");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState<PatientFormData>({
    name: patient?.name || "", email: patient?.email || "", phone: patient?.phone || "",
    birthDate: patient?.birthDate ? patient.birthDate.slice(0, 10) : "",
    cpf: patient?.cpf || "", rg: patient?.rg || "", notes: patient?.notes || "", isActive: patient?.isActive ?? true,
    zipCode: patient?.zipCode || "", address: patient?.address || "", addressNumber: patient?.addressNumber || "",
    addressComplement: patient?.addressComplement || "", neighborhood: patient?.neighborhood || "",
    city: patient?.city || "", state: patient?.state || "",
    crmSource: patient?.crmSource || "", referralName: patient?.referralName || "", crmStatus: patient?.crmStatus || "Novo Lead", imageAuthorized: patient?.imageAuthorized || false, interestProcedure: patient?.interestProcedure || "",
    patientProfile: patient?.patientProfile || "", commercialNotes: patient?.commercialNotes || "", conversionStatus: patient?.conversionStatus || "", proposedValue: patient?.proposedValue ? String(patient.proposedValue) : "", closedValue: patient?.closedValue ? String(patient.closedValue) : "", lostReason: patient?.lostReason || "", firstEvaluationAt: patient?.firstEvaluationAt ? patient.firstEvaluationAt.slice(0, 10) : "", nextSuggestedAt: patient?.nextSuggestedAt ? patient.nextSuggestedAt.slice(0, 10) : "",
    
    // Anamnese
    profession: patient?.anamnesis?.profession || "", sunExposure: patient?.anamnesis?.sunExposure || false,
    mainComplaint: patient?.anamnesis?.mainComplaint || "", previousAestheticProcedures: patient?.anamnesis?.previousAestheticProcedures || "", previousFillers: patient?.anamnesis?.previousFillers || "",
    previousBotox: patient?.anamnesis?.previousBotox || "", takingRoacutan: patient?.anamnesis?.takingRoacutan || false,
    roacutanDetails: patient?.anamnesis?.roacutanDetails || "",
    medications: patient?.anamnesis?.medications || "", allergicToEgg: patient?.anamnesis?.allergicToEgg || false,
    allergicToSeafood: patient?.anamnesis?.allergicToSeafood || "", dentalAnesthesia: patient?.anamnesis?.dentalAnesthesia || false,
    dentalAnesthesiaReaction: patient?.anamnesis?.dentalAnesthesiaReaction || false, procedureReaction: patient?.anamnesis?.procedureReaction || "",
    keloidTendency: patient?.anamnesis?.keloidTendency || false, degenerativeDisease: patient?.anamnesis?.degenerativeDisease || "",
    diseases: patient?.anamnesis?.diseases || "", allergies: patient?.anamnesis?.allergies || "",
    hasHerpes: patient?.anamnesis?.hasHerpes || false, smoker: patient?.anamnesis?.smoker || false,
    bloodPressure: patient?.anamnesis?.bloodPressure || "", waterIntake: patient?.anamnesis?.waterIntake || "", pregnantOrNursing: patient?.anamnesis?.pregnantOrNursing || false,
    previousPregnancies: patient?.anamnesis?.previousPregnancies || false, exercises: patient?.anamnesis?.exercises || false,
    skinCareRoutine: patient?.anamnesis?.skinCareRoutine || "", weightLoss: patient?.anamnesis?.weightLoss || "",
    intendsToLoseWeight: patient?.anamnesis?.intendsToLoseWeight || "", intendsSurgery: patient?.anamnesis?.intendsSurgery || "",
    surgeries: patient?.anamnesis?.surgeries || "", recentTreatmentOrVaccine: patient?.anamnesis?.recentTreatmentOrVaccine || "",
    permanentImplants: patient?.anamnesis?.permanentImplants || "", consentSigned: patient?.anamnesis?.consentSigned || false,
    usesAspirin: patient?.anamnesis?.usesAspirin || false,
    usesAnticoagulant: patient?.anamnesis?.usesAnticoagulant || false, hasAutoimmuneDisease: patient?.anamnesis?.hasAutoimmuneDisease || false,
    cancerHistory: patient?.anamnesis?.cancerHistory || false,
    hasDiabetes: patient?.anamnesis?.hasDiabetes || false, hasEpilepsy: patient?.anamnesis?.hasEpilepsy || false,
    activeInfection: patient?.anamnesis?.activeInfection || false, recentDentalProcedure: patient?.anamnesis?.recentDentalProcedure || false,
    circulationProblems: patient?.anamnesis?.circulationProblems || "",
    fillerComplicationHistory: patient?.anamnesis?.fillerComplicationHistory || "", clinicalRiskNotes: patient?.anamnesis?.clinicalRiskNotes || "",
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
    <form onSubmit={handleSubmit} className="bg-[#FBF8F2] border border-[rgba(90,31,43,.12)] shadow-sm rounded-xl overflow-hidden font-sans">
      <div className="flex border-b border-[#E9DEC9] bg-[#F7F2EA] overflow-x-auto">
        <TabButton id="GERAL" icon={User} label="Dados Pessoais" activeTab={activeTab} setActiveTab={setActiveTab} />
        <TabButton id="ENDERECO" icon={MapPin} label="Endereço" activeTab={activeTab} setActiveTab={setActiveTab} />
        <TabButton id="CRM" icon={Megaphone} label="Relacionamento / CRM" activeTab={activeTab} setActiveTab={setActiveTab} />
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
              <textarea value={formData.notes} onChange={(e) => handleChange("notes", e.target.value)} className="w-full border border-gray-300 rounded-md py-2 px-3 text-[14px] outline-none focus:border-[#5A1F2B] bg-white text-gray-800 min-h-15" />
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
                <label className="mb-2 block text-[13px] text-gray-600">Origem da paciente</label>
                <select value={formData.crmSource} onChange={(e) => handleChange("crmSource", e.target.value)} className="w-full border border-gray-300 rounded-md py-2 px-3 text-[14px] outline-none focus:border-[#5A1F2B] bg-white text-gray-800">
                  <option value="">Selecione...</option>
                  {patientOrigins.map((origin) => <option key={origin} value={origin}>{origin}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-[13px] text-gray-600">Status no CRM</label>
                <select value={formData.crmStatus} onChange={(e) => handleChange("crmStatus", e.target.value)} className="w-full border border-gray-300 rounded-md py-2 px-3 text-[14px] outline-none focus:border-[#5A1F2B] bg-white text-gray-800">
                  {patientStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </div>
              <CustomInput label="Nome da indicação" field="referralName" placeholder="Quem indicou a paciente?" formData={formData} handleChange={handleChange} />
              <CustomInput label="Procedimento de Maior Interesse" field="interestProcedure" formData={formData} handleChange={handleChange} />
              <div>
                <label className="mb-2 block text-[13px] text-gray-600">Perfil da paciente</label>
                <select value={formData.patientProfile} onChange={(e) => handleChange("patientProfile", e.target.value)} className="w-full border border-gray-300 rounded-md py-2 px-3 text-[14px] outline-none focus:border-[#5A1F2B] bg-white text-gray-800">
                  <option value="">Selecione...</option>
                  {patientProfiles.map((profile) => <option key={profile} value={profile}>{profile}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-[13px] text-gray-600">Resultado da avaliação</label>
                <select value={formData.conversionStatus} onChange={(e) => handleChange("conversionStatus", e.target.value)} className="w-full border border-gray-300 rounded-md py-2 px-3 text-[14px] outline-none focus:border-[#5A1F2B] bg-white text-gray-800">
                  <option value="">Não informado</option>
                  {conversionStatuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
                </select>
              </div>
              <CustomInput label="Valor proposto no plano" field="proposedValue" type="number" formData={formData} handleChange={handleChange} />
              <CustomInput label="Valor fechado" field="closedValue" type="number" formData={formData} handleChange={handleChange} />
              <CustomInput label="Primeira avaliação" field="firstEvaluationAt" type="date" formData={formData} handleChange={handleChange} />
              <CustomInput label="Próximo contato sugerido" field="nextSuggestedAt" type="date" formData={formData} handleChange={handleChange} />
              <div className="md:col-span-2">
                <label className="mb-2 block text-[13px] text-gray-600">Motivo de perda / objeção</label>
                <textarea value={formData.lostReason} onChange={(e) => handleChange("lostReason", e.target.value)} className="w-full border border-gray-300 rounded-md py-2 px-3 text-[14px] outline-none focus:border-[#5A1F2B] bg-white text-gray-800 min-h-16" />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-[13px] text-gray-600">Observações comerciais</label>
                <textarea value={formData.commercialNotes} onChange={(e) => handleChange("commercialNotes", e.target.value)} className="w-full border border-gray-300 rounded-md py-2 px-3 text-[14px] outline-none focus:border-[#5A1F2B] bg-white text-gray-800 min-h-20" />
              </div>
              <div className="md:col-span-2 rounded-2xl border border-[rgba(90,31,43,.12)] bg-[#F7F2EA]/70 p-4">
                <label className="mb-0 flex items-center gap-3 text-sm text-[#5B3A2E] cursor-pointer font-medium normal-case tracking-normal">
                  <input type="checkbox" checked={formData.imageAuthorized} onChange={(e) => handleChange("imageAuthorized", e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-[#5A1F2B] focus:ring-[#5A1F2B]" />
                  Paciente autorizou uso de imagem para antes e depois / divulgação autorizada.
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === "ANAMNESE" && (
          <div className="space-y-7 animate-in fade-in duration-300 pb-10">
            <div className="rounded-2xl border border-[#5A1F2B]/15 bg-[#F7F2EA]/70 p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-[#5A1F2B]">Ficha de anamnese</p>
              <p className="mt-2 text-[13px] leading-6 text-[#5B3A2E]/70">
                Essas respostas ficam salvas na ficha da paciente e podem ser preenchidas pela clínica ou pela paciente através do link on-line.
              </p>
            </div>

            <CustomInput label="Qual motivo te trouxe até essa consulta?" field="mainComplaint" placeholder="Descreva a principal queixa ou objetivo..." formData={formData} handleChange={handleChange} />
            <CustomInput label="Qual a sua profissão?" field="profession" placeholder="Ex.: empresária, arquiteta, dentista..." formData={formData} handleChange={handleChange} />
            <RadioSimNao label="Se expõe ao sol sem uso do filtro solar?" field="sunExposure" formData={formData} handleChange={handleChange} />
            <CustomInput label="Já realizou algum procedimento estético antes? Qual e há quanto tempo?" field="previousAestheticProcedures" placeholder="Ex.: botox há 6 meses, preenchimento labial há 1 ano..." formData={formData} handleChange={handleChange} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <RadioSimNao label="Já tomou Roacutan?" field="takingRoacutan" formData={formData} handleChange={handleChange} />
              <CustomInput label="Há quanto tempo tomou Roacutan?" field="roacutanDetails" placeholder="Ex.: há 8 meses, em uso atualmente..." formData={formData} handleChange={handleChange} />
            </div>

            <CustomInput label="Está tomando algum medicamento ou suplementação?" field="medications" placeholder="Medicamentos, vitaminas, suplementos, hormônios..." formData={formData} handleChange={handleChange} />
            <CustomInput label="Possui alguma alergia?" field="allergies" placeholder="Medicamentos, alimentos, cosméticos, anestésicos..." formData={formData} handleChange={handleChange} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <RadioSimNao label="Possui alergia a albumina (ovo)?" field="allergicToEgg" formData={formData} handleChange={handleChange} />
              <CustomInput label="Possui alergia a frutos do mar?" field="allergicToSeafood" placeholder="Ex.: camarão, lagosta, peixe..." formData={formData} handleChange={handleChange} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <RadioSimNao label="Já levou anestesia de dentista?" field="dentalAnesthesia" formData={formData} handleChange={handleChange} />
              <RadioSimNao label="Teve alguma reação à anestesia do dentista?" field="dentalAnesthesiaReaction" formData={formData} handleChange={handleChange} />
            </div>

            <CustomInput label="Já teve alguma reação indesejada a algum procedimento?" field="procedureReaction" placeholder="Descreva reação, procedimento e quando aconteceu..." formData={formData} handleChange={handleChange} />
            <RadioSimNao label="Tem tendência a cicatriz ou a queloide?" field="keloidTendency" formData={formData} handleChange={handleChange} />
            <CustomInput label="Possui alguma condição de saúde física, psíquica ou emocional?" field="diseases" placeholder="Ex.: ansiedade, depressão, hipertensão, doença autoimune, etc." formData={formData} handleChange={handleChange} />
            <RadioSimNao label="Possui herpes?" field="hasHerpes" formData={formData} handleChange={handleChange} />
            <RadioSimNao label="Fumante?" field="smoker" formData={formData} handleChange={handleChange} />

            <div>
              <label className="mb-2 block text-[13px] text-gray-600">Pressão</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {["ALTA", "NORMAL", "BAIXA"].map((pressao) => (
                  <label key={pressao} className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 cursor-pointer">
                    <input type="radio" checked={formData.bloodPressure === pressao} onChange={() => handleChange("bloodPressure", pressao)} className="accent-[#5A1F2B]" />
                    {pressao}
                  </label>
                ))}
              </div>
            </div>

            <CustomInput label="Ingere uma boa quantidade de água durante o dia?" field="waterIntake" placeholder="Ex.: sim, cerca de 2 litros/dia; não; pouca água..." formData={formData} handleChange={handleChange} />
            <RadioSimNao label="Está grávida ou amamentando?" field="pregnantOrNursing" formData={formData} handleChange={handleChange} />
            <RadioSimNao label="Faz exercícios físicos?" field="exercises" formData={formData} handleChange={handleChange} />
            <CustomInput label="Tem cuidados com a pele em casa? O que usa?" field="skinCareRoutine" placeholder="Sabonete, hidratante, ácidos, vitamina C, protetor solar..." formData={formData} handleChange={handleChange} />
            <CustomInput label="Passou ou pretende passar por um processo de emagrecimento com perda maior de 5kg?" field="weightLoss" placeholder="Ex.: perdi 8kg; pretendo emagrecer; não..." formData={formData} handleChange={handleChange} />
            <CustomInput label="Já fez ou pretende passar por alguma cirurgia?" field="surgeries" placeholder="Qual cirurgia e quando? Ou qual pretende fazer?" formData={formData} handleChange={handleChange} />
            <CustomInput label="Tomou vacina nos últimos 30 dias?" field="recentTreatmentOrVaccine" placeholder="Qual vacina e data aproximada?" formData={formData} handleChange={handleChange} />
            <RadioSimNao label="Possui doença autoimune?" field="hasAutoimmuneDisease" formData={formData} handleChange={handleChange} />
            <RadioSimNao label="Tem histórico de câncer?" field="cancerHistory" formData={formData} handleChange={handleChange} />
            <RadioSimNao label="Possui diabetes?" field="hasDiabetes" formData={formData} handleChange={handleChange} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <RadioSimNao label="Usa anticoagulantes ou medicamentos que afinam o sangue?" field="usesAnticoagulant" formData={formData} handleChange={handleChange} />
              <RadioSimNao label="Usa aspirina/AAS com frequência?" field="usesAspirin" formData={formData} handleChange={handleChange} />
            </div>

            <CustomInput label="Possui trombose ou algum problema de circulação?" field="circulationProblems" placeholder="Trombose, varizes importantes, má circulação, uso de meia, etc." formData={formData} handleChange={handleChange} />
            <CustomInput label="Possui implantes permanentes? (PMMA, silicone, hidrogel)" field="permanentImplants" placeholder="Região e tipo de implante, se souber..." formData={formData} handleChange={handleChange} />

            <div className="pt-4 mt-4 border-t border-gray-200">
              <p className="text-[12px] text-gray-600 mb-3 leading-relaxed">
                Afirmo que todas as informações prestadas nesta ficha são verdadeiras e completas,
                conforme meu conhecimento. Autorizo a profissional responsável a conduzir a
                avaliação estética, ciente de que a omissão ou distorção de dados pode comprometer
                minha segurança.
              </p>
              <label className="flex items-center gap-2 text-sm text-gray-800 cursor-pointer font-medium">
                <input type="checkbox" checked={formData.consentSigned} onChange={(e) => handleChange("consentSigned", e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-[#5A1F2B] focus:ring-[#C8A35F]" />
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
          <button type="submit" disabled={saving || !formData.name} className="flex items-center gap-2 bg-[#5A1F2B] px-8 py-3 text-[11px] font-bold uppercase tracking-widest text-[#F7F2EA] hover:bg-[#3F1620] transition-all active:scale-95 disabled:opacity-60 rounded-md shadow-md">
            <CheckCircle size={14} />
            {saving ? "Salvando..." : "Salvar Cadastro"}
          </button>
        </div>
      </div>
    </form>
  );
}