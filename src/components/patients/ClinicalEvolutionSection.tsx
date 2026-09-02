"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  Activity,
  CalendarDays,
  Camera,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  Plus,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";

type Patient = { id: string; name: string; phone?: string | null };

type EvolutionSession = {
  id: string;
  sessionNumber: number;
  sessionDate: string;
  performedProcedure?: string | null;
  bodyMeasurements?: string | null;
  clinicalNotes?: string | null;
  imagesJson?: unknown;
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

function parseImages(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && /^https:\/\//i.test(item));
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed)
        ? parsed.filter((item): item is string => typeof item === "string" && /^https:\/\//i.test(item))
        : [];
    } catch {
      return [];
    }
  }
  return [];
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
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [saving, setSaving] = useState(false);

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

  function resetForm() {
    setSessionDate(localDateInputValue());
    setDescription("");
    setUploadedImages([]);
  }

  function togglePlan(planId: string) {
    setExpandedPlanId((current) => {
      const next = current === planId ? null : planId;
      if (next) resetForm();
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
      // Upload sequencial evita estourar memória/rede no iPad quando várias fotos
      // de alta resolução são selecionadas ao mesmo tempo.
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
      alert("Informe a data do atendimento.");
      return;
    }
    if (!cleanDescription) {
      alert("Descreva o que foi realizado no atendimento.");
      return;
    }
    if (uploadingImages) {
      alert("Aguarde o envio das fotos terminar antes de salvar.");
      return;
    }

    setSaving(true);
    try {
      const nextSessionNumber = Math.max(plan.completedSessions, plan.sessions?.length || 0) + 1;
      const res = await fetch(`/api/evolution-plans/${plan.id}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionNumber: nextSessionNumber,
          // Meio-dia UTC evita a data aparecer como o dia anterior no Brasil.
          sessionDate: `${sessionDate}T12:00:00.000Z`,
          performedProcedure: plan.treatmentName,
          clinicalNotes: cleanDescription,
          images: uploadedImages,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || "Não foi possível salvar a evolução.");
      }

      resetForm();
      await loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível salvar a evolução.";
      alert(message);
    } finally {
      setSaving(false);
    }
  }

  async function removeSession(sessionId: string) {
    if (!window.confirm("Excluir este registro de evolução?")) return;
    const res = await fetch(`/api/evolution-sessions/${sessionId}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      alert(data?.error || "Não foi possível excluir o registro.");
      return;
    }
    await loadData();
  }

  async function removePlan(planId: string) {
    if (!window.confirm("Excluir este prontuário e todos os registros vinculados a ele?")) return;
    const res = await fetch(`/api/evolution-plans/${planId}`, { method: "DELETE" });
    if (!res.ok) {
      alert("Não foi possível excluir o prontuário.");
      return;
    }
    if (expandedPlanId === planId) setExpandedPlanId(null);
    await loadData();
  }

  function handleExportPDF(plan: EvolutionPlan) {
    const element = document.getElementById(`evolution-plan-${plan.id}`);
    if (!element) return;

    const printWindow = window.open("", "", "width=900,height=800");
    printWindow?.document.write(`
      <html>
        <head>
          <title>Evolução clínica</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #1E1A18; }
            .no-print, button, input, textarea, label[for] { display: none !important; }
            img { max-width: 180px; max-height: 180px; object-fit: cover; margin: 6px; }
          </style>
        </head>
        <body>
          <h1 style="font-size:12px;text-transform:uppercase;color:#5A1F2B;">Harmonie Clinic</h1>
          <h2 style="font-size:22px;">Evolução clínica — ${patient.name}</h2>
          ${element.innerHTML}
        </body>
      </html>
    `);
    printWindow?.document.close();
    setTimeout(() => {
      printWindow?.print();
      printWindow?.close();
    }, 700);
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
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5B3A2E]/60">
              Um registro simples por atendimento: data, descrição do que foi realizado e fotos clínicas no mesmo lugar.
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
        {plans.map((plan) => (
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
                  {plan.packageName ? ` • ${plan.packageName}` : ""}
                </p>
              </div>

              <div className="no-print flex flex-wrap gap-2">
                <button
                  onClick={() => handleExportPDF(plan)}
                  className="flex h-9 items-center gap-2 border border-[#C8A35F] px-4 text-[10px] font-bold uppercase text-[#C8A35F] transition-colors hover:bg-[#FAF8F3]"
                >
                  <FileText size={14} /> PDF
                </button>
                <button
                  onClick={() => togglePlan(plan.id)}
                  className={`h-9 px-5 text-[10px] font-bold uppercase tracking-wider shadow-sm transition-all ${
                    expandedPlanId === plan.id
                      ? "bg-gray-100 text-gray-600"
                      : "bg-[#111] text-white hover:bg-[#5A1F2B]"
                  }`}
                >
                  {expandedPlanId === plan.id ? "Fechar" : "Nova evolução"}
                </button>
                <button
                  onClick={() => removePlan(plan.id)}
                  aria-label="Excluir prontuário"
                  className="h-9 border border-red-50 px-2 text-red-200 transition-colors hover:text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {expandedPlanId === plan.id && (
              <div className="animate-in fade-in duration-300">
                <div className="no-print border-b border-[#ECE7DD] bg-[#FAF8F3] p-6">
                  <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
                    <div>
                      <FieldLabel>Data do atendimento</FieldLabel>
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
                      <FieldLabel>Descrição do que foi realizado</FieldLabel>
                      <textarea
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        placeholder="Ex.: realizada aplicação de toxina em terço superior, paciente sem intercorrências…"
                        className="min-h-28 w-full resize-y border border-[#ECE7DD] bg-white p-3 text-sm leading-6 outline-none transition-colors focus:border-[#C8A35F]"
                      />
                    </div>
                  </div>

                  <div className="mt-6">
                    <FieldLabel>Fotos do atendimento</FieldLabel>
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
                      <span className="text-[11px] text-gray-400">Você pode selecionar várias imagens de uma vez.</span>
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
                              className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100"
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
                      Este registro será salvo como a evolução nº {Math.max(plan.completedSessions, plan.sessions?.length || 0) + 1} deste procedimento.
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
                      const mainDescription = session.clinicalNotes || session.bodyMeasurements || session.performedProcedure || "Registro clínico";
                      const hasLegacyExtra = Boolean(
                        session.bodyMeasurements &&
                          session.clinicalNotes &&
                          !session.clinicalNotes.includes(session.bodyMeasurements)
                      );

                      return (
                        <article key={session.id} className="group relative rounded-sm border border-[#ECE7DD] bg-white p-5">
                          <button
                            onClick={() => removeSession(session.id)}
                            aria-label="Excluir evolução"
                            className="no-print absolute right-4 top-4 text-gray-200 opacity-100 transition-all hover:text-red-500 md:opacity-0 md:group-hover:opacity-100"
                          >
                            <Trash2 size={15} />
                          </button>

                          <div className="pr-8">
                            <div className="flex flex-wrap items-center gap-3">
                              <span className="rounded bg-[#F7F2EA] px-2 py-1 text-[9px] font-black uppercase tracking-wider text-[#5A1F2B]">
                                Evolução {session.sessionNumber}
                              </span>
                              <span className="text-[11px] font-medium text-gray-400">{formatDate(session.sessionDate)}</span>
                            </div>

                            <p className="mt-4 whitespace-pre-line text-sm leading-7 text-[#2C2724]">{mainDescription}</p>
                            {hasLegacyExtra && (
                              <p className="mt-3 whitespace-pre-line rounded-sm bg-[#FCFAF6] p-3 text-[12px] leading-6 text-gray-500">
                                {session.bodyMeasurements}
                              </p>
                            )}
                          </div>

                          {sessionImages.length > 0 && (
                            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                              {sessionImages.map((imageUrl, index) => (
                                <a
                                  key={`${session.id}-${index}`}
                                  href={imageUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="group/image relative aspect-[4/3] overflow-hidden rounded-sm border border-[#ECE7DD] bg-[#F7F2EA]"
                                >
                                  <img
                                    src={imageUrl}
                                    alt={`Foto da evolução ${session.sessionNumber}`}
                                    loading="lazy"
                                    decoding="async"
                                    className="h-full w-full object-cover transition-transform duration-300 group-hover/image:scale-[1.03]"
                                  />
                                </a>
                              ))}
                            </div>
                          )}

                          <div className="mt-5 flex items-center gap-2 border-t border-[#F2EEE7] pt-4 text-[9px] font-bold uppercase tracking-wider">
                            {contractSignature ? (
                              <span className="flex items-center gap-1.5 text-emerald-600">
                                <CheckCircle2 size={12} /> Contrato da paciente assinado
                              </span>
                            ) : (
                              <span className="flex items-center gap-1.5 text-amber-500">
                                <ShieldCheck size={12} /> Contrato ainda sem assinatura
                              </span>
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
        ))}
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
            {legacyPhotos.map((photo) => (
              <a
                key={photo.id}
                href={photo.imageUrl}
                target="_blank"
                rel="noreferrer"
                className="group overflow-hidden rounded-sm border border-[#ECE7DD] bg-[#FCFAF6]"
              >
                <div className="aspect-[4/3] overflow-hidden bg-[#F7F2EA]">
                  <img
                    src={photo.imageUrl}
                    alt={photo.title || photo.procedureName || "Foto clínica"}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="p-3">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-[#5A1F2B]">{formatDate(photo.takenAt)}</p>
                  <p className="mt-1 truncate text-[11px] text-[#2C2724]">{photo.title || photo.procedureName || "Registro clínico"}</p>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
