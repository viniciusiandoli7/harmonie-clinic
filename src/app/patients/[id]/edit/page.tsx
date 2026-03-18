"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import PatientForm from "../../../../components/patients/PatientForm";
import { getWhatsappLink } from "@/lib/whatsapp";

type Patient = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  birthDate?: string | null;
  notes?: string | null;
  isActive?: boolean;
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function EditPatientPage({ params }: PageProps) {
  const router = useRouter();

  const [patientId, setPatientId] = useState("");
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [changingStatus, setChangingStatus] = useState(false);

  useEffect(() => {
    async function resolveParams() {
      const p = await params;
      setPatientId(p.id);
    }

    resolveParams();
  }, [params]);

  useEffect(() => {
    async function loadPatient() {
      if (!patientId) return;

      setLoading(true);
      setError("");

      try {
        const response = await fetch(`/api/patients/${patientId}`, {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || "Erro ao carregar paciente");
        }

        setPatient(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro inesperado");
      } finally {
        setLoading(false);
      }
    }

    loadPatient();
  }, [patientId]);

  async function handleToggleActive() {
    if (!patient) return;

    const isCurrentlyActive = patient.isActive !== false;

    const confirmed = window.confirm(
      isCurrentlyActive
        ? `Tem certeza que deseja inativar o paciente "${patient.name}"?`
        : `Tem certeza que deseja reativar o paciente "${patient.name}"?`
    );

    if (!confirmed) return;

    setChangingStatus(true);
    setError("");

    try {
      const response = await fetch(
        `/api/patients/${patient.id}/${isCurrentlyActive ? "deactivate" : "activate"}`,
        {
          method: "PATCH",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Erro ao atualizar status do paciente");
      }

      setPatient(data);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setChangingStatus(false);
    }
  }

  const whatsappLink = useMemo(() => {
    if (!patient?.phone) return null;

    const message = `Olá${patient.name ? `, ${patient.name}` : ""}! Tudo bem? 😊\n\nAqui é da clínica.\nEstou entrando em contato sobre seu cadastro/atendimento.\n\nQualquer dúvida, estou à disposição.`;

    return getWhatsappLink(patient.phone, message);
  }, [patient]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Link
          href={patientId ? `/patients/${patientId}` : "/patients"}
          className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
        >
          ← Voltar
        </Link>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Editar paciente</h1>
          <p className="text-gray-500">
            Atualize os dados cadastrais e observações do paciente.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {whatsappLink && (
            <a
              href={whatsappLink}
              target="_blank"
              rel="noreferrer"
              className="rounded-md bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700"
            >
              WhatsApp
            </a>
          )}

          {patient && (
            <button
              type="button"
              onClick={handleToggleActive}
              disabled={changingStatus}
              className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {changingStatus
                ? "Salvando..."
                : patient.isActive === false
                  ? "Reativar paciente"
                  : "Inativar paciente"}
            </button>
          )}
        </div>
      </div>

      {patient && (
        <div className="rounded-xl border bg-white p-4">
          <div className="grid gap-3 text-sm text-gray-600 md:grid-cols-3">
            <div>
              <div className="text-xs uppercase tracking-wide text-gray-400">Nome</div>
              <div className="mt-1 font-medium text-gray-900">{patient.name}</div>
            </div>

            <div>
              <div className="text-xs uppercase tracking-wide text-gray-400">E-mail</div>
              <div className="mt-1">{patient.email || "Sem e-mail"}</div>
            </div>

            <div>
              <div className="text-xs uppercase tracking-wide text-gray-400">Telefone</div>
              <div className="mt-1">{patient.phone || "Sem telefone"}</div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-sm text-gray-500">Carregando paciente...</div>
      ) : error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : !patient ? (
        <div className="text-sm text-gray-500">Paciente não encontrado.</div>
      ) : (
        <PatientForm
          mode="edit"
          patient={{
            id: patient.id,
            name: patient.name,
            email: patient.email ?? "",
            phone: patient.phone ?? "",
            birthDate: patient.birthDate ?? "",
            notes: patient.notes ?? "",
            isActive: patient.isActive ?? true,
          }}
        />
      )}
    </div>
  );
}