"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, ExternalLink, Plus } from "lucide-react";

type Patient = {
  id: string;
  name: string;
  phone?: string | null;
};

type SaleItem = {
  description: string;
  quantity: number;
  unitPrice: number;
};

type Props = {
  patients: Patient[];
  onSuccess?: () => void | Promise<void>;
};

function fmtCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

export default function CloseSaleAutomationCard({ patients, onSuccess }: Props) {
  const [patientId, setPatientId] = useState("");
  const [cpf, setCpf] = useState("");
  const [rg, setRg] = useState("");
  const [treatmentName, setTreatmentName] = useState("");
  const [packageName, setPackageName] = useState("");
  const [totalSessions, setTotalSessions] = useState(1);
  const [goals, setGoals] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("PIX");
  const [paymentDetails, setPaymentDetails] = useState("");
  const [discount, setDiscount] = useState(0);

  const [receivedAmount, setReceivedAmount] = useState(0);
  const [clinicCommissionPct, setClinicCommissionPct] = useState(25);
  const [operationalCost, setOperationalCost] = useState(0);

  const [items, setItems] = useState<SaleItem[]>([
    { description: "", quantity: 1, unitPrice: 0 },
  ]);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    whatsappContractLink: string | null;
    whatsappReminderLink: string | null;
    contractLink: string;
    finance?: {
      grossAmount: number;
      receivedAmount: number;
      pendingAmount: number;
      clinicCommissionPct: number;
      clinicCommissionValue: number;
      professionalValue: number;
      operationalCost: number;
      clinicProfit: number;
    };
  } | null>(null);

  const subtotal = useMemo(
    () => items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0),
    [items]
  );

  const grossAmount = Math.max(0, subtotal - discount);

  const previewReceived = Math.min(
    grossAmount,
    Math.max(0, receivedAmount || grossAmount)
  );

  const previewPending = round2(Math.max(0, grossAmount - previewReceived));
  const previewClinicCommissionValue = round2(
    previewReceived * ((clinicCommissionPct || 25) / 100)
  );
  const previewProfessionalValue = round2(
    Math.max(0, previewReceived - previewClinicCommissionValue)
  );
  const previewClinicProfit = round2(
    previewClinicCommissionValue - Math.max(0, operationalCost || 0)
  );

  function updateItem(index: number, field: keyof SaleItem, value: string | number) {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              [field]: field === "description" ? String(value) : Number(value),
            }
          : item
      )
    );
  }

  function addItem() {
    setItems((prev) => [...prev, { description: "", quantity: 1, unitPrice: 0 }]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleCloseSale() {
    if (!patientId) {
      alert("Selecione o paciente.");
      return;
    }

    if (!items.some((item) => item.description.trim() && item.quantity > 0 && item.unitPrice > 0)) {
      alert("Adicione pelo menos um item válido.");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/sales/close", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patientId,
          cpf,
          rg,
          treatmentName,
          packageName,
          totalSessions,
          goals,
          notes,
          paymentMethod,
          paymentDetails,
          discount,
          receivedAmount,
          clinicCommissionPct,
          operationalCost,
          items,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data?.error ?? "Erro ao fechar venda.");
        return;
      }

      setResult(data);

      if (onSuccess) {
        await onSuccess();
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao fechar venda.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-7 overflow-hidden border border-[#F0ECE4] bg-white">
      <div className="border-b border-[#ECE7DD] bg-[#FCFAF6] px-7 py-6">
        <p className="text-[10px] uppercase tracking-[0.32em] text-[#C8A35F]">
          Caixa inteligente
        </p>

        <h3
          className="mt-2 text-[28px] leading-none text-[#111111]"
          style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
        >
          Fechar venda + contrato + evolução + WhatsApp
        </h3>

        <p className="mt-3 max-w-3xl text-sm text-[#64748B]">
          Agora o sistema calcula venda bruta, valor recebido, valor pendente,
          comissão da clínica e lucro real.
        </p>
      </div>

      <div className="p-7">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="xl:col-span-2">
            <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.22em] text-[#96A4C1]">
              Paciente
            </label>

            <select
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="h-11 w-full border border-[#ECE7DD] bg-white px-3 outline-none"
            >
              <option value="">Selecione</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.22em] text-[#96A4C1]">
              CPF
            </label>

            <input
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              className="h-11 w-full border border-[#ECE7DD] px-3 outline-none"
              placeholder="Opcional"
            />
          </div>

          <div>
            <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.22em] text-[#96A4C1]">
              RG
            </label>

            <input
              value={rg}
              onChange={(e) => setRg(e.target.value)}
              className="h-11 w-full border border-[#ECE7DD] px-3 outline-none"
              placeholder="Opcional"
            />
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.22em] text-[#96A4C1]">
              Tratamento
            </label>

            <input
              value={treatmentName}
              onChange={(e) => setTreatmentName(e.target.value)}
              className="h-11 w-full border border-[#ECE7DD] px-3 outline-none"
              placeholder="Ex.: Bioestimulador"
            />
          </div>

          <div>
            <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.22em] text-[#96A4C1]">
              Pacote
            </label>

            <input
              value={packageName}
              onChange={(e) => setPackageName(e.target.value)}
              className="h-11 w-full border border-[#ECE7DD] px-3 outline-none"
              placeholder="Ex.: Facial Premium"
            />
          </div>

          <div>
            <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.22em] text-[#96A4C1]">
              Sessões
            </label>

            <input
              type="number"
              min="1"
              value={totalSessions}
              onChange={(e) => setTotalSessions(Number(e.target.value || 1))}
              className="h-11 w-full border border-[#ECE7DD] px-3 outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.22em] text-[#96A4C1]">
              Desconto
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value || 0))}
              className="h-11 w-full border border-[#ECE7DD] px-3 outline-none"
            />
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.22em] text-[#96A4C1]">
              Objetivos clínicos
            </label>

            <textarea
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              className="min-h-[100px] w-full border border-[#ECE7DD] p-3 outline-none"
              placeholder="Ex.: redução de medidas, melhora de flacidez..."
            />
          </div>

          <div>
            <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.22em] text-[#96A4C1]">
              Observações
            </label>

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[100px] w-full border border-[#ECE7DD] p-3 outline-none"
              placeholder="Observações internas da venda"
            />
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.22em] text-[#96A4C1]">
              Forma de pagamento
            </label>

            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="h-11 w-full border border-[#ECE7DD] px-3 outline-none"
            >
              <option value="PIX">PIX</option>
              <option value="CREDIT_CARD">Cartão de crédito</option>
              <option value="DEBIT_CARD">Cartão de débito</option>
              <option value="CASH">Dinheiro</option>
              <option value="BANK_TRANSFER">Transferência</option>
              <option value="BANK_SLIP">Boleto</option>
              <option value="OTHER">Outro</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.22em] text-[#96A4C1]">
              Detalhes do pagamento
            </label>

            <input
              value={paymentDetails}
              onChange={(e) => setPaymentDetails(e.target.value)}
              className="h-11 w-full border border-[#ECE7DD] px-3 outline-none"
              placeholder="Ex.: 3x no cartão"
            />
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.22em] text-[#96A4C1]">
              Valor recebido
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={receivedAmount}
              onChange={(e) => setReceivedAmount(Number(e.target.value || 0))}
              className="h-11 w-full border border-[#ECE7DD] px-3 outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.22em] text-[#96A4C1]">
              Comissão clínica %
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={clinicCommissionPct}
              onChange={(e) => setClinicCommissionPct(Number(e.target.value || 0))}
              className="h-11 w-full border border-[#ECE7DD] px-3 outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.22em] text-[#96A4C1]">
              Custo operacional
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={operationalCost}
              onChange={(e) => setOperationalCost(Number(e.target.value || 0))}
              className="h-11 w-full border border-[#ECE7DD] px-3 outline-none"
            />
          </div>

          <div className="border border-[#E9DEC9] bg-[#FCFAF6] p-4">
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#96A4C1]">
              Valor pendente
            </div>
            <div
              className="mt-3 text-[22px] text-[#111111]"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              {fmtCurrency(previewPending)}
            </div>
          </div>
        </div>

        <div className="mt-6 border border-[#ECE7DD] bg-[#FCFAF6] p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold text-[#111111]">Itens da venda</h4>
              <p className="mt-1 text-xs text-[#64748B]">
                Adicione os procedimentos ou produtos que fazem parte da venda.
              </p>
            </div>

            <button
              type="button"
              onClick={addItem}
              className="inline-flex h-10 items-center justify-center gap-2 border border-[#171717] px-4 text-[12px] font-semibold text-[#111111] transition hover:bg-[#171717] hover:text-white"
            >
              <Plus size={14} />
              Adicionar item
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={index}
                className="grid gap-3 md:grid-cols-[1.6fr_110px_140px_auto]"
              >
                <input
                  value={item.description}
                  onChange={(e) => updateItem(index, "description", e.target.value)}
                  placeholder="Produto ou serviço"
                  className="h-11 border border-[#ECE7DD] bg-white px-3 outline-none"
                />

                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, "quantity", Number(e.target.value || 1))}
                  className="h-11 border border-[#ECE7DD] bg-white px-3 outline-none"
                />

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unitPrice}
                  onChange={(e) => updateItem(index, "unitPrice", Number(e.target.value || 0))}
                  className="h-11 border border-[#ECE7DD] bg-white px-3 outline-none"
                />

                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  disabled={items.length === 1}
                  className="h-11 border border-[#ECE7DD] bg-white px-4 text-sm text-[#111111] transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Remover
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <div className="border border-[#F0ECE4] bg-white p-5">
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#96A4C1]">
              Venda bruta
            </div>
            <div
              className="mt-3 text-[20px] text-[#111111]"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              {fmtCurrency(grossAmount)}
            </div>
          </div>

          <div className="border border-[#F0ECE4] bg-white p-5">
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#96A4C1]">
              Recebido
            </div>
            <div
              className="mt-3 text-[20px] text-[#111111]"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              {fmtCurrency(previewReceived)}
            </div>
          </div>

          <div className="border border-[#F0ECE4] bg-white p-5">
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#96A4C1]">
              Pendente
            </div>
            <div
              className="mt-3 text-[20px] text-[#111111]"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              {fmtCurrency(previewPending)}
            </div>
          </div>

          <div className="border border-[#F0ECE4] bg-white p-5">
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#96A4C1]">
              Receita clínica
            </div>
            <div
              className="mt-3 text-[20px] text-[#C8A35F]"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              {fmtCurrency(previewClinicCommissionValue)}
            </div>
          </div>

          <div className="border border-[#F0ECE4] bg-white p-5">
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#96A4C1]">
              Repasse profissional
            </div>
            <div
              className="mt-3 text-[20px] text-[#111111]"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              {fmtCurrency(previewProfessionalValue)}
            </div>
          </div>

          <div className="border border-[#F0ECE4] bg-white p-5">
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#96A4C1]">
              Lucro clínica
            </div>
            <div
              className="mt-3 text-[20px] text-[#111111]"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              {fmtCurrency(previewClinicProfit)}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[#EEF1F5] pt-6">
          <div className="text-sm text-[#64748B]">
            Ao confirmar, o sistema grava o caixa real da venda.
          </div>

          <button
            type="button"
            onClick={handleCloseSale}
            disabled={loading || !patientId}
            className="inline-flex h-11 items-center justify-center bg-[#111111] px-6 text-[12px] font-semibold uppercase tracking-[0.18em] text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Processando..." : "Fechar venda com automação"}
          </button>
        </div>

        {result ? (
          <div className="mt-6 border border-[#E9DEC9] bg-[#FCFAF6] p-5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 text-[#C8A35F]">
                <CheckCircle2 size={20} />
              </div>

              <div className="flex-1">
                <div className="text-sm font-semibold text-[#111111]">
                  Venda finalizada com sucesso.
                </div>

                <p className="mt-1 text-sm text-[#64748B]">
                  Caixa registrado com valor recebido, pendente, comissão e lucro real.
                </p>

                {result.finance ? (
                  <div className="mt-4 grid gap-3 md:grid-cols-4">
                    <div className="border border-[#E9DEC9] bg-white p-3 text-sm text-[#111111]">
                      <div className="text-[10px] uppercase tracking-[0.14em] text-[#96A4C1]">
                        Recebido
                      </div>
                      <div className="mt-2 font-semibold">
                        {fmtCurrency(result.finance.receivedAmount)}
                      </div>
                    </div>

                    <div className="border border-[#E9DEC9] bg-white p-3 text-sm text-[#111111]">
                      <div className="text-[10px] uppercase tracking-[0.14em] text-[#96A4C1]">
                        Pendente
                      </div>
                      <div className="mt-2 font-semibold">
                        {fmtCurrency(result.finance.pendingAmount)}
                      </div>
                    </div>

                    <div className="border border-[#E9DEC9] bg-white p-3 text-sm text-[#111111]">
                      <div className="text-[10px] uppercase tracking-[0.14em] text-[#96A4C1]">
                        Clínica
                      </div>
                      <div className="mt-2 font-semibold">
                        {fmtCurrency(result.finance.clinicCommissionValue)}
                      </div>
                    </div>

                    <div className="border border-[#E9DEC9] bg-white p-3 text-sm text-[#111111]">
                      <div className="text-[10px] uppercase tracking-[0.14em] text-[#96A4C1]">
                        Lucro
                      </div>
                      <div className="mt-2 font-semibold">
                        {fmtCurrency(result.finance.clinicProfit)}
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="mt-4 flex flex-wrap gap-3">
                  <a
                    href={result.contractLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 border border-[#C8A35F] px-4 py-2 text-sm font-medium text-[#C8A35F] transition hover:bg-white"
                  >
                    <ExternalLink size={14} />
                    Abrir contrato
                  </a>

                  {result.whatsappContractLink ? (
                    <a
                      href={result.whatsappContractLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 bg-[#111111] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
                    >
                      <ExternalLink size={14} />
                      Enviar contrato no WhatsApp
                    </a>
                  ) : null}

                  {result.whatsappReminderLink ? (
                    <a
                      href={result.whatsappReminderLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 border border-[#171717] px-4 py-2 text-sm font-medium text-[#111111] transition hover:bg-[#171717] hover:text-white"
                    >
                      <ExternalLink size={14} />
                      Enviar lembrete de sessões
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}