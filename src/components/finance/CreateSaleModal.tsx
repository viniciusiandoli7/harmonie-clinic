"use client";

import { useState } from "react";
import { X, TrendingUp, UserCheck, ShieldCheck, FileCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { buildContractHtml } from "@/lib/contracts"; 
import { exportElementToPDF } from "@/lib/exportEvolutionPdf";

interface Props {
  open: boolean;
  onClose: () => void;
  patient: any;
}

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
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Estados do Formulário
  const [selectedTreatment, setSelectedTreatment] = useState("");
  const [price, setPrice] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [cost, setCost] = useState(0);
  const [method, setMethod] = useState("PIX");

  // LÓGICA DE CÁLCULO (REPASSE FIXO EM 25%)
  const finalValue = Math.max(0, price - discount);
  const professionalCommission = finalValue * 0.25; 
  const realProfit = finalValue - professionalCommission - cost;
  const margin = finalValue > 0 ? (realProfit / finalValue) * 100 : 0;

  // FUNÇÃO REAL DE SALVAMENTO E GERAÇÃO DE PDF
  const handleSave = async () => {
    if (!selectedTreatment) return alert("Selecione o procedimento.");
    if (price <= 0) return alert("Insira o valor da venda.");

    setLoading(true);
    try {
      const response = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: patient.id,
          treatmentName: selectedTreatment,
          price: price,
          discount: discount,
          paymentMethod: method,
          professionalId: "mariana_id", // ID padrão da Dra. Mariana
          serviceId: "procedimento_geral"
        }),
      });

      if (response.ok) {
        // --- INÍCIO DA LÓGICA DE GERAÇÃO DE PDF ---
        
        // 1. Gera o HTML usando sua função buildContractHtml
        const htmlContent = buildContractHtml({
          patient: patient,
          clinic: { 
              companyName: "Harmonie Executive", 
              cnpj: "00.000.000/0001-00", 
              address: "Av. Paulista, 1000 - São Paulo/SP", 
              email: "contato@harmonie.com" 
          },
          items: [{ 
            description: selectedTreatment, 
            quantity: 1, 
            unitPrice: price, 
            total: finalValue 
          }],
          subtotal: price,
          discount: discount,
          total: finalValue,
          paymentMethodLabel: method
        });

        // 2. Cria um elemento "fantasma" apenas para o PDF ler
        const tempDiv = document.createElement("div");
        tempDiv.style.position = "absolute";
        tempDiv.style.left = "-9999px"; // Joga pra fora da tela
        tempDiv.style.width = "800px"; 
        tempDiv.style.padding = "20px";
        tempDiv.style.background = "white";
        tempDiv.innerHTML = htmlContent;
        document.body.appendChild(tempDiv);

        // 3. Dispara a exportação usando o seu motor de PDF
        await exportElementToPDF(tempDiv, `Contrato_${patient.name.replace(/\s/g, "_")}`);

        // 4. Limpa o elemento fantasma do DOM
        document.body.removeChild(tempDiv);

        // --- FIM DA LÓGICA DE PDF ---

        alert("Venda confirmada e Contrato Gerado com sucesso!");
        onClose();
        
        router.refresh();
        
        // Se estiver no dashboard ou na ficha, recarregamos para atualizar os números
        if (window.location.pathname.includes('dashboard') || window.location.pathname.includes('patients')) {
            window.location.reload();
        }
      } else {
        const errorData = await response.json();
        alert(`Erro ao salvar: ${errorData.error || 'Erro desconhecido'}`);
      }
    } catch (err) {
      console.error("Erro na conexão:", err);
      alert("Falha na conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-5xl bg-white shadow-2xl rounded-xl overflow-hidden flex flex-col md:flex-row h-[85vh] border border-[#E9DEC9] animate-in zoom-in duration-300">
        
        {/* COLUNA ESQUERDA: FORMULÁRIO */}
        <div className="flex-1 p-10 overflow-y-auto bg-white font-sans">
          <header className="mb-10 flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-serif text-[#111] uppercase tracking-tight">Fechar Venda</h2>
              <p className="text-[10px] font-bold text-[#C8A35F] uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                <UserCheck size={12} /> PACIENTE: <span className="text-[#111]">{patient?.name}</span>
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
              <X size={24} />
            </button>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-8">
              <SectionHeader title="Atendimento" />
              <div className="space-y-6">
                <div>
                  <label className="text-[9px] font-bold text-[#96A4C1] uppercase tracking-widest block mb-2">Serviço/Tratamento</label>
                  <select 
                    value={selectedTreatment}
                    onChange={(e) => setSelectedTreatment(e.target.value)}
                    className="w-full border-b border-[#EEE] py-2 text-[14px] outline-none focus:border-[#C8A35F] bg-transparent font-medium text-[#111]"
                  >
                    <option value="">Selecione o procedimento...</option>
                    {TREATMENTS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-[#96A4C1] uppercase tracking-widest block mb-2">Método de Pagamento</label>
                  <select 
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    className="w-full border-b border-[#EEE] py-2 text-[14px] outline-none focus:border-[#C8A35F] bg-transparent font-medium text-[#111]"
                  >
                    <option value="PIX">PIX (À VISTA)</option>
                    <option value="CREDITO">CARTÃO DE CRÉDITO</option>
                    <option value="DEBITO">CARTÃO DE DÉBITO</option>
                    <option value="DINHEIRO">DINHEIRO (ESPÉCIE)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <SectionHeader title="Valores" />
              <div className="grid grid-cols-2 gap-6">
                <InputGroup label="Preço Unit. R$" value={price} onChange={setPrice} type="number" />
                <InputGroup label="Desconto R$" value={discount} onChange={setDiscount} type="number" />
              </div>
              <InputGroup label="Custos Materiais R$" value={cost} onChange={setCost} type="number" />
              
              <div className="bg-[#FAF8F3] p-5 border border-dashed border-[#E9DEC9] rounded-lg">
                 <p className="text-[10px] italic text-[#C8A35F] leading-relaxed flex gap-2">
                   <ShieldCheck size={14} className="shrink-0" />
                   A confirmação gera o contrato digital e baixa o financeiro automaticamente.
                 </p>
              </div>
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA: RESUMO FINANCEIRO */}
        <div className="w-full md:w-[420px] bg-[#FAF8F3] p-10 flex flex-col justify-between border-l border-[#E9DEC9]">
          <div className="space-y-10 font-sans">
            <div className="text-center pb-8 border-b border-[#E9DEC9]">
              <p className="text-[10px] font-bold text-[#96A4C1] uppercase tracking-[0.3em] mb-3">Venda Líquida</p>
              <h4 className="text-5xl font-serif text-[#111]">
                <small className="text-xl mr-1">R$</small>{finalValue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
              </h4>
            </div>

            <div className="space-y-6 pt-2">
              <SummaryRow label="Repasse Profissional (25%)" value={`- R$ ${professionalCommission.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`} color="text-red-500" />
              <SummaryRow label="Custos Operacionais" value={`- R$ ${cost.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`} color="text-red-500" />
            </div>

            <div className="pt-10 border-t-2 border-dashed border-[#E9DEC9]">
              <p className="text-[10px] font-bold text-[#C8A35F] uppercase tracking-[0.3em] mb-3 flex items-center gap-2">
                <TrendingUp size={14} /> Lucro Real Harmonie
              </p>
              <h4 className="text-5xl font-serif text-[#111]">
                <small className="text-xl mr-1">R$</small>{realProfit.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
              </h4>
              
              <div className={`mt-6 py-2.5 px-4 rounded-lg text-center text-[11px] font-black uppercase tracking-widest shadow-sm ${margin > 45 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                MARGEM: {margin.toFixed(0)}%
              </div>
            </div>
          </div>

          <div className="space-y-4 mt-12">
            <button 
              onClick={handleSave}
              disabled={loading}
              className="w-full bg-[#111] hover:bg-[#C8A35F] text-white py-5 rounded-xl text-[11px] font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-xl active:scale-95 disabled:opacity-50"
            >
              {loading ? "SINCRONIZANDO..." : <><FileCheck size={16}/> CONFIRMAR E GERAR CONTRATO</>}
            </button>
            <button onClick={onClose} className="w-full text-[#96A4C1] hover:text-[#111] py-2 text-[10px] font-bold uppercase tracking-widest transition-all">
              CANCELAR
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

// SUB-COMPONENTES AUXILIARES
function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="h-[1px] w-6 bg-[#C8A35F]" />
      <h3 className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#111] font-sans">{title}</h3>
    </div>
  );
}

function InputGroup({ label, value, onChange, type }: any) {
  return (
    <div className="group font-sans">
      <label className="text-[9px] font-bold text-[#96A4C1] uppercase tracking-widest block mb-2 transition-colors group-focus-within:text-[#C8A35F]">{label}</label>
      <input 
        type={type} 
        value={value === 0 ? "" : value} 
        onChange={(e) => onChange(Number(e.target.value))}
        placeholder="0,00"
        className="w-full border-b border-[#EEE] py-2 text-[16px] outline-none focus:border-[#C8A35F] bg-transparent font-semibold text-[#111] transition-all"
      />
    </div>
  );
}

function SummaryRow({ label, value, color }: any) {
  return (
    <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-bold font-sans">
      <span className="text-[#96A4C1]">{label}</span>
      <span className={color}>{value}</span>
    </div>
  );
}