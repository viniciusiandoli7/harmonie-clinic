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
    <div className="min-h-screen bg-[#FAFAFA] px-4 py-4 md:px-8 xl:px-12 xl:py-8">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-[#C5A059] font-semibold mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
            Harmonie Management System
          </p>

          <h1
            className="text-[32px] leading-none text-[#1A1A1A] xl:text-[38px] tracking-[0.18em]"
            style={{ fontFamily: 'Cormorant Garamond, serif', letterSpacing: '0.18em', fontWeight: 700 }}
          >
            Editar paciente
          </h1>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <Link
          href={patientId ? `/patients/${patientId}` : "/patients"}
          className="inline-flex h-9 items-center justify-center gap-2 border border-[#C5A059] px-4 text-[11px] font-semibold text-[#1A1A1A] transition hover:bg-[#C5A059] hover:text-[#FAFAFA] uppercase tracking-[0.12em]"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          ← Voltar
        </Link>
      </div>

      <div className="mt-6 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-[12px] text-[#C5A059]" style={{ fontFamily: 'Inter, sans-serif' }}>
            Atualize os dados cadastrais e observações do paciente.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {whatsappLink && (
            <a
              href={whatsappLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center justify-center bg-[#1A1A1A] px-4 text-[11px] font-semibold text-[#FAFAFA] transition hover:opacity-90 uppercase tracking-[0.12em]"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              WhatsApp
            </a>
          )}

          {patient && (
            <button
              type="button"
              onClick={handleToggleActive}
              disabled={changingStatus}
              className="inline-flex h-9 items-center justify-center border border-[#C5A059] px-4 text-[11px] font-semibold text-[#1A1A1A] transition hover:bg-[#C5A059] hover:text-[#FAFAFA] uppercase tracking-[0.12em] disabled:cursor-not-allowed disabled:opacity-60"
              style={{ fontFamily: 'Inter, sans-serif' }}
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
        <div className="mt-6 border border-[#C5A059] bg-[#FAFAFA] p-5 rounded-xl shadow-md">
          <div className="grid gap-3 text-[12px] md:grid-cols-3" style={{ fontFamily: 'Inter, sans-serif' }}>
            <div>
              <div className="text-[9px] uppercase tracking-[0.18em] text-[#C5A059] font-semibold">Nome</div>
              <div className="mt-1 font-semibold text-[#1A1A1A]">{patient.name}</div>
            </div>

            <div>
              <div className="text-[9px] uppercase tracking-[0.18em] text-[#C5A059] font-semibold">E-mail</div>
              <div className="mt-1 text-[#1A1A1A]">{patient.email || "Sem e-mail"}</div>
            </div>

            <div>
              <div className="text-[9px] uppercase tracking-[0.18em] text-[#C5A059] font-semibold">Telefone</div>
              <div className="mt-1 text-[#1A1A1A]">{patient.phone || "Sem telefone"}</div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="mt-6 text-[12px] text-[#C5A059]" style={{ fontFamily: 'Inter, sans-serif' }}>Carregando paciente...</div>
      ) : error ? (
        <div className="mt-6 border border-red-300 bg-red-50 px-4 py-3 text-[12px] text-red-700 rounded-xl" style={{ fontFamily: 'Inter, sans-serif' }}>
          {error}
        </div>
      ) : !patient ? (
        <div className="mt-6 text-[12px] text-[#C5A059]" style={{ fontFamily: 'Inter, sans-serif' }}>Paciente não encontrado.</div>
      ) : (
        <div className="mt-6">
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
        </div>
      )}
    </div>
  );
}