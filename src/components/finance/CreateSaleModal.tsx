"use client";

import { useState, useEffect } from "react";
import { X, ShoppingCart, Plus, Trash2, Smartphone } from "lucide-react";
import { useRouter } from "next/navigation";
import { buildContractHtml } from "@/lib/contracts";
import { generateContractPdf } from "@/lib/contractPdf";

interface Props { open: boolean; onClose: () => void; patient: any; }

const TREATMENTS = [
  "ULTRASSOM MICRO E MACROFOCADO", "TOXINA BOTULÍNICA", "SKINBOOSTER", "PREENCHIMENTO",
  "PEIM", "PEELING", "PDRN", "MICROAGULHAMENTO", "MESOTERAPIA", "LIMPEZA DE PELE PROFUNDA",
  "LAVIEEN", "JATO DE PLASMA", "FIOS DE PDO", "BIOESTIMULADOR", "INTRADERMOTERAPIA LOCAL", "INTRADERMOTERAPIA IM"
];
const PROFESSIONALS = ["Dra. Mariana Carmona"];

export default function CreateSaleModal({ open, onClose, patient }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [cart, setCart] = useState<any[]>([]);
  const [treatment, setTreatment] = useState("");
  const [professional, setProfessional] = useState(PROFESSIONALS[0]);
  const [price, setPrice] = useState<number | "">("");
  const [qty, setQty] = useState<number | "">(1);
  const [observation, setObservation] = useState("");

  const [discount, setDiscount] = useState<number | "">("");
  
  const [paymentsList, setPaymentsList] = useState<Array<{method: string, amount: number, installments: number}>>([]);
  const [currentMethod, setCurrentMethod] = useState("PIX");
  const [currentAmount, setCurrentAmount] = useState<number | "">("");

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const numDiscount = Number(discount) || 0;
  const finalTotal = Math.max(0, subtotal - numDiscount);
  
  const totalPaid = paymentsList.reduce((acc, p) => acc + p.amount, 0);
  const remaining = Math.max(0, finalTotal - totalPaid);

  // Variável de controle para o botão "Ficar Verde"
  const canFinalize = cart.length > 0 && remaining <= 0.01 && finalTotal > 0;

  useEffect(() => { setCurrentAmount(remaining > 0 ? remaining : ""); }, [remaining]);

  const handleAddItem = () => {
    if (!treatment || !price) return alert("Selecione o procedimento e insira o preço.");
    setCart([...cart, { 
      description: treatment, 
      professional, 
      price: Number(price), 
      quantity: Number(qty) || 1, 
      observation 
    }]);
    setTreatment(""); setPrice(""); setQty(1); setObservation("");
  };

  const handleRemoveItem = (index: number) => setCart(cart.filter((_, i) => i !== index));

  const handleAddPayment = () => {
    const amt = Number(currentAmount);
    if (!amt || amt <= 0) return alert("Insira um valor válido.");
    if (amt > (remaining + 0.01)) return alert(`O valor não pode ser maior que o restante (R$ ${remaining.toFixed(2)}).`);

    setPaymentsList([...paymentsList, { method: currentMethod, amount: amt, installments: 1 }]);
    setCurrentMethod("PIX");
  };

  const handleRemovePayment = (index: number) => setPaymentsList(paymentsList.filter((_, i) => i !== index));

  const handleSaveAndGenerateContract = async () => {
    if (!canFinalize) return;

    setLoading(true);
    try {
      const contractToken = `CTR-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;

      const response = await fetch("/api/sales/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: patient.id,
          patientName: patient.name,
          items: cart,
          subtotal,
          discount: numDiscount,
          total: finalTotal,
          payments: paymentsList,
          contractToken,
        }),
      });

      const responseData = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(responseData?.error || "Erro ao salvar a venda.");
      }

      const contractItems = cart.map(item => ({
        description: item.description, 
        quantity: item.quantity,
        unitPrice: item.price, 
        total: item.price * item.quantity, 
        observation: item.observation
      }));

      const paymentLabels: Record<string, string> = {
        CREDIT_CARD: "Cartão de crédito",
        DEBIT_CARD: "Cartão de débito",
        PIX: "Pix",
        CASH: "Dinheiro",
        BANK_SLIP: "Boleto",
        BANK_TRANSFER: "Transferência",
      };
      const paymentMethodLabel = paymentsList.length > 0 
        ? paymentsList.map(p => `${paymentLabels[p.method] || p.method.replace("_", " ")} (R$ ${p.amount.toFixed(2)})`).join(" | ") 
        : "Bonificação";

      const htmlContent = buildContractHtml({
        patient: { name: patient.name, cpf: patient.cpf, rg: patient.rg, phone: patient.phone, birthDate: patient.birthDate },
        clinic: { companyName: "Mariana Thomaz Carmona", cnpj: "57.007.483/0001-73", address: "Avenida Coronel Sezefredo Fagundes, Nº 2168", email: "contato@marianathomazcarmona.com" },
        items: contractItems, subtotal, discount: numDiscount, total: finalTotal,
        paymentMethodLabel, signatureImage: null 
      } as any); 

      await generateContractPdf({
        filename: `Contrato_${patient.name.replace(/\s/g, "_")}.pdf`,
        title: "Contrato de Prestação de Serviços Estéticos",
        patient: { name: patient.name, cpf: patient.cpf, rg: patient.rg, phone: patient.phone, birthDate: patient.birthDate },
        clinic: { companyName: "Mariana Thomaz Carmona", cnpj: "57.007.483/0001-73", address: "Avenida Coronel Sezefredo Fagundes, Nº 2168", email: "contato@marianathomazcarmona.com" },
        items: contractItems,
        subtotal,
        discount: numDiscount,
        total: finalTotal,
        paymentMethodLabel,
        paymentDetails: "Pagamento registrado na data de fechamento da venda.",
        contentHtml: htmlContent,
        contractDate: new Date(),
      });

      const link = `${window.location.origin}/assinar-contrato/${contractToken}`;
      const phone = patient.phone ? patient.phone.replace(/\D/g, '') : '';
      
      // 🛡️ REFINAMENTO: Mensagem de WhatsApp atualizada e dinâmica
      const message = `Olá, ${patient.name.split(' ')[0]}! 🌟\n\nSeu procedimento com a *Dra. Mariana Carmona* foi registrado com sucesso.\n\nPor favor, utilize o link abaixo para assinar o seu contrato digital de forma segura:\n\n${link}`;
      
      if (phone) {
        window.open(`https://api.whatsapp.com/send?phone=55${phone}&text=${encodeURIComponent(message)}`, '_blank');
      } else {
        alert("Contrato gerado. O paciente não possui telefone cadastrado.");
      }

      onClose();
      router.refresh();
      
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Ocorreu um erro ao finalizar a venda.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-sans">
      <div className="w-full max-w-6xl bg-white shadow-2xl rounded-sm flex flex-col h-[90vh] overflow-hidden">
        
        <div className="bg-[#1E1A18] px-8 py-6 flex justify-between items-center border-b border-[#5A1F2B]/30">
          <div className="flex items-center gap-4">
            <ShoppingCart size={24} style={{ color: '#5A1F2B' }} />
            <h2 
              className="text-xl font-serif font-bold uppercase tracking-[0.25em]"
              style={{ color: '#FFFFFF', margin: 0 }} 
            >
              Caixa / Ponto de Venda
            </h2>
          </div>
          <button onClick={onClose} style={{ color: '#FFFFFF' }} className="hover:text-[#5A1F2B] transition-all">
            <X size={32} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-2/3 p-8 flex flex-col bg-[#FAFAFA] border-r border-gray-200 overflow-y-auto">
            <div className="mb-6">
              <span className="text-[10px] font-black text-[#96A4C1] uppercase tracking-widest">Paciente Selecionado</span>
              <h3 className="text-2xl font-serif text-[#1E1A18] mt-1">{patient?.name}</h3>
            </div>

            <div className="bg-white border border-gray-200 p-6 rounded-sm shadow-sm mb-8">
              <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#5A1F2B] mb-6">Adicionar Serviço</h4>
              <div className="grid grid-cols-12 gap-4 mb-4">
                <div className="col-span-5">
                  <label className="text-[9px] font-bold text-gray-400 uppercase mb-1 block">Tratamento</label>
                  <select value={treatment} onChange={(e) => setTreatment(e.target.value)} className="w-full border-b border-gray-300 py-2 text-sm outline-none focus:border-[#5A1F2B] bg-transparent text-[#1E1A18]">
                    <option value="">Selecione o procedimento...</option>
                    {TREATMENTS.map(t => <option key={t} value={t} className="text-[#1E1A18]">{t}</option>)}
                  </select>
                </div>
                <div className="col-span-4">
                  <label className="text-[9px] font-bold text-gray-400 uppercase mb-1 block">Profissional</label>
                  <select value={professional} onChange={(e) => setProfessional(e.target.value)} className="w-full border-b border-gray-300 py-2 text-sm outline-none focus:border-[#5A1F2B] bg-transparent text-[#1E1A18]">
                    {PROFESSIONALS.map(p => <option key={p} value={p} className="text-[#1E1A18]">{p}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-[9px] font-bold text-gray-400 uppercase mb-1 block">Preço (R$)</label>
                  <input type="number" value={price} onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))} className="w-full border-b border-gray-300 py-2 text-sm outline-none focus:border-[#5A1F2B] placeholder:text-gray-400 text-[#1E1A18] font-sans font-semibold tabular-nums" placeholder="0,00" />
                </div>
                <div className="col-span-1">
                  <label className="text-[9px] font-bold text-gray-400 uppercase mb-1 block">Qtd</label>
                  <input type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value === "" ? "" : Number(e.target.value))} className="w-full border-b border-gray-300 py-2 text-sm outline-none text-center text-[#1E1A18] font-sans font-semibold tabular-nums" />
                </div>
              </div>
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="text-[9px] font-bold text-gray-400 uppercase mb-1 block">Observação (ex: Glabela, 40 unidades)</label>
                  <input type="text" value={observation} onChange={(e) => setObservation(e.target.value)} className="w-full border-b border-gray-300 py-2 text-sm outline-none focus:border-[#5A1F2B] placeholder:text-gray-400 text-[#1E1A18]" placeholder="Detalhes opcionais..." />
                </div>
                <button onClick={handleAddItem} className="bg-[#5A1F2B] text-white px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-sm flex items-center gap-2 hover:bg-[#b08d4f] transition-all shadow-md">
                  <Plus size={14} /> Incluir
                </button>
              </div>
            </div>

            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#96A4C1] mb-4">Itens da Venda</h4>
            <div className="flex-1 bg-white border border-gray-100 rounded-sm overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#FAF8F3] border-b border-gray-100 text-[9px] font-black uppercase text-gray-700 tracking-widest">
                  <tr>
                    <th className="p-4">Serviço / Detalhes</th>
                    <th className="p-4 text-center">Qtd</th>
                    <th className="p-4 text-right">Total</th>
                    <th className="p-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {cart.length === 0 ? (
                    <tr><td colSpan={4} className="p-12 text-center text-gray-400 italic">Carrinho vazio.</td></tr>
                  ) : (
                    cart.map((item, index) => (
                      <tr key={index} className="hover:bg-[#FCFAF6] transition-colors">
                        <td className="p-4">
                          <p className="font-bold text-[#1E1A18]">{item.description}</p>
                          <p className="text-[10px] text-[#5A1F2B] font-bold uppercase tracking-tighter">{item.observation}</p>
                        </td>
                        <td className="p-4 text-center text-[#1E1A18] font-sans tabular-nums">{item.quantity}</td>
                        <td className="p-4 text-right font-sans font-semibold text-[#1E1A18] tabular-nums">R$ {(item.price * item.quantity).toFixed(2)}</td>
                        <td className="p-4 text-center">
                          <button onClick={() => handleRemoveItem(index)} className="text-red-300 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="w-1/3 bg-white p-8 flex flex-col justify-between border-l border-gray-100 overflow-y-auto">
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#5A1F2B] mb-8 border-b border-gray-100 pb-3">Resumo</h4>
              <div className="flex justify-between items-center mb-4 text-gray-500 text-sm">
                <span>Subtotal:</span>
                <span className="font-sans font-semibold text-[#1E1A18] tabular-nums">R$ {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center mb-8 text-gray-500 text-sm">
                <span>Desconto (R$):</span>
                <input type="number" value={discount} onChange={(e) => setDiscount(e.target.value === "" ? "" : Number(e.target.value))} className="w-24 text-right border-b border-gray-300 outline-none focus:border-[#5A1F2B] font-sans font-semibold tabular-nums text-[#1E1A18]" placeholder="0,00" />
              </div>
              
              <div className="bg-[#FAF8F3] p-6 border border-[#E9DEC9] rounded-sm text-center mb-8">
                <span className="text-[9px] font-bold text-[#96A4C1] uppercase tracking-[0.2em]">Total Final</span>
                <h2 className="text-4xl font-sans font-bold text-[#1E1A18] mt-2 tabular-nums">R$ {finalTotal.toFixed(2)}</h2>
              </div>

              <div className="mb-8 space-y-3">
                <h4 className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Pagamentos</h4>
                {paymentsList.map((p, i) => (
                  <div key={i} className="flex justify-between items-center text-xs border border-gray-100 p-3 rounded-sm bg-gray-50">
                    <span className="font-bold text-[#1E1A18] uppercase tracking-tighter">{p.method.replace('_', ' ')}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-sans font-semibold text-[#1E1A18] tabular-nums">R$ {p.amount.toFixed(2)}</span>
                      <button onClick={() => handleRemovePayment(i)} className="text-red-300 hover:text-red-500"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
                
                {remaining > 0.01 && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-sm flex justify-between items-center text-[11px] font-bold text-red-600 uppercase">
                    <span>Faltando:</span>
                    <span className="font-sans font-bold tabular-nums">R$ {remaining.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {remaining > 0.01 && (
                <div className="border border-gray-200 p-5 rounded-sm bg-gray-50 mb-6 shadow-inner">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="text-[8px] font-bold text-gray-400 uppercase block mb-1">Método</label>
                      <select value={currentMethod} onChange={(e) => setCurrentMethod(e.target.value)} className="w-full border border-gray-300 rounded-sm p-2 text-xs outline-none focus:border-[#5A1F2B] text-[#1E1A18]">
                        <option value="PIX">PIX</option>
                        <option value="CARTAO_CREDITO">Cartão de Crédito</option>
                        <option value="CARTAO_DEBITO">Cartão de Débito</option>
                        <option value="DINHEIRO">Dinheiro</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[8px] font-bold text-gray-400 uppercase block mb-1">Valor</label>
                      <input type="number" value={currentAmount} onChange={(e) => setCurrentAmount(e.target.value === "" ? "" : Number(e.target.value))} className="w-full border border-gray-300 rounded-sm p-2 text-xs outline-none focus:border-[#5A1F2B] font-sans font-semibold tabular-nums text-[#1E1A18]" placeholder="0,00" />
                    </div>
                  </div>
                  <button onClick={handleAddPayment} className="w-full bg-white border border-gray-300 text-gray-600 py-2 text-[9px] font-bold uppercase tracking-widest hover:border-[#5A1F2B] hover:text-[#5A1F2B] transition-all">
                    Confirmar Parcela
                  </button>
                </div>
              )}
            </div>
            
            <div className="pt-6">
              <button 
                onClick={handleSaveAndGenerateContract} 
                disabled={loading || !canFinalize} 
                className={`w-full py-5 rounded-sm text-[11px] font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-lg active:scale-95 ${
                  canFinalize 
                    ? "bg-[#25D366] hover:bg-[#1EBE5A] text-white" 
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                {loading ? "Processando..." : <><Smartphone size={20} /> Salvar Venda e Enviar Contrato</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}