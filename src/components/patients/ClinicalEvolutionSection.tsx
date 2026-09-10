"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import SignatureCanvas from "react-signature-canvas";
import {
  Activity,
  CalendarDays,
  Camera,
  CheckCircle2,
  Download,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  PenLine,
  Plus,
  RotateCcw,
  ShieldCheck,
  X,
} from "lucide-react";
import { downloadEvolutionPdf } from "@/lib/evolutionPdf";

type Patient = { id: string; name: string; phone?: string | null };
type EntryType = "SESSION" | "FOLLOW_UP" | "RETURN";

type EvolutionSession = {
  id: string;
  sessionNumber: number;
  sessionDate: string;
  performedProcedure?: string | null;
  bodyMeasurements?: string | null;
  clinicalNotes?: string | null;
  imagesJson?: unknown;
  entryType?: EntryType | string | null;
  countsTowardSession?: boolean | null;
  patientSignatureName?: string | null;
  signedAt?: string | null;
  signatureImage?: string | null;
};

type EvolutionPlan = {
  id: string;
  treatmentName: string;
  packageName?: string | null;
  totalSessions: number;
  completedSessions: number;
  status: "ACTIVE" | "FINISHED" | "CANCELED";
  sessions: EvolutionSession[];
};

type LegacyPhoto = {
  id: string;
  title?: string | null;
  procedureName?: string | null;
  imageUrl: string;
  takenAt: string;
  notes?: string | null;
};

type LegacyStructuredEvolution = {
  id: string;
  createdAt: string;
  procedurePerformed: string;
  productUsed?: string | null;
  batch?: string | null;
  bodyArea?: string | null;
  quantity?: string | null;
  complaint?: string | null;
  clinicalAssessment?: string | null;
  intercurrences?: string | null;
  guidance?: string | null;
};

type Props = { patient: Patient; contractSignature?: string | null };

type UploadConfig =
  | {
      mode: "signed";
      cloudName: string;
      apiKey: string;
      timestamp: number;
      folder: string;
      signature: string;
    }
  | {
      mode: "unsigned";
      cloudName: string;
      uploadPreset: string;
      folder?: string;
    };

function localDateInputValue() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  });
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
}

function isReadableImageSource(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const source = value.trim();
  return /^https:\/\//i.test(source) || /^data:image\/(?:png|jpe?g|webp);base64,/i.test(source);
}

function isLegacyDataImage(value: string) {
  return /^data:image\/(?:png|jpe?g|webp);base64,/i.test(value);
}

