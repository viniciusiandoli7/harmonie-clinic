"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type PatientFormData = {
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  notes?: string;
  isActive?: boolean;
};

type Props = {
  mode: "create" | "edit";
  patient?: PatientFormData;
};

export default function PatientForm({ mode, patient }: Props) {
  const router = useRouter();

  const [name, setName] = useState(patient?.name ?? "");
  const [email, setEmail] = useState(patient?.email ?? "");
  const [phone, setPhone] = useState(patient?.phone ?? "");
  const [birthDate, setBirthDate] = useState(
    patient?.birthDate ? patient.birthDate.slice(0, 10) : ""
  );
  const [notes, setNotes] = useState(patient?.notes ?? "");
  const [isActive, setIsActive] = useState(patient?.isActive ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Função para formatar o telefone em tempo real: (11) 99999-8888
  const formatPhone = (value: string) => {
    if (!value) return value;
    const digits = value.replace(/\D/g, ""); // Remove tudo que não é número
    
    if (digits.length <= 2) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setPhone(formatted);
  };

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
        body: JSON.stringify({
          name,
          email: email || null,
          phone: phone || null,
          birthDate: birthDate || null,
          notes: notes || null,
          isActive,
        }),
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
    <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-[#EAEAEC] bg-white p-8 shadow-sm font-sans">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600 font-light">
          {error}
        </div>
      )}

      {/* Nome Completo */}
      <div>
        <label className="mb-2 block text-[11px] font-medium uppercase tracking-widest text-gray-400">Nome Completo</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-[#EAEAEC] bg-[#FAFAFA] p-3 text-[14px] text-[#1A1A1A] outline-none focus:border-[#C5A267] focus:ring-1 focus:ring-[#C5A267] transition-all"
          placeholder="Ex: Maria Silva"
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* E-mail */}
        <div>
          <label className="mb-2 block text-[11px] font-medium uppercase tracking-widest text-gray-400">E-mail</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-[#EAEAEC] bg-[#FAFAFA] p-3 text-[14px] text-[#1A1A1A] outline-none focus:border-[#C5A267] focus:ring-1 focus:ring-[#C5A267] transition-all"
            placeholder="paciente@exemplo.com"
          />
        </div>

        {/* Telefone com Máscara */}
        <div>
          <label className="mb-2 block text-[11px] font-medium uppercase tracking-widest text-gray-400">Telefone</label>
          <input
            type="text"
            value={phone}
            onChange={handlePhoneChange}
            placeholder="(11) 99999-8888"
            maxLength={15}
            className="w-full rounded-lg border border-[#EAEAEC] bg-[#FAFAFA] p-3 text-[14px] text-[#1A1A1A] outline-none focus:border-[#C5A267] focus:ring-1 focus:ring-[#C5A267] transition-all"
          />
        </div>
      </div>

      {/* Data de Nascimento */}
      <div>
        <label className="mb-2 block text-[11px] font-medium uppercase tracking-widest text-gray-400">Data de Nascimento</label>
        <input
          type="date"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
          className="w-full rounded-lg border border-[#EAEAEC] bg-[#FAFAFA] p-3 text-[14px] text-[#1A1A1A] outline-none focus:border-[#C5A267] focus:ring-1 focus:ring-[#C5A267] transition-all"
        />
      </div>

      {/* Observações */}
      <div>
        <label className="mb-2 block text-[11px] font-medium uppercase tracking-widest text-gray-400">Observações</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Alergias, histórico ou preferências..."
          className="min-h-24 w-full rounded-lg border border-[#EAEAEC] bg-[#FAFAFA] p-3 text-[14px] text-[#1A1A1A] outline-none focus:border-[#C5A267] focus:ring-1 focus:ring-[#C5A267] transition-all"
        />
      </div>

      {/* Checkbox de Ativo (apenas no modo edição) */}
      {mode === "edit" && (
        <label className="flex items-center gap-3 text-[13px] font-light text-[#1A1A1A] cursor-pointer">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 rounded border-[#EAEAEC] text-[#C5A267] focus:ring-[#C5A267]"
          />
          Paciente ativo no sistema
        </label>
      )}

      {/* Ações do Formulário */}
      <div className="mt-8 flex justify-end gap-4 border-t border-[#F0F0F0] pt-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-[#EAEAEC] bg-white px-5 py-2.5 text-[11px] font-medium uppercase tracking-widest text-gray-500 hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-[#1A1A1A] px-8 py-2.5 text-[11px] font-bold uppercase tracking-widest text-white hover:bg-[#C5A267] transition-all shadow-md active:scale-95 disabled:opacity-60"
        >
          {saving ? "Salvando..." : mode === "create" ? "Criar Paciente" : "Salvar Alterações"}
        </button>
      </div>
    </form>
  );
}