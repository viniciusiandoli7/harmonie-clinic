"use client";

import { useState, useMemo } from "react";
import { X, Check } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  patient: any;
}

// LISTA DE TRATAMENTOS CONFORME SUA IMAGEM
const TREATMENTS = [
  "ULTRASSOM MICRO E MACROFOCADO",
  "TOXINA BOTULÍNICA",
  "SKINBOOSTER",
  "PREENCHIMENTO",
  "PEIM",
  "PEELING",
  "PDRN",
  "MICROAGULHAMENTO",
  "MESOTERAPIA",
  "LIMPEZA DE PELE PROFUNDA",
  "LAVIEEN",
  "JATO DE PLASMA",
  "FIOS DE PDO BIOESTIMULADOR"
];

export default function CreateSaleModal({ open, onClose, patient }: Props) {
  const [loading, setLoading] = useState(false);

  // Estados do Formulário
  const [selectedTreatment, setSelectedTreatment] = useState("");
  const [professional, setProfessional] = useState("Mariana");
  const [price, setPrice] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [cost, setCost] = useState(0);
  const [method, setMethod] = useState("PIX");

  // LÓGICA DE CÁLCULO (Estilo Financeiro Harmonie)
  const finalValue = Math.max(0, price - discount);
  const professionalCommission = finalValue * 0.3; // Exemplo de 30% de repasse
  const realProfit = finalValue - professionalCommission - cost;
  const margin = finalValue > 0 ? (realProfit / finalValue) * 100 : 0;

  const handleSave = async () => {
    if (!selectedTreatment) return alert("Selecione um tratamento.");
    setLoading(true);
    
    // Simulação de salvamento
    setTimeout(() => {
      setLoading(false);
      alert("Venda registrada e Contrato gerado!");
      onClose();
    }, 800);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#FAF8F3]/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-5xl bg-white shadow-[0_50px_100px_rgba(0,0,0,0.15)] rounded-sm overflow-hidden flex flex-col md:flex-row h-[85vh] border border-[#EEE]">
        
        {/* COLUNA ESQUERDA: FORMULÁRIO (BRANCO) */}
        <div className="flex-1 p-10 overflow-y-auto">
          <div className="flex justify-between items-start mb-10">
            <div>
              <h2 className="text-3xl font-serif text-[#111]">Fechar Venda</h2>
              <p className="text-[10px] font-bold text-[#C8A35F] uppercase tracking-[0.2em] mt-2">
                PACIENTE: <span className="text-[#111]">{patient?.name || "Maria Silva"}</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-10">
            {/* SEÇÃO: ATENDIMENTO */}
            <div className="space-y-6">
              <SectionHeader title="Atendimento" />
              <div className="space-y-4">
                <div>
                  <label className="text-[9px] font-bold text-[#96A4C1] uppercase tracking-widest block mb-2">Serviço/Tratamento</label>
                  <select 
                    value={selectedTreatment}
                    onChange={(e) => setSelectedTreatment(e.target.value)}
                    className="w-full border-b border-[#EEE] py-2 text-[12px] outline-none focus:border-[#C8A35F] bg-transparent font-medium"
                  >
                    <option value="">Selecione...</option>
                    {TREATMENTS.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-[#96A4C1] uppercase tracking-widest block mb-2">Profissional</label>
                  <select 
                    className="w-full border-b border-[#EEE] py-2 text-[12px] outline-none focus:border-[#C8A35F] bg-transparent font-medium"
                    value={professional}
                    onChange={(e) => setProfessional(e.target.value)}
                  >
                    <option value="Mariana">Mariana</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SEÇÃO: VALORES */}
            <div className="space-y-6">
              <SectionHeader title="Valores" />
              <div className="grid grid-cols-2 gap-4">
                <InputGroup label="Preço Unit. R$" value={price} onChange={setPrice} type="number" />
                <InputGroup label="Desconto R$" value={discount} onChange={setDiscount} type="number" />
              </div>
              <InputGroup label="Custo Operacional (Produtos/Material) R$" value={cost} onChange={setCost} type="number" />
            </div>

            {/* SEÇÃO: PAGAMENTO */}
            <div className="space-y-6">
              <SectionHeader title="Pagamento" />
              <div className="space-y-4">
                <div>
                  <label className="text-[9px] font-bold text-[#96A4C1] uppercase tracking-widest block mb-2">Método</label>
                  <select 
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    className="w-full border-b border-[#EEE] py-2 text-[12px] outline-none focus:border-[#C8A35F] bg-transparent font-medium"
                  >
                    <option value="PIX">PIX</option>
                    <option value="CREDITO">CARTÃO DE CRÉDITO</option>
                    <option value="DEBITO">CARTÃO DE DÉBITO</option>
                    <option value="DINHEIRO">DINHEIRO</option>
                  </select>
                </div>
                <div className="bg-[#FAF8F3] p-4 border border-dashed border-[#E9DEC9] rounded-sm">
                   <p className="text-[10px] italic text-[#C8A35F] leading-relaxed">
                     * Ao confirmar, o sistema gera automaticamente o Contrato de Prestação de Serviços e a Evolução Inicial.
                   </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA: RESUMO (PRETO) */}
        <div className="w-full md:w-[380px] bg-[#0A0A0A] p-10 flex flex-col justify-between text-white">
          <div className="space-y-12">
            <div className="text-right">
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em] mb-2">Venda Final</p>
              <h4 className="text-4xl font-serif">R$ {finalValue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</h4>
            </div>

            <div className="space-y-6 border-t border-white/10 pt-8">
              <SummaryRow label="Repasse Profissional" value={`-R$ ${professionalCommission.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`} color="text-white/50" />
              <SummaryRow label="Custos Operacionais" value={`-R$ ${cost.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`} color="text-white/50" />
            </div>

            <div className="pt-8">
              <p className="text-[10px] font-bold text-[#C8A35F] uppercase tracking-[0.3em] mb-2">Lucro Real Clínica</p>
              <h4 className="text-4xl font-serif text-[#C8A35F]">R$ {realProfit.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</h4>
              
              <div className={`mt-6 py-2 px-4 rounded-full text-center text-[9px] font-bold uppercase tracking-widest ${margin > 40 ? 'bg-[#4A9B68]/20 text-[#4A9B68]' : 'bg-red-900/20 text-red-400'}`}>
                MARGEM DE LUCRO: {margin.toFixed(0)}%
              </div>
            </div>
          </div>

          <div className="space-y-3 mt-10">
            <button 
              onClick={handleSave}
              disabled={loading}
              className="w-full bg-[#C8A35F] hover:bg-white hover:text-[#111] text-white py-4 text-[10px] font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2"
            >
              {loading ? "PROCESSANDO..." : "CONFIRMAR E GERAR CONTRATO"}
            </button>
            <button onClick={onClose} className="w-full text-white/30 hover:text-white py-2 text-[9px] font-bold uppercase tracking-widest transition-all">
              CANCELAR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// SUB-COMPONENTES
function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-[1px] w-4 bg-[#C8A35F]" />
      <h3 className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#111]">{title}</h3>
    </div>
  );
}

function InputGroup({ label, value, onChange, type = "text" }: any) {
  return (
    <div>
      <label className="text-[9px] font-bold text-[#96A4C1] uppercase tracking-widest block mb-2">{label}</label>
      <input 
        type={type} 
        value={value === 0 ? "" : value} 
        onChange={(e) => onChange(Number(e.target.value))}
        placeholder="0"
        className="w-full border-b border-[#EEE] py-2 text-[14px] outline-none focus:border-[#C8A35F] bg-transparent font-medium"
      />
    </div>
  );
}

function SummaryRow({ label, value, color }: any) {
  return (
    <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-bold">
      <span className="text-white/30">{label}</span>
      <span className={color}>{value}</span>
    </div>
  );
}