"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type PatientFormProps = {
  mode: "create" | "edit";
  patient?: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    birthDate: string | Date | null;
    notes: string | null;
    isActive?: boolean;
  };
};

function formatDateToInput(value: string | Date | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 11) {
    if (digits.length === 10) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }

    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  return value;
}

function calculateAge(birthDate: string) {
  if (!birthDate) return null;

  const today = new Date();
  const birth = new Date(`${birthDate}T00:00:00`);

  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birth.getDate())
  ) {
    age--;
  }

  return age >= 0 ? age : null;
}

export default function PatientForm({ mode, patient }: PatientFormProps) {
  const router = useRouter();

  const initialState = useMemo(
    () => ({
      name: patient?.name ?? "",
      email: patient?.email ?? "",
      phone: patient?.phone ?? "",
      birthDate: formatDateToInput(patient?.birthDate),
      notes: patient?.notes ?? "",
    }),
    [patient]
  );

  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const age = calculateAge(form.birthDate);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;

    if (name === "phone") {
      setForm((prev) => ({ ...prev, phone: formatPhone(value) }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const url =
        mode === "create" ? "/api/patients" : `/api/patients/${patient?.id}`;

      const method = mode === "create" ? "POST" : "PATCH";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Erro ao salvar paciente");
      }

      setSuccess(
        mode === "create"
          ? "Paciente cadastrado com sucesso."
          : "Paciente atualizado com sucesso."
      );

      setTimeout(() => {
        router.push(mode === "create" ? "/patients" : `/patients/${patient?.id}`);
        router.refresh();
      }, 700);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border bg-white p-6 shadow-sm"
    >
      <div className="grid gap-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Nome do paciente *
          </label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Digite o nome completo"
            required
            className="w-full rounded-xl border px-4 py-3 outline-none transition focus:border-gray-400"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            E-mail
          </label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="email@exemplo.com"
            className="w-full rounded-xl border px-4 py-3 outline-none transition focus:border-gray-400"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Telefone
          </label>
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="(11) 99999-9999"
            className="w-full rounded-xl border px-4 py-3 outline-none transition focus:border-gray-400"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Data de nascimento
          </label>
          <input
            name="birthDate"
            type="date"
            value={form.birthDate}
            onChange={handleChange}
            className="w-full rounded-xl border px-4 py-3 outline-none transition focus:border-gray-400"
          />
          {age !== null && (
            <p className="mt-2 text-xs text-gray-500">{age} ano(s)</p>
          )}
        </div>
      </div>

      <div className="mt-5">
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Observações
        </label>
        <textarea
          name="notes"
          value={form.notes}
          onChange={handleChange}
          rows={5}
          placeholder="Informações importantes sobre o paciente..."
          className="w-full rounded-xl border px-4 py-3 outline-none transition focus:border-gray-400"
        />
        <p className="mt-2 text-xs text-gray-500">
          {form.notes.length}/2000 caracteres
        </p>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      <div className="mt-6 flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-black px-5 py-3 text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading
            ? "Salvando..."
            : mode === "create"
            ? "Cadastrar paciente"
            : "Salvar alterações"}
        </button>

        <button
          type="button"
          onClick={() =>
            router.push(mode === "create" ? "/patients" : `/patients/${patient?.id}`)
          }
          className="rounded-xl border px-5 py-3 transition hover:bg-gray-50"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}