function parseImages(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter(isReadableImageSource);
  if (typeof value === "string") {
    if (isReadableImageSource(value)) return [value];
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter(isReadableImageSource) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function storedEntryMeta(bodyMeasurements?: string | null) {
  const raw = String(bodyMeasurements || "");
  const match = raw.match(/^__HARMONIE_ENTRY_TYPE__:(SESSION|FOLLOW_UP|RETURN)(?:\r?\n([\s\S]*))?$/);
  if (!match) return { entryType: "SESSION" as EntryType, bodyMeasurements: bodyMeasurements || null };
  return {
    entryType: match[1] as EntryType,
    bodyMeasurements: (match[2] || "").trim() || null,
  };
}

function sessionEntryType(session: EvolutionSession): EntryType {
  // Compatibilidade: versões intermediárias chegaram a devolver entryType pelo Prisma.
  // A versão atual não depende dessas colunas para abrir prontuários antigos.
  const explicit = String(session.entryType || "").toUpperCase();
  if (explicit === "FOLLOW_UP" || explicit === "RETURN" || explicit === "SESSION") return explicit as EntryType;
  return storedEntryMeta(session.bodyMeasurements).entryType;
}

function normalizeEntryType(value?: string | null): EntryType {
  if (value === "FOLLOW_UP" || value === "RETURN") return value;
  return "SESSION";
}

function entryLabel(value?: string | null) {
  const type = normalizeEntryType(value);
  if (type === "FOLLOW_UP") return "Acompanhamento / fotos";
  if (type === "RETURN") return "Retorno presencial";
  return "Sessão realizada";
}

function entryBadgeClass(value?: string | null) {
  const type = normalizeEntryType(value);
  if (type === "FOLLOW_UP") return "bg-[#F1F5F9] text-[#52657F]";
  if (type === "RETURN") return "bg-[#F6F0E5] text-[#9B732E]";
  return "bg-[#F7F2EA] text-[#5A1F2B]";
}

function safeFilePart(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.18em] text-[#5A1F2B]/65">
      {children}
    </label>
  );
}

async function getUploadConfig(): Promise<UploadConfig> {
  const res = await fetch("/api/uploads/clinical-image-signature", {
    method: "POST",
    cache: "no-store",
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error || "O armazenamento de fotos não está configurado.");
  }
  return data as UploadConfig;
}

async function uploadClinicalImage(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Selecione apenas arquivos de imagem.");
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("Cada foto deve ter no máximo 10 MB.");
  }

  const config = await getUploadConfig();
  const formData = new FormData();
  formData.append("file", file);

  if (config.mode === "signed") {
    formData.append("api_key", config.apiKey);
    formData.append("timestamp", String(config.timestamp));
    formData.append("folder", config.folder);
    formData.append("signature", config.signature);
  } else {
    formData.append("upload_preset", config.uploadPreset);
    if (config.folder) formData.append("folder", config.folder);
  }

  const res = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`, {
    method: "POST",
    body: formData,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.secure_url) {
    const cloudinaryMessage = data?.error?.message;
    throw new Error(cloudinaryMessage || "Não foi possível enviar a foto. Tente novamente.");
  }

  return data.secure_url as string;
}

export default function ClinicalEvolutionSection({ patient, contractSignature }: Props) {
  const [plans, setPlans] = useState<EvolutionPlan[]>([]);
  const [legacyPhotos, setLegacyPhotos] = useState<LegacyPhoto[]>([]);
  const [legacyStructuredEvolutions, setLegacyStructuredEvolutions] = useState<LegacyStructuredEvolution[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);

  const [sessionDate, setSessionDate] = useState(localDateInputValue());
  const [description, setDescription] = useState("");
  const [entryType, setEntryType] = useState<EntryType>("SESSION");
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exportingPlanId, setExportingPlanId] = useState<string | null>(null);

  const [signingSession, setSigningSession] = useState<EvolutionSession | null>(null);
  const [signatureSaving, setSignatureSaving] = useState(false);
  const signatureRef = useRef<SignatureCanvas>(null);

  async function loadData() {
    setLoading(true);
    try {
      const [plansRes, photosRes, structuredRes] = await Promise.all([
        fetch(`/api/patients/${patient.id}/evolution`, { cache: "no-store" }),
        fetch(`/api/patients/${patient.id}/photos`, { cache: "no-store" }),
        fetch(`/api/patients/${patient.id}/structured-evolutions`, { cache: "no-store" }),
      ]);

      const plansData = plansRes.ok ? await plansRes.json() : [];
      const photosData = photosRes.ok ? await photosRes.json() : [];
      const structuredData = structuredRes.ok ? await structuredRes.json() : [];
      setPlans(Array.isArray(plansData) ? plansData : []);
      setLegacyPhotos(Array.isArray(photosData) ? photosData : []);
      setLegacyStructuredEvolutions(Array.isArray(structuredData) ? structuredData : []);
    } catch (error) {
      console.error("Erro ao carregar evolução clínica:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [patient.id]);

  function resetForm(plan?: EvolutionPlan) {
    setSessionDate(localDateInputValue());
    setDescription("");
    setUploadedImages([]);
    setEntryType(plan && plan.completedSessions < plan.totalSessions ? "SESSION" : "FOLLOW_UP");
  }

  function togglePlan(plan: EvolutionPlan) {
    setExpandedPlanId((current) => {
      const next = current === plan.id ? null : plan.id;
      if (next) resetForm(plan);
      return next;
    });
  }

  async function handleImagesUpload(files: FileList | null) {
    if (!files?.length) return;

    const availableSlots = Math.max(0, 20 - uploadedImages.length);
    if (!availableSlots) {
      alert("Este registro já atingiu o limite de 20 fotos.");
      return;
    }

    const selectedFiles = Array.from(files).slice(0, availableSlots);
    setUploadingImages(true);
    try {
      const newUrls: string[] = [];
      for (const file of selectedFiles) {
        newUrls.push(await uploadClinicalImage(file));
      }
      setUploadedImages((prev) => [...prev, ...newUrls]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível enviar as fotos.";
      alert(`Erro ao enviar foto: ${message}`);
    } finally {
      setUploadingImages(false);
    }
  }

  async function saveEvolution(plan: EvolutionPlan) {
    const cleanDescription = description.trim();
    if (!sessionDate) {
      alert("Informe a data do atendimento/acompanhamento.");
      return;
    }
    if (!cleanDescription) {
      alert("Descreva o registro desta evolução.");
      return;
    }
    if (uploadingImages) {
      alert("Aguarde o envio das fotos terminar antes de salvar.");
      return;
    }
    if (entryType === "SESSION" && plan.completedSessions >= plan.totalSessions) {
      alert("Todas as sessões contratadas já foram registradas. Use Acompanhamento / fotos ou Retorno presencial.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/evolution-plans/${plan.id}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionDate: `${sessionDate}T12:00:00.000Z`,
          performedProcedure: plan.treatmentName,
          clinicalNotes: cleanDescription,
          images: uploadedImages,
          entryType,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || "Não foi possível salvar a evolução.");
      }

      resetForm(plan);
      await loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível salvar a evolução.";
      alert(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleExportPDF(plan: EvolutionPlan) {
    setExportingPlanId(plan.id);
    try {
      await downloadEvolutionPdf({
        patientName: patient.name,
        treatmentName: plan.treatmentName,
        totalSessions: plan.totalSessions,
        completedSessions: plan.completedSessions,
        sessions: (plan.sessions || []).map((session) => {
          const meta = storedEntryMeta(session.bodyMeasurements);
          return {
            ...session,
            entryType: sessionEntryType(session),
            bodyMeasurements: meta.bodyMeasurements,
            images: parseImages(session.imagesJson),
          };
        }),
      });
    } catch (error) {
      console.error("Erro ao gerar PDF da evolução:", error);
      alert("Não foi possível gerar o PDF. Tente novamente.");
    } finally {
      setExportingPlanId(null);
    }
  }

  function openAcknowledgement(session: EvolutionSession) {
    setSigningSession(session);
    window.setTimeout(() => signatureRef.current?.clear(), 50);
  }

  async function saveAcknowledgement() {
    if (!signingSession) return;
    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      alert("Peça para a paciente dar o visto/assinar no quadro antes de confirmar.");
      return;
    }

    setSignatureSaving(true);
    try {
      const signatureImage = signatureRef.current.getTrimmedCanvas().toDataURL("image/png");
      const res = await fetch(`/api/evolution-sessions/${signingSession.id}/sign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signatureImage }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Não foi possível registrar a ciência da paciente.");

      setSigningSession(null);
      await loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível registrar a ciência da paciente.";
      alert(message);
    } finally {
      setSignatureSaving(false);
    }
  }

  function downloadImageHref(imageUrl: string, plan: EvolutionPlan, session: EvolutionSession, index: number) {
    const name = `${safeFilePart(patient.name)}-${safeFilePart(plan.treatmentName)}-${formatDate(session.sessionDate).replaceAll("/", "-")}-foto-${index + 1}`;
    if (isLegacyDataImage(imageUrl)) return imageUrl;
    return `/api/clinical-images/download?url=${encodeURIComponent(imageUrl)}&name=${encodeURIComponent(name)}`;
  }

  function legacyPhotoDownloadHref(photo: LegacyPhoto, index: number) {
    const name = `${safeFilePart(patient.name)}-${safeFilePart(photo.procedureName || photo.title || "foto-clinica")}-${formatDate(photo.takenAt).replaceAll("/", "-")}-foto-${index + 1}`;
    if (isLegacyDataImage(photo.imageUrl)) return photo.imageUrl;
    return `/api/clinical-images/download?url=${encodeURIComponent(photo.imageUrl)}&name=${encodeURIComponent(name)}`;
  }

  return (
    <div className="space-y-6 font-sans">
      <section className="rounded-sm border border-[#ECE7DD] bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-[#5A1F2B]/10 p-3 text-[#5A1F2B]">
            <FileText size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#5A1F2B]/70">Prontuário clínico</p>
            <h3 className="mt-1 font-serif text-2xl uppercase tracking-widest text-[#111]">Evolução & Fotos</h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#5B3A2E]/60">
              Registre a sessão, os acompanhamentos fotográficos e os retornos dentro do mesmo tratamento. Acompanhamentos e retornos não consomem novas sessões do pacote.
            </p>
          </div>
        </div>
      </section>

      {loading && (
        <div className="rounded-sm border border-[#ECE7DD] bg-white p-10 text-center text-sm text-gray-400">
          Carregando histórico clínico…
        </div>
      )}

      {!loading && plans.length === 0 && (
        <div className="rounded-sm border border-[#ECE7DD] bg-white p-10 text-center shadow-sm">
          <h3 className="mb-2 font-serif text-lg text-[#111]">Nenhum procedimento vinculado</h3>
          <p className="text-[11px] uppercase tracking-widest text-gray-400">
            O prontuário de evolução é liberado quando existe um procedimento ou pacote vinculado à paciente.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {plans.map((plan) => {
          const followUpCount = (plan.sessions || []).filter((session) => sessionEntryType(session) !== "SESSION").length;
          return (
            <section
              key={plan.id}
              id={`evolution-plan-${plan.id}`}
              className="overflow-hidden rounded-sm border border-[#ECE7DD] bg-white shadow-sm"
            >
              <div className="flex flex-col gap-4 border-b border-gray-50 bg-[#FCFAF6]/60 px-6 py-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-serif text-xl uppercase text-[#111]">{plan.treatmentName}</h4>
                    {!plan.packageName && (
                      <span className="rounded bg-gray-100 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-gray-500">
                        Avulso
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[9px] font-bold uppercase tracking-wide text-gray-400">
                    Sessões: {plan.completedSessions}/{plan.totalSessions}
                    {followUpCount > 0 ? ` • ${followUpCount} acompanhamento${followUpCount > 1 ? "s" : ""}` : ""}
                    {plan.packageName ? ` • ${plan.packageName}` : ""}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleExportPDF(plan)}
                    disabled={exportingPlanId === plan.id}
                    className="flex h-9 items-center gap-2 border border-[#C8A35F] px-4 text-[10px] font-bold uppercase text-[#C8A35F] transition-colors hover:bg-[#FAF8F3] disabled:opacity-50"
                  >
                    {exportingPlanId === plan.id ? <Activity size={14} className="animate-spin" /> : <Download size={14} />}
                    {exportingPlanId === plan.id ? "Gerando…" : "Baixar PDF"}
                  </button>
                  <button
                    onClick={() => togglePlan(plan)}
                    className={`h-9 px-5 text-[10px] font-bold uppercase tracking-wider shadow-sm transition-all ${
                      expandedPlanId === plan.id
                        ? "bg-gray-100 text-gray-600"
                        : "bg-[#111] text-white hover:bg-[#5A1F2B]"
                    }`}
                  >
                    {expandedPlanId === plan.id ? "Fechar" : "Nova evolução"}
                  </button>
                </div>
              </div>

              {expandedPlanId === plan.id && (
                <div className="animate-in fade-in duration-300">
                  <div className="border-b border-[#ECE7DD] bg-[#FAF8F3] p-6">
                    <div className="mb-6">
                      <FieldLabel>Tipo do registro</FieldLabel>
                      <div className="grid gap-2 sm:grid-cols-3">
                        {([
                          ["SESSION", "Sessão realizada", "Conta no pacote"],
                          ["FOLLOW_UP", "Acompanhamento / fotos", "Não consome sessão"],
                          ["RETURN", "Retorno presencial", "Não consome sessão"],
                        ] as const).map(([value, title, helper]) => {
                          const disabled = value === "SESSION" && plan.completedSessions >= plan.totalSessions;
                          return (
                            <button
                              key={value}
                              type="button"
                              disabled={disabled}
                              onClick={() => setEntryType(value)}
                              className={`rounded-sm border px-4 py-3 text-left transition-all ${
                                entryType === value
                                  ? "border-[#5A1F2B] bg-white shadow-sm"
                                  : "border-[#E6DED2] bg-[#FCFAF6]"
                              } ${disabled ? "cursor-not-allowed opacity-40" : "hover:border-[#C8A35F]"}`}
                            >
                              <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-[#2C2724]">{title}</span>
                              <span className="mt-1 block text-[10px] text-gray-400">{helper}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
                      <div>
                        <FieldLabel>Data do registro</FieldLabel>
                        <div className="relative">
                          <CalendarDays size={16} className="pointer-events-none absolute left-3 top-3.5 text-[#5A1F2B]/50" />
                          <input
                            type="date"
                            value={sessionDate}
                            onChange={(event) => setSessionDate(event.target.value)}
                            className="h-11 w-full border border-[#ECE7DD] bg-white pl-10 pr-3 text-sm outline-none transition-colors focus:border-[#C8A35F]"
                          />
                        </div>
                      </div>

                      <div>
                        <FieldLabel>Descrição da evolução</FieldLabel>
                        <textarea
                          value={description}
                          onChange={(event) => setDescription(event.target.value)}
                          placeholder={
                            entryType === "FOLLOW_UP"
                              ? "Ex.: D+2 de CO₂ — paciente enviou fotos, edema em regressão, sem sinais de intercorrência…"
                              : entryType === "RETURN"
                                ? "Ex.: retorno de 15 dias — pele íntegra, evolução satisfatória, orientações reforçadas…"
                                : "Ex.: realizada sessão de CO₂ full face, sem intercorrências imediatas…"
                          }
                          className="min-h-28 w-full resize-y border border-[#ECE7DD] bg-white p-3 text-sm leading-6 outline-none transition-colors focus:border-[#C8A35F]"
                        />
                      </div>
                    </div>

                    <div className="mt-6">
                      <FieldLabel>Fotos deste registro</FieldLabel>
                      <label className={`flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-sm border-2 border-dashed px-5 py-5 text-center transition-all ${
                        uploadingImages
                          ? "cursor-wait border-gray-200 bg-gray-50"
                          : "border-[#C8A35F]/35 bg-white hover:border-[#C8A35F] hover:bg-[#FCFAF6]"
                      }`}>
                        {uploadingImages ? (
                          <Activity size={22} className="animate-spin text-gray-400" />
                        ) : (
                          <Camera size={22} className="text-[#C8A35F]" />
                        )}
                        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#5A1F2B]">
                          {uploadingImages ? "Enviando fotos…" : "Adicionar fotos"}
                        </span>
                        <span className="text-[11px] text-gray-400">Pode selecionar várias imagens de uma vez.</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          disabled={uploadingImages}
                          onChange={(event) => {
                            handleImagesUpload(event.target.files);
                            event.currentTarget.value = "";
                          }}
                        />
                      </label>

                      {uploadedImages.length > 0 && (
                        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
                          {uploadedImages.map((imageUrl, index) => (
                            <div key={`${imageUrl}-${index}`} className="group relative aspect-square overflow-hidden rounded-sm border border-[#ECE7DD] bg-white shadow-sm">
                              <img src={imageUrl} alt={`Foto ${index + 1}`} className="h-full w-full object-cover" />
                              <button
                                type="button"
                                onClick={() => setUploadedImages((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                                aria-label="Remover foto"
                                className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white"
                              >
                                <X size={13} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-6 flex flex-col gap-3 border-t border-[#ECE7DD] pt-5 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-[11px] leading-5 text-gray-400">
                        {entryType === "SESSION"
                          ? `Este registro contará como uma sessão realizada (${Math.min(plan.completedSessions + 1, plan.totalSessions)}/${plan.totalSessions}).`
                          : `Este registro será salvo como ${entryLabel(entryType).toLowerCase()} e manterá o contador em ${plan.completedSessions}/${plan.totalSessions}.`}
                      </p>
                      <button
                        type="button"
                        onClick={() => saveEvolution(plan)}
                        disabled={saving || uploadingImages}
                        className="flex h-12 items-center justify-center gap-3 bg-[#111] px-8 text-[10px] font-bold uppercase tracking-[0.18em] text-white shadow-lg transition-all hover:bg-[#5A1F2B] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {saving ? <Activity size={17} className="animate-spin" /> : <Plus size={17} />}
                        {saving ? "Salvando…" : "Salvar evolução"}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4 p-6">
                    {(plan.sessions || []).length === 0 ? (
                      <div className="rounded-sm border border-dashed border-[#5A1F2B]/15 bg-[#FCFAF6] p-8 text-center text-sm text-gray-400">
                        Nenhuma evolução registrada para este procedimento ainda.
                      </div>
                    ) : (
                      (plan.sessions || []).map((session) => {
                        const sessionImages = parseImages(session.imagesJson);
                        const storedMeta = storedEntryMeta(session.bodyMeasurements);
                        const currentEntryType = sessionEntryType(session);
                        const cleanBodyMeasurements = storedMeta.bodyMeasurements;
                        const mainDescription = session.clinicalNotes || cleanBodyMeasurements || session.performedProcedure || "Registro clínico";
                        const hasLegacyExtra = Boolean(
                          cleanBodyMeasurements &&
                            session.clinicalNotes &&
                            !session.clinicalNotes.includes(cleanBodyMeasurements)
                        );

                        return (
                          <article key={session.id} className="group relative rounded-sm border border-[#ECE7DD] bg-white p-5">

                            <div className="pr-8">
                              <div className="flex flex-wrap items-center gap-2.5">
                                <span className="rounded bg-[#F7F2EA] px-2 py-1 text-[9px] font-black uppercase tracking-wider text-[#5A1F2B]">
                                  Evolução {session.sessionNumber}
                                </span>
                                <span className={`rounded px-2 py-1 text-[8px] font-bold uppercase tracking-wider ${entryBadgeClass(currentEntryType)}`}>
                                  {entryLabel(currentEntryType)}
                                </span>
                                <span className="text-[11px] font-medium text-gray-400">{formatDate(session.sessionDate)}</span>
                              </div>

                              <p className="mt-4 whitespace-pre-line text-sm leading-7 text-[#2C2724]">{mainDescription}</p>
                              {hasLegacyExtra && (
                                <p className="mt-3 whitespace-pre-line rounded-sm bg-[#FCFAF6] p-3 text-[12px] leading-6 text-gray-500">
                                  {cleanBodyMeasurements}
                                </p>
                              )}
                            </div>

                            {sessionImages.length > 0 && (
                              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                                {sessionImages.map((imageUrl, index) => (
                                  <div
                                    key={`${session.id}-${index}`}
                                    className="group/image relative aspect-[4/3] overflow-hidden rounded-sm border border-[#ECE7DD] bg-[#F7F2EA]"
                                  >
                                    <img
                                      src={imageUrl}
                                      alt={`Foto da evolução ${session.sessionNumber}`}
                                      loading="lazy"
                                      decoding="async"
                                      className="h-full w-full object-cover transition-transform duration-300 group-hover/image:scale-[1.03]"
                                    />
                                    <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1 bg-gradient-to-t from-black/65 to-transparent p-2 pt-8">
                                      <a
                                        href={imageUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        aria-label="Abrir foto em tamanho original"
                                        className="flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-[#2C2724] shadow-sm"
                                      >
                                        <ExternalLink size={14} />
                                      </a>
                                      <a
                                        href={downloadImageHref(imageUrl, plan, session, index)}
                                        download={isLegacyDataImage(imageUrl) ? `${safeFilePart(patient.name)}-${safeFilePart(plan.treatmentName)}-${index + 1}.jpg` : undefined}
                                        aria-label="Baixar foto"
                                        className="flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-[#5A1F2B] shadow-sm"
                                      >
                                        <Download size={14} />
                                      </a>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="mt-5 flex flex-col gap-3 border-t border-[#F2EEE7] pt-4 sm:flex-row sm:items-center sm:justify-between">
                              <div className="flex flex-wrap items-center gap-3 text-[9px] font-bold uppercase tracking-wider">
                                {session.signedAt ? (
                                  <span className="flex items-center gap-1.5 text-emerald-600">
                                    <CheckCircle2 size={13} /> Paciente ciente • {formatDateTime(session.signedAt)}
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => openAcknowledgement(session)}
                                    className="flex items-center gap-1.5 rounded-sm border border-[#5A1F2B]/20 px-3 py-2 text-[#5A1F2B] transition-colors hover:bg-[#F7F2EA]"
                                  >
                                    <PenLine size={13} /> Paciente dar ciência / visto
                                  </button>
                                )}

                                {contractSignature ? (
                                  <span className="flex items-center gap-1.5 text-emerald-600/75">
                                    <ShieldCheck size={12} /> Contrato assinado
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1.5 text-amber-500/80">
                                    <ShieldCheck size={12} /> Contrato sem assinatura
                                  </span>
                                )}
                              </div>

                              {session.signedAt && session.signatureImage && (
                                <div className="flex items-center gap-2 rounded-sm border border-emerald-100 bg-emerald-50/50 px-3 py-1.5">
                                  <img src={session.signatureImage} alt="Visto da paciente" className="h-7 w-20 object-contain" />
                                  <span className="text-[8px] font-bold uppercase tracking-wider text-emerald-700">Visto registrado</span>
                                </div>
                              )}
                            </div>
                          </article>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </section>
          );
        })}
      </div>

      {legacyStructuredEvolutions.length > 0 && (
        <section className="rounded-sm border border-[#ECE7DD] bg-white p-6 shadow-sm">
          <div>
            <h4 className="font-serif text-lg uppercase tracking-wider text-[#111]">Evoluções anteriores</h4>
            <p className="mt-1 text-[11px] leading-5 text-gray-400">
              Registros criados no modelo antigo foram mantidos somente para consulta; nada foi apagado.
            </p>
          </div>
          <div className="mt-5 space-y-3">
            {legacyStructuredEvolutions.map((item) => {
              const details = [
                item.productUsed ? `Produto: ${item.productUsed}` : null,
                item.batch ? `Lote: ${item.batch}` : null,
                item.bodyArea ? `Região: ${item.bodyArea}` : null,
                item.quantity ? `Quantidade: ${item.quantity}` : null,
                item.complaint ? `Queixa: ${item.complaint}` : null,
                item.clinicalAssessment ? `Avaliação: ${item.clinicalAssessment}` : null,
                item.intercurrences ? `Intercorrências: ${item.intercurrences}` : null,
                item.guidance ? `Orientações: ${item.guidance}` : null,
              ].filter(Boolean);

              return (
                <article key={item.id} className="rounded-sm border border-[#ECE7DD] bg-[#FCFAF6] p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[#5A1F2B]">{formatDate(item.createdAt)}</span>
                    <span className="text-sm font-semibold text-[#2C2724]">{item.procedurePerformed}</span>
                  </div>
                  {details.length > 0 && (
                    <p className="mt-3 whitespace-pre-line text-[12px] leading-6 text-gray-500">{details.join("\n")}</p>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      )}

      {legacyPhotos.length > 0 && (
        <section className="rounded-sm border border-[#ECE7DD] bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-[#F7F2EA] p-2.5 text-[#5A1F2B]">
              <ImageIcon size={18} />
            </div>
            <div>
              <h4 className="font-serif text-lg uppercase tracking-wider text-[#111]">Fotos anteriores</h4>
              <p className="mt-1 text-[11px] leading-5 text-gray-400">
                Imagens que já estavam cadastradas na antiga aba “Antes e Depois” foram preservadas aqui.
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {legacyPhotos.filter((photo) => isReadableImageSource(photo.imageUrl)).map((photo, index) => (
              <article
                key={photo.id}
                className="overflow-hidden rounded-sm border border-[#ECE7DD] bg-[#FCFAF6]"
              >
                <div className="group/image relative aspect-[4/3] overflow-hidden bg-[#F7F2EA]">
                  <img
                    src={photo.imageUrl}
                    alt={photo.title || photo.procedureName || "Foto clínica"}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover/image:scale-[1.03]"
                  />
                  <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1 bg-gradient-to-t from-black/65 to-transparent p-2 pt-8">
                    <a
                      href={photo.imageUrl}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Abrir foto em tamanho original"
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-[#2C2724] shadow-sm"
                    >
                      <ExternalLink size={14} />
                    </a>
                    <a
                      href={legacyPhotoDownloadHref(photo, index)}
                      download={isLegacyDataImage(photo.imageUrl) ? `${safeFilePart(patient.name)}-foto-antiga-${index + 1}.jpg` : undefined}
                      aria-label="Baixar foto"
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-[#5A1F2B] shadow-sm"
                    >
                      <Download size={14} />
                    </a>
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-[#5A1F2B]">{formatDate(photo.takenAt)}</p>
                  <p className="mt-1 truncate text-[11px] text-[#2C2724]">{photo.title || photo.procedureName || "Registro clínico"}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {signingSession && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-[#F7F2EA] shadow-2xl">
            <div className="flex items-start justify-between border-b border-[#E7DED0] bg-white px-5 py-4">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#5A1F2B]/60">Ciência da evolução</p>
                <h3 className="mt-1 font-serif text-xl text-[#1E1A18]">Visto da paciente</h3>
              </div>
              <button
                type="button"
                onClick={() => setSigningSession(null)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#ECE7DD] bg-white text-gray-500"
                aria-label="Fechar"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 sm:p-6">
              <div className="rounded-xl border border-[#E7DED0] bg-white p-4 text-sm leading-6 text-[#4A433F]">
                Eu, <strong>{patient.name}</strong>, declaro que visualizei este registro de evolução, incluindo a data, a descrição e as imagens clínicas vinculadas, e confirmo minha ciência sobre o acompanhamento registrado.
              </div>

              <div className="mt-5 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#5A1F2B]/60">Assine ou dê seu visto abaixo</span>
                <button
                  type="button"
                  onClick={() => signatureRef.current?.clear()}
                  className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-gray-500"
                >
                  <RotateCcw size={12} /> Limpar
                </button>
              </div>

              <div className="mt-2 h-56 overflow-hidden rounded-xl border-2 border-dashed border-[#5A1F2B]/30 bg-white touch-none">
                <SignatureCanvas
                  ref={signatureRef}
                  penColor="#1E1A18"
                  canvasProps={{
                    className: "h-full w-full",
                    width: 900,
                    height: 300,
                  }}
                />
              </div>

              <p className="mt-3 text-[10px] leading-5 text-gray-500">
                Este visto registra ciência deste lançamento específico do prontuário. Ele não substitui o contrato ou os termos de consentimento do procedimento.
              </p>

              <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setSigningSession(null)}
                  className="h-11 border border-[#D8D0C5] bg-white px-5 text-[10px] font-bold uppercase tracking-wider text-gray-600"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={saveAcknowledgement}
                  disabled={signatureSaving}
                  className="flex h-11 items-center justify-center gap-2 bg-[#111] px-6 text-[10px] font-bold uppercase tracking-wider text-white disabled:opacity-50"
                >
                  {signatureSaving ? <Activity size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                  {signatureSaving ? "Registrando…" : "Confirmar ciência"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
