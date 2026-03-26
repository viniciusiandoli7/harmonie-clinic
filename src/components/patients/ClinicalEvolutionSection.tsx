"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Camera,
  ClipboardList,
  Pencil,
  Plus,
  Trash2,
  Upload,
  X,
  FileText,
} from "lucide-react";
import { exportElementToPDF } from "@/lib/exportEvolutionPdf";

type Patient = {
  id: string;
  name: string;
};

type EvolutionSession = {
  id: string;
  sessionNumber: number;
  sessionDate: string;
  performedProcedure?: string | null;
  bodyMeasurements?: string | null;
  clinicalNotes?: string | null;
  patientSignatureName?: string | null;
  signedAt?: string | null;
  imagesJson?: string[] | null;
};

type EvolutionPlan = {
  id: string;
  treatmentName: string;
  packageName?: string | null;
  totalSessions: number;
  completedSessions: number;
  status: "ACTIVE" | "FINISHED" | "CANCELED";
  startDate?: string | null;
  endDate?: string | null;
  goals?: string | null;
  notes?: string | null;
  sessions: EvolutionSession[];
};

type Props = {
  patient: Patient;
};

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("pt-BR");
}

function toLocalInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const mi = pad(date.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function statusPill(status: EvolutionPlan["status"]) {
  if (status === "FINISHED") {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (status === "CANCELED") {
    return "border-gray-200 bg-gray-100 text-gray-700";
  }

  return "border-[#E9DEC9] bg-[#FCFAF6] text-[#C8A35F]";
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#96A4C1]">
      {children}
    </label>
  );
}

async function fileToBase64(file: File) {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ClinicalEvolutionSection({ patient }: Props) {
  const [plans, setPlans] = useState<EvolutionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [treatmentName, setTreatmentName] = useState("");
  const [packageName, setPackageName] = useState("");
  const [totalSessions, setTotalSessions] = useState(1);
  const [goals, setGoals] = useState("");
  const [planNotes, setPlanNotes] = useState("");

  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);

  const [sessionNumber, setSessionNumber] = useState(1);
  const [performedProcedure, setPerformedProcedure] = useState("");
  const [bodyMeasurements, setBodyMeasurements] = useState("");
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [patientSignatureName, setPatientSignatureName] = useState("");
  const [imagesText, setImagesText] = useState("");
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  const [editingSession, setEditingSession] = useState<EvolutionSession | null>(null);
  const [editSessionNumber, setEditSessionNumber] = useState(1);
  const [editSessionDate, setEditSessionDate] = useState("");
  const [editPerformedProcedure, setEditPerformedProcedure] = useState("");
  const [editBodyMeasurements, setEditBodyMeasurements] = useState("");
  const [editClinicalNotes, setEditClinicalNotes] = useState("");
  const [editPatientSignatureName, setEditPatientSignatureName] = useState("");
  const [editImagesText, setEditImagesText] = useState("");
  const [editUploadedImages, setEditUploadedImages] = useState<string[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);
  const [uploadingEditImages, setUploadingEditImages] = useState(false);

  async function loadPlans() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/patients/${patient.id}/evolution`, {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error ?? "Erro ao carregar evolução.");
        return;
      }

      setPlans(Array.isArray(data) ? data : []);
    } catch {
      setError("Erro ao carregar evolução.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPlans();
  }, [patient.id]);

  async function createPlan() {
    if (!treatmentName.trim()) {
      alert("Informe o tratamento.");
      return;
    }

    const res = await fetch(`/api/patients/${patient.id}/evolution`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        treatmentName,
        packageName,
        totalSessions,
        goals,
        notes: planNotes,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data?.error ?? "Erro ao criar plano.");
      return;
    }

    setTreatmentName("");
    setPackageName("");
    setTotalSessions(1);
    setGoals("");
    setPlanNotes("");
    await loadPlans();
    setExpandedPlanId(data.id);
  }

  async function removePlan(planId: string) {
    if (!window.confirm("Excluir este plano de evolução?")) return;

    const res = await fetch(`/api/evolution-plans/${planId}`, {
      method: "DELETE",
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data?.error ?? "Erro ao excluir plano.");
      return;
    }

    await loadPlans();
    if (expandedPlanId === planId) {
      setExpandedPlanId(null);
    }
  }

  async function handleCreateImagesUpload(files: FileList | null) {
    if (!files?.length) return;

    setUploadingImages(true);

    try {
      const converted = await Promise.all(
        Array.from(files).map((file) => fileToBase64(file))
      );
      setUploadedImages((prev) => [...prev, ...converted]);
    } finally {
      setUploadingImages(false);
    }
  }

  async function handleEditImagesUpload(files: FileList | null) {
    if (!files?.length) return;

    setUploadingEditImages(true);

    try {
      const converted = await Promise.all(
        Array.from(files).map((file) => fileToBase64(file))
      );
      setEditUploadedImages((prev) => [...prev, ...converted]);
    } finally {
      setUploadingEditImages(false);
    }
  }

  function removeCreateImage(index: number) {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  }

  function removeEditImage(index: number) {
    setEditUploadedImages((prev) => prev.filter((_, i) => i !== index));
  }

  async function createSession(planId: string) {
    const manualImages = imagesText
      .split("\n")
      .map((value) => value.trim())
      .filter(Boolean);

    const images = [...manualImages, ...uploadedImages];

    const res = await fetch(`/api/evolution-plans/${planId}/sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sessionNumber,
        performedProcedure,
        bodyMeasurements,
        clinicalNotes,
        patientSignatureName,
        images,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data?.error ?? "Erro ao criar sessão.");
      return;
    }

    setPerformedProcedure("");
    setBodyMeasurements("");
    setClinicalNotes("");
    setPatientSignatureName("");
    setImagesText("");
    setUploadedImages([]);
    await loadPlans();
  }

  async function removeSession(sessionId: string) {
    if (!window.confirm("Excluir esta sessão?")) return;

    const res = await fetch(`/api/evolution-sessions/${sessionId}`, {
      method: "DELETE",
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data?.error ?? "Erro ao excluir sessão.");
      return;
    }

    await loadPlans();
  }

  function openEditSession(session: EvolutionSession) {
    const currentImages = Array.isArray(session.imagesJson) ? session.imagesJson : [];

    setEditingSession(session);
    setEditSessionNumber(session.sessionNumber);
    setEditSessionDate(
      session.sessionDate
        ? toLocalInputValue(new Date(session.sessionDate))
        : toLocalInputValue(new Date())
    );
    setEditPerformedProcedure(session.performedProcedure ?? "");
    setEditBodyMeasurements(session.bodyMeasurements ?? "");
    setEditClinicalNotes(session.clinicalNotes ?? "");
    setEditPatientSignatureName(session.patientSignatureName ?? "");
    setEditImagesText("");
    setEditUploadedImages(currentImages);
  }

  async function saveEditedSession() {
    if (!editingSession) return;

    setSavingEdit(true);

    try {
      const manualImages = editImagesText
        .split("\n")
        .map((value) => value.trim())
        .filter(Boolean);

      const images = [...editUploadedImages, ...manualImages];

      const res = await fetch(`/api/evolution-sessions/${editingSession.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionNumber: editSessionNumber,
          sessionDate: new Date(editSessionDate).toISOString(),
          performedProcedure: editPerformedProcedure,
          bodyMeasurements: editBodyMeasurements,
          clinicalNotes: editClinicalNotes,
          patientSignatureName: editPatientSignatureName,
          images,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data?.error ?? "Erro ao salvar sessão.");
        return;
      }

      setEditingSession(null);
      setEditUploadedImages([]);
      setEditImagesText("");
      await loadPlans();
    } finally {
      setSavingEdit(false);
    }
  }

  const activePlan = useMemo(
    () => plans.find((plan) => plan.id === expandedPlanId) ?? null,
    [plans, expandedPlanId]
  );

  useEffect(() => {
    if (!activePlan) return;
    setSessionNumber((activePlan.completedSessions || 0) + 1);
  }, [activePlan]);

  return (
    <>
      <section className="overflow-hidden border border-[#ECE7DD] bg-white shadow-sm">
        <div className="border-b border-[#ECE7DD] bg-[#FCFAF6] px-6 py-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.32em] text-[#C8A35F]">
                Evolução clínica
              </p>
              <h3
                className="mt-2 text-[30px] leading-none text-[#111111]"
                style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
              >
                Sessões e acompanhamento
              </h3>
              <p className="mt-2 text-sm text-[#64748B]">
                Controle de pacotes, medidas, fotos e visto do paciente.
              </p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center border border-[#E9DEC9] bg-white text-[#C8A35F]">
              <Activity size={18} />
            </div>
          </div>
        </div>

        <div className="p-6">
          {error ? (
            <div className="mb-5 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="border border-[#ECE7DD] bg-[#FCFAF6] p-5">
            <h4 className="text-sm font-semibold text-[#111111]">Novo plano / pacote</h4>

            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="xl:col-span-2">
                <FieldLabel>Tratamento</FieldLabel>
                <input
                  value={treatmentName}
                  onChange={(e) => setTreatmentName(e.target.value)}
                  className="h-11 w-full border border-[#ECE7DD] bg-white px-3 outline-none"
                  placeholder="Ex.: Ultrassom micro e macrofocado"
                />
              </div>

              <div>
                <FieldLabel>Pacote</FieldLabel>
                <input
                  value={packageName}
                  onChange={(e) => setPackageName(e.target.value)}
                  className="h-11 w-full border border-[#ECE7DD] bg-white px-3 outline-none"
                  placeholder="Ex.: Pacote corporal"
                />
              </div>

              <div>
                <FieldLabel>Total de sessões</FieldLabel>
                <input
                  type="number"
                  min="1"
                  value={totalSessions}
                  onChange={(e) => setTotalSessions(Number(e.target.value || 1))}
                  className="h-11 w-full border border-[#ECE7DD] bg-white px-3 outline-none"
                />
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <FieldLabel>Objetivos</FieldLabel>
                <textarea
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                  className="min-h-[100px] w-full border border-[#ECE7DD] bg-white p-3 outline-none"
                />
              </div>

              <div>
                <FieldLabel>Observações do plano</FieldLabel>
                <textarea
                  value={planNotes}
                  onChange={(e) => setPlanNotes(e.target.value)}
                  className="min-h-[100px] w-full border border-[#ECE7DD] bg-white p-3 outline-none"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={createPlan}
              className="mt-4 inline-flex h-11 items-center justify-center gap-2 bg-[#111111] px-5 text-sm font-semibold text-white"
            >
              <Plus size={15} />
              Criar plano
            </button>
          </div>

          <div className="mt-6 space-y-4">
            {loading ? (
              <div className="text-sm text-gray-500">Carregando evolução...</div>
            ) : plans.length === 0 ? (
              <div className="text-sm text-gray-500">Nenhum plano cadastrado.</div>
            ) : (
              plans.map((plan) => {
                const remaining = Math.max(0, plan.totalSessions - plan.completedSessions);

                return (
                  <div key={plan.id} className="border border-[#ECE7DD] bg-white">
                    <div className="flex flex-col gap-4 border-b border-[#ECE7DD] bg-white px-5 py-5 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h4
                            className="text-[24px] leading-none text-[#111111]"
                            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                          >
                            {plan.treatmentName}
                          </h4>

                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${statusPill(
                              plan.status
                            )}`}
                          >
                            {plan.status}
                          </span>
                        </div>

                        <div className="mt-2 text-sm text-[#64748B]">
                          {plan.packageName || "Sem nome de pacote"}
                        </div>

                        <div className="mt-3 flex flex-wrap gap-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#96A4C1]">
                          <span>Total: {plan.totalSessions}</span>
                          <span>Realizadas: {plan.completedSessions}</span>
                          <span>Restantes: {remaining}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            exportElementToPDF(
                              `evolution-plan-${plan.id}`,
                              `evolucao-${patient.name}-${plan.treatmentName}.pdf`
                            )
                          }
                          className="inline-flex h-10 items-center justify-center gap-2 border border-[#C8A35F] px-4 text-sm font-medium text-[#C8A35F] hover:bg-[#FCFAF6]"
                        >
                          <FileText size={14} />
                          Exportar PDF
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setExpandedPlanId(expandedPlanId === plan.id ? null : plan.id)
                          }
                          className="h-10 border border-[#ECE7DD] px-4 text-sm font-medium text-[#111111] hover:bg-gray-50"
                        >
                          {expandedPlanId === plan.id ? "Fechar" : "Abrir"}
                        </button>

                        <button
                          type="button"
                          onClick={() => removePlan(plan.id)}
                          className="h-10 border border-red-200 px-4 text-sm font-medium text-red-700 hover:bg-red-50"
                        >
                          Excluir plano
                        </button>
                      </div>
                    </div>

                    {expandedPlanId === plan.id ? (
                      <div id={`evolution-plan-${plan.id}`} className="p-5">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="border border-[#F2EEE7] bg-[#FCFAF6] p-4">
                            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#96A4C1]">
                              Objetivos
                            </div>
                            <div className="mt-2 whitespace-pre-line text-sm text-gray-700">
                              {plan.goals || "Não informados"}
                            </div>
                          </div>

                          <div className="border border-[#F2EEE7] bg-[#FCFAF6] p-4">
                            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#96A4C1]">
                              Observações do plano
                            </div>
                            <div className="mt-2 whitespace-pre-line text-sm text-gray-700">
                              {plan.notes || "Sem observações"}
                            </div>
                          </div>
                        </div>

                        <div className="mt-6 border border-[#ECE7DD] bg-[#FCFAF6] p-5">
                          <div className="flex items-center gap-2 text-sm font-semibold text-[#111111]">
                            <ClipboardList size={16} />
                            Nova sessão
                          </div>

                          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            <div>
                              <FieldLabel>Nº da sessão</FieldLabel>
                              <input
                                type="number"
                                min="1"
                                value={sessionNumber}
                                onChange={(e) => setSessionNumber(Number(e.target.value || 1))}
                                className="h-11 w-full border border-[#ECE7DD] bg-white px-3 outline-none"
                              />
                            </div>

                            <div className="md:col-span-1 xl:col-span-3">
                              <FieldLabel>Procedimento realizado</FieldLabel>
                              <input
                                value={performedProcedure}
                                onChange={(e) => setPerformedProcedure(e.target.value)}
                                className="h-11 w-full border border-[#ECE7DD] bg-white px-3 outline-none"
                                placeholder="Ex.: sessão 1, ultrassom, drenagem..."
                              />
                            </div>
                          </div>

                          <div className="mt-4 grid gap-4 md:grid-cols-2">
                            <div>
                              <FieldLabel>Medidas / evolução corporal</FieldLabel>
                              <textarea
                                value={bodyMeasurements}
                                onChange={(e) => setBodyMeasurements(e.target.value)}
                                className="min-h-[110px] w-full border border-[#ECE7DD] bg-white p-3 outline-none"
                                placeholder="Ex.: abdômen 82cm, coxa 54cm..."
                              />
                            </div>

                            <div>
                              <FieldLabel>Observações clínicas</FieldLabel>
                              <textarea
                                value={clinicalNotes}
                                onChange={(e) => setClinicalNotes(e.target.value)}
                                className="min-h-[110px] w-full border border-[#ECE7DD] bg-white p-3 outline-none"
                                placeholder="Ex.: edema reduzido, melhora de textura..."
                              />
                            </div>
                          </div>

                          <div className="mt-4 grid gap-4 md:grid-cols-2">
                            <div>
                              <FieldLabel>Upload de fotos</FieldLabel>

                              <label className="flex h-11 cursor-pointer items-center justify-center gap-2 border border-dashed border-[#C8A35F]/50 bg-white px-4 text-sm font-medium text-[#C8A35F] hover:bg-[#FCFAF6]">
                                <Upload size={15} />
                                {uploadingImages ? "Enviando..." : "Selecionar imagens"}
                                <input
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  className="hidden"
                                  onChange={(e) => handleCreateImagesUpload(e.target.files)}
                                />
                              </label>

                              {uploadedImages.length > 0 ? (
                                <div className="mt-3 grid grid-cols-2 gap-3">
                                  {uploadedImages.map((image, index) => (
                                    <div
                                      key={`create-image-${index}`}
                                      className="relative overflow-hidden border border-[#ECE7DD] bg-white"
                                    >
                                      <img
                                        src={image}
                                        alt={`Upload ${index + 1}`}
                                        className="h-28 w-full object-cover"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => removeCreateImage(index)}
                                        className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white"
                                      >
                                        <X size={14} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              ) : null}

                              <div className="mt-4">
                                <FieldLabel>Ou URLs das fotos</FieldLabel>
                                <textarea
                                  value={imagesText}
                                  onChange={(e) => setImagesText(e.target.value)}
                                  className="min-h-[110px] w-full border border-[#ECE7DD] bg-white p-3 outline-none"
                                  placeholder="Uma URL por linha"
                                />
                              </div>
                            </div>

                            <div>
                              <FieldLabel>Visto / assinatura do paciente</FieldLabel>
                              <input
                                value={patientSignatureName}
                                onChange={(e) => setPatientSignatureName(e.target.value)}
                                className="h-11 w-full border border-[#ECE7DD] bg-white px-3 outline-none"
                                placeholder="Nome do paciente"
                              />

                              <button
                                type="button"
                                onClick={() => createSession(plan.id)}
                                className="mt-4 inline-flex h-11 items-center justify-center gap-2 bg-[#111111] px-5 text-sm font-semibold text-white"
                              >
                                <Plus size={15} />
                                Salvar sessão
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="mt-6 space-y-4">
                          {plan.sessions.length === 0 ? (
                            <div className="text-sm text-gray-500">
                              Nenhuma sessão registrada.
                            </div>
                          ) : (
                            plan.sessions.map((session) => {
                              const images = Array.isArray(session.imagesJson)
                                ? session.imagesJson
                                : [];

                              return (
                                <div
                                  key={session.id}
                                  className="border border-[#ECE7DD] bg-white p-5"
                                >
                                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                    <div className="min-w-0 flex-1">
                                      <div className="flex flex-wrap items-center gap-3">
                                        <h5
                                          className="text-[22px] leading-none text-[#111111]"
                                          style={{
                                            fontFamily:
                                              'Georgia, "Times New Roman", serif',
                                          }}
                                        >
                                          Sessão {session.sessionNumber}
                                        </h5>

                                        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#96A4C1]">
                                          {formatDate(session.sessionDate)}
                                        </span>
                                      </div>

                                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                                        <div className="border border-[#F2EEE7] bg-[#FCFAF6] p-4">
                                          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#96A4C1]">
                                            Procedimento
                                          </div>
                                          <div className="mt-2 text-sm text-gray-700">
                                            {session.performedProcedure || "Não informado"}
                                          </div>
                                        </div>

                                        <div className="border border-[#F2EEE7] bg-[#FCFAF6] p-4">
                                          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#96A4C1]">
                                            Visto do paciente
                                          </div>
                                          <div className="mt-2 text-sm text-gray-700">
                                            {session.patientSignatureName || "Não assinado"}
                                          </div>
                                        </div>

                                        <div className="border border-[#F2EEE7] bg-[#FCFAF6] p-4">
                                          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#96A4C1]">
                                            Medidas
                                          </div>
                                          <div className="mt-2 whitespace-pre-line text-sm text-gray-700">
                                            {session.bodyMeasurements || "Não informadas"}
                                          </div>
                                        </div>

                                        <div className="border border-[#F2EEE7] bg-[#FCFAF6] p-4">
                                          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#96A4C1]">
                                            Observações
                                          </div>
                                          <div className="mt-2 whitespace-pre-line text-sm text-gray-700">
                                            {session.clinicalNotes || "Sem observações"}
                                          </div>
                                        </div>
                                      </div>

                                      {images.length > 0 ? (
                                        <div className="mt-4">
                                          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#111111]">
                                            <Camera size={15} />
                                            Fotos da sessão
                                          </div>

                                          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                                            {images.map((image, index) => (
                                              <a
                                                key={`${session.id}-${index}`}
                                                href={image}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="overflow-hidden border border-[#ECE7DD] bg-gray-50"
                                              >
                                                <img
                                                  src={image}
                                                  alt={`Sessão ${session.sessionNumber} - foto ${index + 1}`}
                                                  className="h-44 w-full object-cover"
                                                />
                                              </a>
                                            ))}
                                          </div>
                                        </div>
                                      ) : null}
                                    </div>

                                    <div className="flex flex-row gap-2 md:flex-col">
                                      <button
                                        type="button"
                                        onClick={() => openEditSession(session)}
                                        className="inline-flex items-center gap-2 border border-[#ECE7DD] px-4 py-2 text-sm text-[#111111] hover:bg-gray-50"
                                      >
                                        <Pencil size={14} />
                                        Editar
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => removeSession(session.id)}
                                        className="inline-flex items-center gap-2 border border-red-200 px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                                      >
                                        <Trash2 size={14} />
                                        Excluir
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      {editingSession ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl border border-[#ECE7DD] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#ECE7DD] bg-[#FCFAF6] px-6 py-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.28em] text-[#C8A35F]">
                  Evolução clínica
                </p>
                <h3 className="mt-1 text-xl font-semibold text-[#111111]">
                  Editar sessão
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setEditingSession(null)}
                className="inline-flex h-10 w-10 items-center justify-center border border-[#ECE7DD] text-[#111111] hover:bg-gray-50"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4 p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <FieldLabel>Nº da sessão</FieldLabel>
                  <input
                    type="number"
                    min="1"
                    value={editSessionNumber}
                    onChange={(e) =>
                      setEditSessionNumber(Number(e.target.value || 1))
                    }
                    className="h-11 w-full border border-[#ECE7DD] px-3 outline-none"
                  />
                </div>

                <div>
                  <FieldLabel>Data da sessão</FieldLabel>
                  <input
                    type="datetime-local"
                    value={editSessionDate}
                    onChange={(e) => setEditSessionDate(e.target.value)}
                    className="h-11 w-full border border-[#ECE7DD] px-3 outline-none"
                  />
                </div>
              </div>

              <div>
                <FieldLabel>Procedimento realizado</FieldLabel>
                <input
                  value={editPerformedProcedure}
                  onChange={(e) => setEditPerformedProcedure(e.target.value)}
                  className="h-11 w-full border border-[#ECE7DD] px-3 outline-none"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <FieldLabel>Medidas</FieldLabel>
                  <textarea
                    value={editBodyMeasurements}
                    onChange={(e) => setEditBodyMeasurements(e.target.value)}
                    className="min-h-[110px] w-full border border-[#ECE7DD] p-3 outline-none"
                  />
                </div>

                <div>
                  <FieldLabel>Observações clínicas</FieldLabel>
                  <textarea
                    value={editClinicalNotes}
                    onChange={(e) => setEditClinicalNotes(e.target.value)}
                    className="min-h-[110px] w-full border border-[#ECE7DD] p-3 outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <FieldLabel>Visto / assinatura do paciente</FieldLabel>
                  <input
                    value={editPatientSignatureName}
                    onChange={(e) => setEditPatientSignatureName(e.target.value)}
                    className="h-11 w-full border border-[#ECE7DD] px-3 outline-none"
                  />
                </div>

                <div>
                  <FieldLabel>Upload de fotos</FieldLabel>

                  <label className="flex h-11 cursor-pointer items-center justify-center gap-2 border border-dashed border-[#C8A35F]/50 px-4 text-sm font-medium text-[#C8A35F] hover:bg-[#FCFAF6]">
                    <Upload size={15} />
                    {uploadingEditImages ? "Enviando..." : "Selecionar imagens"}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => handleEditImagesUpload(e.target.files)}
                    />
                  </label>
                </div>
              </div>

              {editUploadedImages.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {editUploadedImages.map((image, index) => (
                    <div
                      key={`edit-image-${index}`}
                      className="relative overflow-hidden border border-[#ECE7DD] bg-white"
                    >
                      <img
                        src={image}
                        alt={`Imagem ${index + 1}`}
                        className="h-28 w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeEditImage(index)}
                        className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}

              <div>
                <FieldLabel>Ou URLs das fotos</FieldLabel>
                <textarea
                  value={editImagesText}
                  onChange={(e) => setEditImagesText(e.target.value)}
                  className="min-h-[110px] w-full border border-[#ECE7DD] p-3 outline-none"
                  placeholder="Uma URL por linha"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingSession(null)}
                  className="h-11 border border-[#ECE7DD] px-5 text-sm font-medium text-[#111111] hover:bg-gray-50"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={saveEditedSession}
                  disabled={savingEdit}
                  className="h-11 bg-[#111111] px-5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {savingEdit ? "Salvando..." : "Salvar alterações"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}