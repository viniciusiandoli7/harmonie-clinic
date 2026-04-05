"use client";

import { useState } from "react";
import { X, ShoppingCart, CheckCircle, Plus, Trash2, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { buildContractHtml } from "@/lib/contracts";
// @ts-ignore
import html2pdf from "html2pdf.js";

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
  const [method, setMethod] = useState("PIX");
  const [installments, setInstallments] = useState(1);

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const numDiscount = Number(discount) || 0;
  const finalTotal = Math.max(0, subtotal - numDiscount);

  const handleAddItem = () => {
    if (!treatment || !price) return alert("Selecione o procedimento e insira o preço.");
    setCart([...cart, { description: treatment, professional, price: Number(price), quantity: qty, observation }]);
    setTreatment(""); setPrice(""); setQty(1); setObservation("");
  };

  const handleRemoveItem = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const handleSaveAndGenerateContract = async () => {
    if (cart.length === 0) return alert("Adicione pelo menos um item ao carrinho.");

    setLoading(true);
    try {
      // Salva no Banco de Dados
      const response = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: patient.id,
          items: cart,
          subtotal: subtotal,
          discount: numDiscount,
          total: finalTotal,
          paymentMethod: method,
          installments
        }),
      });

      if (!response.ok) throw new Error("Erro ao salvar a venda no banco.");

      // Organizando os itens para a função do contrato
      const contractItems = cart.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.price,
        total: item.price * item.quantity,
        observation: item.observation
      }));

      // Gera o Contrato HTML
      const htmlContent = buildContractHtml({
        patient: { name: patient.name, cpf: patient.cpf, rg: patient.rg, phone: patient.phone, birthDate: patient.birthDate },
        clinic: { companyName: "Harmonie Clinic", cnpj: "57.007.483/0001-73", address: "Avenida Coronel Sezefredo Fagundes, Nº 2168 - Jardim Leonor", email: "contato@harmonie.com" },
        items: contractItems,
        subtotal: subtotal,
        discount: numDiscount,
        total: finalTotal,
        paymentMethodLabel: `${method} ${installments > 1 ? `(${installments}x)` : ''}`
      });

      // Exporta para PDF
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

      // Manda pro WhatsApp
      const foneNumeros = patient?.phone?.replace(/\D/g, "") || "";
      if (foneNumeros) {
        const msg = encodeURIComponent(`Olá, *${patient?.name}*! Tudo bem?\n\nSeu contrato referente aos procedimentos estéticos foi gerado na *Harmonie Clinic*.\nO valor total ficou em R$ ${finalTotal.toFixed(2)} via ${method}.\n\nEnviamos o PDF em anexo no seu e-mail ou entregaremos impresso!`);
        window.open(`https://wa.me/55${foneNumeros}?text=${msg}`, '_blank');
      }

      alert("Venda Concluída e Contrato Gerado!");
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-6xl bg-white shadow-2xl rounded-xl flex flex-col h-[90vh] overflow-hidden font-sans">
        
        {/* CABEÇALHO ATUALIZADO: Usando estilo inline para garantir o branco */}
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

          <div className="w-1/3 bg-white p-6 flex flex-col justify-between">
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
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Forma de Pagamento</label>
              <select value={method} onChange={(e) => setMethod(e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm outline-none focus:border-[#C8A35F] mb-4">
                <option value="PIX">PIX (À VISTA)</option>
                <option value="CREDIT_CARD">Cartão de Crédito</option>
                <option value="DEBIT_CARD">Cartão de Débito</option>
                <option value="CASH">Dinheiro</option>
              </select>
              {method === "CREDIT_CARD" && (
                <div className="animate-in fade-in">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Parcelas</label>
                  <select value={installments} onChange={(e) => setInstallments(Number(e.target.value))} className="w-full border border-gray-300 rounded p-2 text-sm outline-none focus:border-[#C8A35F]">
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => <option key={n} value={n}>{n}x s/ Juros (R$ ${(finalTotal/n).toFixed(2)})</option>)}
                  </select>
                </div>
              )}
            </div>
            <div className="pt-4">
               <button onClick={handleSaveAndGenerateContract} disabled={loading || cart.length === 0} className="w-full bg-[#111] hover:bg-[#C8A35F] text-white py-4 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                {loading ? "Processando..." : <><FileText size={16} /> Fechar Venda e Gerar Contrato</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}