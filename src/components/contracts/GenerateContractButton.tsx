"use client";

import { useState } from "react";
import { FileSignature } from "lucide-react";
import {
  buildWhatsappContractMessage,
  getWhatsappLink,
} from "@/lib/whatsapp";

type Props = {
  patient: {
    id: string;
    name: string;
    phone?: string | null;
  };
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  paymentDetails?: string;
  cpf?: string;
  rg?: string;
};

export default function GenerateContractButton(props: Props) {
  const [loading, setLoading] = useState(false);

  async function handleGenerateContract() {
    setLoading(true);

    try {
      const res = await fetch("/api/patient-contracts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patientId: props.patient.id,
          title: "Contrato de Prestação de Serviços",
          items: props.items,
          subtotal: props.subtotal,
          discount: props.discount,
          total: props.total,
          paymentMethod: props.paymentMethod,
          paymentDetails: props.paymentDetails,
          cpf: props.cpf,
          rg: props.rg,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data?.error ?? "Erro ao gerar contrato.");
        return;
      }

      const contractLink = `${window.location.origin}/contracts/${data.token}`;
      
      // 🛡️ REFINAMENTO: Mensagem de WhatsApp personalizada para a Dra. Mariana
      const message = `Olá, ${props.patient.name.split(' ')[0]}! 🌟\n\nSeu procedimento com a *Dra. Mariana Carmona* foi registrado com sucesso.\n\nPor favor, utilize o link abaixo para assinar seu contrato digital de forma segura:\n\n${contractLink}`;

      const phoneOnlyNumbers = props.patient.phone?.replace(/\D/g, '');
      const whatsappLink = phoneOnlyNumbers 
        ? `https://api.whatsapp.com/send?phone=55${phoneOnlyNumbers}&text=${encodeURIComponent(message)}`
        : null;

      if (whatsappLink) {
        window.open(whatsappLink, "_blank");
      } else {
        await navigator.clipboard.writeText(contractLink);
        alert("Contrato gerado. Como o telefone não foi preenchido, o link foi copiado para sua área de transferência.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleGenerateContract}
      disabled={loading}
      className="inline-flex h-11 items-center justify-center gap-2 bg-[#111111] px-5 text-[12px] font-semibold uppercase tracking-[0.14em] text-white disabled:opacity-60"
    >
      <FileSignature size={14} />
      {loading ? "Gerando contrato..." : "Gerar contrato e enviar"}
    </button>
  );
}