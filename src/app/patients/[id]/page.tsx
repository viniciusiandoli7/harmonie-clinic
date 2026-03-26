"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Bell, MessageSquare, Pencil, ArrowLeft } from "lucide-react";
import {
  buildWhatsappMessage,
  getWhatsappLink,
} from "@/lib/whatsapp";
import PatientConsentSection from "@/components/patients/PatientConsentSection";
import ClinicalEvolutionSection from "@/components/patients/ClinicalEvolutionSection";

type Patient = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  birthDate?: string | null;
  notes?: string | null;
  isActive?: boolean;
  createdAt?: string | null;
};

type AppointmentStatus = "SCHEDULED" | "COMPLETED" | "CANCELED";
type PaymentStatus = "PENDING" | "PAID" | "CANCELED";

type Appointment = {
  id: string;
  date: string;
  status: AppointmentStatus;
  procedureName?: string | null;
  price?: number | null;
  paymentStatus?: PaymentStatus;
  room?: "A" | "B";
  durationMinutes?: number;
  notes?: string | null;
};

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDate(value?: string | null) {
  if (!value) return "Não informado";
  return new Date(value).toLocaleDateString("pt-BR");
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("pt-BR");
}

function formatSince(date?: string | null) {
  if (!date) return "Sem data";
  return new Date(date).toLocaleDateString("pt-BR", {
    month: "short",
    year: "numeric",
  });
}

function getInitial(name: string) {
  return name?.trim()?.charAt(0)?.toUpperCase() || "P";
}

