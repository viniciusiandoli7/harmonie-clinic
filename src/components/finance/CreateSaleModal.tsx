"use client";

import { useState, useEffect } from "react";
import { X, ShoppingCart, CheckCircle, Plus, Trash2, FileText, PenTool } from "lucide-react";
import { useRouter } from "next/navigation";
import { buildContractHtml } from "@/lib/contracts";
// @ts-ignore
import html2pdf from "html2pdf.js";

// IMPORTANDO NOSSO NOVO COMPONENTE MÁGICO
import SignaturePad from "@/components/ui/SignaturePad";

interface Props { open: boolean; onClose: () => void; patient: any; }

const TREATMENTS = [
  "ULTRASSOM MICRO E MACROFOCADO", "TOXINA BOTULÍNICA", "SKINBOOSTER", "PREENCHIMENTO",
  "PEIM", "PEELING", "PDRN", "MICROAGULHAMENTO", "MESOTERAPIA", "LIMPEZA DE PELE PROFUNDA",
  "LAVIEEN", "JATO DE PLASMA", "FIOS DE PDO BIOESTIMULADOR"
];

const PROFESSIONALS = ["Dra. Mariana Carmona"];

export default function CreateSaleModal({ open, onClose, patient }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [cart, setCart] = useState<any[]>([]);
  const [treatment, setTreatment] = useState("");
  const [professional, setProfessional] = useState(PROFESSIONALS[0]);
  const [price, setPrice] = useState<number | "">("");
  const [qty, setQty] = useState<number>(1);
  const [observation, setObservation] = useState("");

  const [discount, setDiscount] = useState<number | "">(0);
  
  const [paymentsList, setPaymentsList] = useState<Array<{method: string, amount: number, installments: number}>>([]);
  const [currentMethod, setCurrentMethod] = useState("PIX");
  const [currentAmount, setCurrentAmount] = useState<number | "">("");
  const [currentInstallments, setCurrentInstallments] = useState(1);

  // --- ESTADOS DA ASSINATURA DIGITAL ---
  const [isSigning, setIsSigning] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const numDiscount = Number(discount) || 0;
  const finalTotal = Math.max(0, subtotal - numDiscount);
  
  const totalPaid = paymentsList.reduce((acc, p) => acc + p.amount, 0);
  const remaining = Math.max(0, finalTotal - totalPaid);

  useEffect(() => {
    setCurrentAmount(remaining > 0 ? remaining : "");
  }, [remaining]);

  const handleAddItem = () => {
    if (!treatment || !price) return alert("Selecione o procedimento e insira o preço.");
    setCart([...cart, { description: treatment, professional, price: Number(price), quantity: qty, observation }]);
    setTreatment(""); setPrice(""); setQty(1); setObservation("");
  };

  const handleRemoveItem = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const handleAddPayment = () => {
    const amt = Number(currentAmount);
    if (!amt || amt <= 0) return alert("Insira um valor válido.");
    if (amt > remaining) return alert(`O valor não pode ser maior que o restante (R$ ${remaining.toFixed(2)}).`);

    setPaymentsList([...paymentsList, { method: currentMethod, amount: amt, installments: currentInstallments }]);
    setCurrentMethod("PIX");
    setCurrentInstallments(1);
  };

  const handleRemovePayment = (index: number) => {
    setPaymentsList(paymentsList.filter((_, i) => i !== index));
  };

  const handleSaveAndGenerateContract = async () => {
    if (cart.length === 0) return alert("Adicione pelo menos um item ao carrinho.");
    if (remaining > 0 && finalTotal > 0) return alert("Finalize o pagamento antes de fechar a venda.");
    if (!signatureData) return alert("A assinatura do paciente é obrigatória para fechar o contrato.");

    setLoading(true);
    try {
      const response = await fetch("/api/sales/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: patient.id,
          patientName: patient.name,
          items: cart,
          subtotal: subtotal,
          discount: numDiscount,
          total: finalTotal,
          payments: paymentsList,
          signatureImage: signatureData 
        }),
      });

      if (!response.ok) throw new Error("Erro ao salvar a venda no banco.");

      const contractItems = cart.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.price,
        total: item.price * item.quantity,
        observation: item.observation
      }));

      const paymentMethodLabel = paymentsList.length > 0 
        ? paymentsList.map(p => `${p.method.replace('_', ' ')} (R$ ${p.amount.toFixed(2)})`).join(" | ")
        : "100% Desconto";

      // 👈 O "as any" mágico entra aqui para o TS ignorar regras estritas do objeto
      const htmlContent = buildContractHtml({
        patient: { name: patient.name, cpf: patient.cpf, rg: patient.rg, phone: patient.phone, birthDate: patient.birthDate },
        clinic: { companyName: "Harmonie Clinic", cnpj: "57.007.483/0001-73", address: "Avenida Coronel Sezefredo Fagundes, Nº 2168 - Jardim Leonor", email: "contato@harmonie.com" },
        items: contractItems,
        subtotal: subtotal,
        discount: numDiscount,
        total: finalTotal,
        paymentMethodLabel: paymentMethodLabel,
        signatureImage: signatureData 
      } as any); 

      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = htmlContent;
      
      const pdfOptions: any = {
        margin: 15,
        filename: `Contrato_${patient.name.replace(/\s/g, "_")}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
      };

      await html2pdf().set(pdfOptions).from(tempDiv).save();

      alert("Venda Concluída, Assinatura Salva e Contrato Gerado!");
      onClose();
      router.refresh();
      
    } catch (err) {
      console.error(err);
      alert("Erro ao finalizar a venda.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="w-full max-w-6xl bg-white shadow-2xl rounded-xl flex flex-col h-[90vh] overflow-hidden font-sans">
          
          <div className="bg-[#111] px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <ShoppingCart size={20} className="text-[#C8A35F]" />
              <h2 className="text-lg font-bold uppercase tracking-widest" style={{ color: "#ffffff" }}>
                Caixa / Ponto de Venda
              </h2>
            </div>
            <button onClick={onClose} className="transition-colors" style={{ color: "#ffffff" }}>
              <X size={24} />
            </button>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* LADO ESQUERDO: CARRINHO */}
            <div className="w-2/3 p-6 flex flex-col bg-[#FAFAFA] border-r border-gray-200 overflow-y-auto">
              <div className="mb-4">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cliente Selecionado:</span>
                <h3 className="text-xl font-bold text-gray-800">{patient?.name}</h3>
              </div>

              <div className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm mb-6">
                <h4 className="text-[11px] font-bold uppercase tracking-widest text-[#C8A35F] mb-4">Adicionar Serviço</h4>
                <div className="grid grid-cols-12 gap-3 mb-3">
                  <div className="col-span-5">
                    <label className="text-[10px] text-gray-500 uppercase">Tratamento</label>
                    <select value={treatment} onChange={(e) => setTreatment(e.target.value)} className="w-full border-b border-gray-300 py-1 text-sm outline-none focus:border-[#C8A35F]">
                      <option value="">Selecione...</option>
                      {TREATMENTS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="col-span-4">
                    <label className="text-[10px] text-gray-500 uppercase">Profissional</label>
                    <select value={professional} onChange={(e) => setProfessional(e.target.value)} className="w-full border-b border-gray-300 py-1 text-sm outline-none focus:border-[#C8A35F]">
                      {PROFESSIONALS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] text-gray-500 uppercase">Preço R$</label>
                    <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} className="w-full border-b border-gray-300 py-1 text-sm outline-none focus:border-[#C8A35F]" placeholder="0.00" />
                  </div>
                  <div className="col-span-1">
                    <label className="text-[10px] text-gray-500 uppercase">Qtd</label>
                    <input type="number" min="1" value={qty} onChange={(e) => setQty(Number(e.target.value))} className="w-full border-b border-gray-300 py-1 text-sm outline-none text-center" />
                  </div>
                </div>
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <label className="text-[10px] text-gray-500 uppercase">Observação da Região (ex: Glabela, Flancos)</label>
                    <input type="text" value={observation} onChange={(e) => setObservation(e.target.value)} className="w-full border-b border-gray-300 py-1 text-sm outline-none focus:border-[#C8A35F]" />
                  </div>
                  <button onClick={handleAddItem} className="bg-[#C8A35F] text-white px-4 py-2 text-[11px] font-bold uppercase rounded flex items-center gap-1 hover:bg-yellow-600 transition-colors">
                    <Plus size={14} /> Incluir
                  </button>
                </div>
              </div>

              <h4 className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">Itens da Venda</h4>
              <div className="flex-1 bg-white border border-gray-200 rounded-lg overflow-y-auto">
                {cart.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-400 text-sm">Nenhum serviço adicionado.</div>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200 text-[10px] uppercase text-gray-500">
                      <tr>
                        <th className="p-3">Serviço</th>
                        <th className="p-3">Profissional</th>
                        <th className="p-3 text-center">Qtd</th>
                        <th className="p-3 text-right">Total</th>
                        <th className="p-3 text-center">Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cart.map((item, index) => (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="p-3 font-medium text-gray-800">
                            {item.description}<br/><span className="text-[10px] text-gray-400 font-normal">{item.observation}</span>
                          </td>
                          <td className="p-3 text-gray-600">{item.professional}</td>
                          <td className="p-3 text-center">{item.quantity}</td>
                          <td className="p-3 text-right font-semibold">R$ {(item.price * item.quantity).toFixed(2)}</td>
                          <td className="p-3 text-center">
                            <button onClick={() => handleRemoveItem(index)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* LADO DIREITO: PAGAMENTO DIVIDIDO E FECHAMENTO */}
            <div className="w-1/3 bg-white p-6 flex flex-col justify-between border-l border-gray-200 overflow-y-auto">
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-widest text-[#C8A35F] mb-6 border-b pb-2">Fechamento</h4>
                
                <div className="flex justify-between items-center mb-3 text-gray-500 text-sm">
                  <span>Subtotal:</span><span>R$ {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center mb-6 text-gray-500 text-sm">
                  <span>Desconto (R$):</span>
                  <input type="number" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} className="w-24 text-right border-b border-gray-300 outline-none focus:border-[#C8A35F]" placeholder="0.00" />
                </div>
                
                <div className="bg-[#FCFAF6] p-4 border border-[#E9DEC9] rounded-lg text-center mb-6">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total a Pagar</span>
                  <h2 className="text-4xl font-bold text-[#111] mt-1"><small className="text-lg">R$</small> {finalTotal.toFixed(2)}</h2>
                </div>

                {finalTotal > 0 && (
                  <div className="mb-6 flex flex-col gap-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 border-b pb-1">Pagamentos</h4>
                    
                    {paymentsList.map((p, i) => (
                      <div key={i} className="flex justify-between items-center text-sm border border-gray-200 p-2 rounded bg-gray-50">
                        <span className="text-gray-600 font-medium text-[11px] uppercase tracking-wider">{p.method.replace('_', ' ')} {p.installments > 1 ? `(${p.installments}x)` : ''}</span>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-gray-800">R$ {p.amount.toFixed(2)}</span>
                          <button onClick={() => handleRemovePayment(i)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    ))}

                    {remaining > 0 ? (
                      <div className="flex justify-between items-center text-sm text-red-500 font-bold p-2 bg-red-50 rounded border border-red-100">
                        <span>Falta Pagar:</span>
                        <span>R$ {remaining.toFixed(2)}</span>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center text-sm text-emerald-600 font-bold p-2 bg-emerald-50 rounded border border-emerald-100">
                        <span>Status:</span>
                        <span>PAGO INTEGRALMENTE</span>
                      </div>
                    )}
                  </div>
                )}

                {remaining > 0 && (
                  <div className="border border-gray-200 p-4 rounded-lg mb-4 bg-gray-50 shadow-inner">
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Método</label>
                        <select value={currentMethod} onChange={(e) => setCurrentMethod(e.target.value)} className="w-full border border-gray-300 rounded p-1.5 text-xs outline-none focus:border-[#C8A35F]">
                          <option value="PIX">PIX</option>
                          <option value="CREDIT_CARD">Crédito</option>
                          <option value="DEBIT_CARD">Débito</option>
                          <option value="CASH">Dinheiro</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Valor (R$)</label>
                        <input type="number" value={currentAmount} onChange={(e) => setCurrentAmount(Number(e.target.value))} className="w-full border border-gray-300 rounded p-1.5 text-xs outline-none focus:border-[#C8A35F]" />
                      </div>
                    </div>
                    <button onClick={handleAddPayment} className="w-full bg-white border border-gray-300 hover:border-[#C8A35F] hover:text-[#C8A35F] text-gray-700 py-2 rounded text-[10px] font-bold uppercase transition-all flex justify-center items-center gap-1">
                      <Plus size={12}/> Adicionar Pagamento
                    </button>
                  </div>
                )}

              </div>
              
              <div className="pt-4 space-y-4">
                {/* --- ÁREA DE ASSINATURA --- */}
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 border-b pb-1 mb-3">Assinatura do Paciente</h4>
                  {signatureData ? (
                    <div className="border border-[#C8A35F] rounded p-2 bg-[#FCFAF6] flex flex-col items-center gap-2">
                      <img src={signatureData} alt="Assinatura" className="h-16 object-contain" />
                      <button onClick={() => setSignatureData(null)} className="text-[9px] text-red-500 font-bold uppercase tracking-widest hover:underline">
                        Remover Assinatura
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setIsSigning(true)} 
                      className="w-full py-3 border-2 border-dashed border-gray-300 rounded text-[10px] font-bold text-gray-500 uppercase tracking-widest hover:border-[#C8A35F] hover:text-[#C8A35F] transition-colors flex items-center justify-center gap-2"
                    >
                       <PenTool size={14} /> Coletar Assinatura Digital
                    </button>
                  )}
                </div>

                {/* --- BOTÃO DE FECHAR VENDA --- */}
                <button 
                  onClick={handleSaveAndGenerateContract} 
                  disabled={loading || cart.length === 0 || remaining > 0 || !signatureData} 
                  className="w-full bg-[#111] hover:bg-[#C8A35F] text-white py-4 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Processando..." : <><FileText size={16} /> Fechar Venda e Contrato</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RENDERIZA O MODAL DE ASSINATURA SE ESTIVER ATIVO */}
      {isSigning && (
        <SignaturePad 
          title={`Assinatura: ${patient.name}`}
          onCancel={() => setIsSigning(false)}
          onSave={(base64) => {
            setSignatureData(base64);
            setIsSigning(false);
          }}
        />
      )}
    </>
  );
}