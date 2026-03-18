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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const url = mode === "create" ? "/api/patients" : `/api/patients/${patient?.id}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
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

      if (!response.ok) {
        throw new Error(data?.error || "Erro ao salvar paciente");
      }

      router.push(mode === "create" ? `/patients/${data.id}` : `/patients/${patient?.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border bg-white p-6 shadow-sm">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <label className="mb-2 block text-sm font-medium">Nome</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-md border p-3 outline-none"
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium">E-mail</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border p-3 outline-none"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Telefone</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="11999998888"
            className="w-full rounded-md border p-3 outline-none"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">Data de nascimento</label>
        <input
          type="date"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
          className="w-full rounded-md border p-3 outline-none"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">Observações</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="min-h-[120px] w-full rounded-md border p-3 outline-none"
        />
      </div>

      {mode === "edit" && (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          Paciente ativo
        </label>
      )}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50"
        >
          Cancelar
        </button>

        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-black px-4 py-2 text-sm text-white hover:opacity-90 disabled:opacity-60"
        >
          {saving ? "Salvando..." : mode === "create" ? "Criar paciente" : "Salvar alterações"}
        </button>
      </div>
    </form>
  );
}