function paymentBadgeClasses(status: PaymentStatus) {
  if (status === "PAID") {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (status === "CANCELED") {
    return "border-gray-200 bg-gray-100 text-gray-600";
  }

  return "border-orange-200 bg-orange-50 text-orange-700";
}

function statusBadgeClasses(status: AppointmentStatus) {
  if (status === "COMPLETED") {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (status === "CANCELED") {
    return "border-gray-200 bg-gray-100 text-gray-600";
  }

  return "border-yellow-200 bg-yellow-50 text-yellow-700";
}

export default function PatientDetailsPage() {
  const params = useParams();
  const id = params?.id as string;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [patientRes, appointmentsRes] = await Promise.all([
        fetch(`/api/patients/${id}`, {
          cache: "no-store",
        }),
        fetch(`/api/appointments?patientId=${id}`, {
          cache: "no-store",
        }),
      ]);

      const patientData = await patientRes.json();
      const appointmentsData = await appointmentsRes.json();

      if (!patientRes.ok) {
        throw new Error(patientData?.error || "Erro ao carregar paciente");
      }

      if (!appointmentsRes.ok) {
        throw new Error(appointmentsData?.error || "Erro ao carregar consultas");
      }

      setPatient(patientData);
      setAppointments(Array.isArray(appointmentsData) ? appointmentsData : []);
    } catch (err) {
      console.error(err);
      setError("Erro ao carregar paciente.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!id) return;
    loadData();
  }, [id]);

  const sortedAppointments = useMemo(() => {
    return appointments
      .slice()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [appointments]);

  const stats = useMemo(() => {
    const totalAppointments = appointments.length;

    const totalPaid = appointments
      .filter((item) => item.paymentStatus === "PAID")
      .reduce((acc, item) => acc + (item.price ?? 0), 0);

    const totalPending = appointments
      .filter((item) => item.paymentStatus === "PENDING")
      .reduce((acc, item) => acc + (item.price ?? 0), 0);

    const lastAppointment = sortedAppointments[0] ?? null;

    return {
      totalAppointments,
      totalPaid,
      totalPending,
      lastAppointment,
    };
  }, [appointments, sortedAppointments]);

  const whatsappLink = useMemo(() => {
    if (!patient?.phone) return null;

    return getWhatsappLink(
      patient.phone,
      buildWhatsappMessage({
        patientName: patient.name,
        procedureName: stats.lastAppointment?.procedureName ?? "Atendimento",
        date: stats.lastAppointment?.date ?? null,
        room: stats.lastAppointment?.room ?? null,
      })
    );
  }, [patient, stats.lastAppointment]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F3] px-8 py-8 md:px-10 xl:px-14 xl:py-10">
        <div className="text-sm text-[#64748B]">Carregando paciente...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FAF8F3] px-8 py-8 md:px-10 xl:px-14 xl:py-10">
        <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-[#FAF8F3] px-8 py-8 md:px-10 xl:px-14 xl:py-10">
        <div className="text-sm text-[#64748B]">Paciente não encontrado.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F3] px-8 py-8 md:px-10 xl:px-14 xl:py-10">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.38em] text-[#C8A35F]">
            Harmonie Management System
          </p>

          <h1
            className="mt-3 text-[46px] leading-none text-[#111111] xl:text-[48px]"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            Paciente
          </h1>
        </div>

        <div className="flex items-center gap-5 pt-1">
          <div className="flex h-10 w-[260px] items-center gap-3 border-b border-[#D9DEEA] text-[#B3BED2]">
            <MessageSquare size={15} strokeWidth={1.8} />
            <div className="w-full text-[11px] font-semibold uppercase tracking-[0.16em] text-[#C6D0E0]">
              Ficha premium do paciente
            </div>
          </div>

          <button type="button" className="relative text-[#C1CAD9]">
            <Bell size={17} strokeWidth={1.8} />
            <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-[#C8A35F]" />
          </button>
        </div>
      </div>

      <div className="mt-12 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/patients"
            className="inline-flex h-11 items-center justify-center gap-2 border border-[#171717] px-4 text-[12px] font-semibold text-[#111111] transition hover:bg-[#171717] hover:text-white"
          >
            <ArrowLeft size={14} />
            Voltar
          </Link>

          <Link
            href={`/patients/${patient.id}/edit`}
            className="inline-flex h-11 items-center justify-center gap-2 border border-[#D8DDE6] px-4 text-[12px] font-semibold text-[#111111] transition hover:bg-[#F7F8FA]"
          >
            <Pencil size={14} />
            Editar
          </Link>

          {whatsappLink ? (
            <a
              href={whatsappLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center justify-center bg-[#111111] px-5 text-[12px] font-semibold text-white transition hover:opacity-90"
            >
              WhatsApp
            </a>
          ) : null}
        </div>
      </div>

      <div className="mt-8 border border-[#F0ECE4] bg-white p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex items-start gap-5">
            <div className="flex h-16 w-16 items-center justify-center bg-[#171717] text-[32px] text-[#C8A35F]">
              <span style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                {getInitial(patient.name)}
              </span>
            </div>

            <div>
              <h2
                className="text-[30px] text-[#111111]"
                style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
              >
                {patient.name}
              </h2>

              <div className="mt-3 text-[14px] text-[#8E9AAF]">
                {patient.phone || "Sem telefone"}
              </div>

              <div className="mt-1 text-[14px] text-[#8E9AAF]">
                {patient.email || "Sem e-mail"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={[
                "inline-flex items-center border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]",
                patient.isActive === false
                  ? "border-[#E5E7EB] bg-[#F5F5F5] text-[#6B7280]"
                  : "border-[#E9DEC9] bg-[#FCFAF6] text-[#C8A35F]",
              ].join(" ")}
            >
              {patient.isActive === false ? "Inativo" : "Ativo"}
            </span>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#A5B0C5]">
              Nascimento
            </div>
            <div className="mt-2 text-[13px] font-semibold uppercase tracking-[0.08em] text-[#111111]">
              {formatDate(patient.birthDate)}
            </div>
          </div>

          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#A5B0C5]">
              Desde
            </div>
            <div className="mt-2 text-[13px] font-semibold uppercase tracking-[0.08em] text-[#111111]">
              {formatSince(patient.createdAt)}
            </div>
          </div>

          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#A5B0C5]">
              Total consultas
            </div>
            <div className="mt-2 text-[13px] font-semibold uppercase tracking-[0.08em] text-[#111111]">
              {stats.totalAppointments}
            </div>
          </div>

          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#A5B0C5]">
              Último atendimento
            </div>
            <div className="mt-2 text-[13px] font-semibold uppercase tracking-[0.08em] text-[#111111]">
              {stats.lastAppointment ? formatDate(stats.lastAppointment.date) : "Sem histórico"}
            </div>
          </div>
        </div>

        {patient.notes ? (
          <div className="mt-8 border-t border-[#EEF1F5] pt-6">
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#A5B0C5]">
              Observações
            </div>
            <div className="mt-3 text-sm leading-6 text-[#475569]">
              {patient.notes}
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-7 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="border border-[#F0ECE4] bg-white p-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#96A4C1]">
            Total consultas
          </p>

          <div
            className="mt-3 text-[24px] text-[#111111]"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            {stats.totalAppointments}
          </div>
        </div>

        <div className="border border-[#F0ECE4] bg-white p-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#96A4C1]">
            Total pago
          </p>

          <div
            className="mt-3 text-[24px] text-[#C8A35F]"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            {formatCurrency(stats.totalPaid)}
          </div>
        </div>

        <div className="border border-[#F0ECE4] bg-white p-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#96A4C1]">
            Total pendente
          </p>

          <div
            className="mt-3 text-[24px] text-[#111111]"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            {formatCurrency(stats.totalPending)}
          </div>
        </div>
      </div>

      <div className="mt-7">
        <PatientConsentSection
          patient={{
            id: patient.id,
            name: patient.name,
            phone: patient.phone,
          }}
        />
      </div>

      <div className="mt-7">
        <ClinicalEvolutionSection
          patient={{
            id: patient.id,
            name: patient.name,
          }}
        />
      </div>

      <div className="mt-7 overflow-hidden border border-[#F0ECE4] bg-white">
        <div className="border-b border-[#EEF1F5] bg-[#FCFAF6] px-8 py-5">
          <h2
            className="text-[22px] text-[#111111]"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            Histórico de consultas
          </h2>
        </div>

        {sortedAppointments.length === 0 ? (
          <div className="px-8 py-8 text-sm text-[#64748B]">
            Nenhuma consulta encontrada.
          </div>
        ) : (
          <div className="divide-y divide-[#EEF1F5]">
            {sortedAppointments.map((appointment) => (
              <div key={appointment.id} className="px-8 py-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <div className="text-[15px] font-semibold text-[#111111]">
                      {formatDateTime(appointment.date)}
                    </div>

                    <div className="mt-2 text-[15px] text-[#475569]">
                      {appointment.procedureName || "Procedimento não informado"}
                    </div>

                    {appointment.notes ? (
                      <div className="mt-2 text-sm text-[#8E9AAF]">
                        {appointment.notes}
                      </div>
                    ) : null}

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span
                        className={`inline-flex items-center border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${statusBadgeClasses(
                          appointment.status
                        )}`}
                      >
                        {appointment.status}
                      </span>

                      <span
                        className={`inline-flex items-center border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${paymentBadgeClasses(
                          appointment.paymentStatus ?? "PENDING"
                        )}`}
                      >
                        {appointment.paymentStatus ?? "PENDING"}
                      </span>

                      {appointment.room ? (
                        <span className="inline-flex items-center border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#64748B]">
                          Sala {appointment.room}
                        </span>
                      ) : null}

                      <span className="inline-flex items-center border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#64748B]">
                        {appointment.durationMinutes ?? 30} min
                      </span>
                    </div>
                  </div>

                  <div
                    className="text-[22px] text-[#111111]"
                    style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                  >
                    {formatCurrency(appointment.price ?? 0)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}