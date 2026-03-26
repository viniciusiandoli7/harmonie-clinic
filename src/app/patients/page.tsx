"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Bell, Plus, Search, MessageSquare } from "lucide-react";

type Patient = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  birthDate?: string | null;
  isActive?: boolean;
  createdAt?: string | null;
};

function getInitial(name: string) {
  return name?.trim()?.charAt(0)?.toUpperCase() || "P";
}

function formatPhone(phone?: string | null) {
  if (!phone) return "Sem telefone";
  return phone;
}

function formatSince(date?: string | null) {
  if (!date) return "Sem data";
  return new Date(date).toLocaleDateString("pt-BR", {
    month: "short",
    year: "numeric",
  });
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  async function loadPatients() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/patients?includeInactive=true", {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao carregar pacientes");
      }

      setPatients(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError("Erro ao carregar pacientes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPatients();
  }, []);

  const filteredPatients = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return patients;

    return patients.filter((patient) => {
      const name = patient.name?.toLowerCase() || "";
      const email = patient.email?.toLowerCase() || "";
      const phone = patient.phone?.toLowerCase() || "";

      return (
        name.includes(term) ||
        email.includes(term) ||
        phone.includes(term)
      );
    });
  }, [patients, search]);

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
            Crm
          </h1>
        </div>

        <div className="flex items-center gap-5 pt-1">
          <div className="flex h-10 w-[320px] items-center gap-3 border-b border-[#D9DEEA] text-[#B3BED2]">
            <Search size={15} strokeWidth={1.8} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="BUSCAR PACIENTE..."
              className="w-full bg-transparent text-[11px] font-semibold uppercase tracking-[0.16em] text-[#111111] outline-none placeholder:text-[#C6D0E0]"
            />
          </div>

          <button type="button" className="relative text-[#C1CAD9]">
            <Bell size={17} strokeWidth={1.8} />
            <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-[#C8A35F]" />
          </button>
        </div>
      </div>

      <div className="mt-12 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <h2
          className="text-[24px] uppercase tracking-[0.16em] text-[#111111]"
          style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
        >
          CRM de pacientes
        </h2>

        <Link
          href="/patients/new"
          className="inline-flex h-11 items-center justify-center gap-2 bg-[#111111] px-6 text-[12px] font-semibold uppercase tracking-[0.18em] text-white"
        >
          <Plus size={14} />
          Novo paciente
        </Link>
      </div>

      {error ? (
        <div className="mt-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="mt-8 text-sm text-[#64748B]">
          Carregando pacientes...
        </div>
      ) : filteredPatients.length === 0 ? (
        <div className="mt-8 border border-[#ECE7DD] bg-white p-6 text-sm text-[#64748B]">
          {search
            ? "Nenhum paciente encontrado para a busca."
            : "Nenhum paciente cadastrado."}
        </div>
      ) : (
        <div className="mt-8 grid gap-6 xl:grid-cols-3">
          {filteredPatients.map((patient) => {
            const whatsappLink = patient.phone
              ? `https://wa.me/${patient.phone.replace(/\D/g, "")}`
              : null;

            return (
              <div
                key={patient.id}
                className="border border-[#F0ECE4] bg-white p-8 transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_12px_30px_rgba(17,17,17,0.05)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-14 w-14 items-center justify-center bg-[#171717] text-[28px] text-[#C8A35F]">
                    <span style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                      {getInitial(patient.name)}
                    </span>
                  </div>

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

                <div className="mt-7">
                  <h3
                    className="text-[19px] text-[#111111]"
                    style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                  >
                    {patient.name}
                  </h3>

                  <div className="mt-3 flex items-center gap-2 text-[14px] text-[#8E9AAF]">
                    <MessageSquare size={13} className="text-[#C8A35F]" />
                    <span>{formatPhone(patient.phone)}</span>
                  </div>
                </div>

                <div className="mt-7 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-[#EEF1F5] pt-6">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#A5B0C5]">
                      E-mail
                    </div>
                    <div className="mt-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#111111] break-all">
                      {patient.email || "Não informado"}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#A5B0C5]">
                      Desde
                    </div>
                    <div className="mt-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#111111]">
                      {formatSince(patient.createdAt)}
                    </div>
                  </div>
                </div>

                <div className="mt-7 flex flex-wrap gap-2">
                  <Link
                    href={`/patients/${patient.id}`}
                    className="inline-flex min-w-[120px] items-center justify-center border border-[#171717] px-4 py-2.5 text-[12px] font-semibold text-[#111111] transition hover:bg-[#171717] hover:text-white"
                  >
                    Abrir ficha
                  </Link>

                  <Link
                    href={`/patients/${patient.id}/edit`}
                    className="inline-flex items-center justify-center border border-[#D8DDE6] px-4 py-2.5 text-[12px] font-semibold text-[#111111] transition hover:bg-[#F7F8FA]"
                  >
                    Editar
                  </Link>

                  {whatsappLink ? (
                    <a
                      href={whatsappLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center bg-[#111111] px-4 py-2.5 text-[12px] font-semibold text-white transition hover:opacity-90"
                    >
                      WhatsApp
                    </a>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}