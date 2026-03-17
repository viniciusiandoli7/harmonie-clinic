"use client";

import { useEffect, useMemo, useState } from "react";

type Patient = { id: string; name: string; email: string };
type AppointmentStatus = "SCHEDULED" | "COMPLETED" | "CANCELED";
type PaymentStatus = "PENDING" | "PAID" | "CANCELED";

type Appointment = {
  id: string;
  date: string;
  status: AppointmentStatus;
  patientId: string;
  patient?: Patient;
  durationMinutes?: 30 | 60;
  notes?: string | null;
  procedureName?: string | null;
  price?: number | null;
  paymentStatus?: PaymentStatus;
};

type BlockedTime = {
  id: string;
  start: string;
  end: string;
  reason?: string | null;
};

const START_HOUR = 8;
const END_HOUR = 19;
const STEP_MIN = 30;

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function startOfDayISO(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString();
}

function endOfDayISO(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x.toISOString();
}

function fmtDayLabel(d: Date) {
  return d.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function toLocalInputValue(date: Date) {
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const mi = pad(date.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function makeSlotsForDay(day: Date) {
  const slots: { label: string; start: Date }[] = [];
  const d = new Date(day);
  d.setHours(START_HOUR, 0, 0, 0);

  const end = new Date(day);
  end.setHours(END_HOUR, 0, 0, 0);

  while (d <= end) {
    slots.push({ label: `${pad(d.getHours())}:${pad(d.getMinutes())}`, start: new Date(d) });
    d.setMinutes(d.getMinutes() + STEP_MIN);
  }
  return slots;
}

function sameSlot(slotStart: Date, apptDate: Date) {
  const s = new Date(slotStart);
  const e = new Date(slotStart);
  e.setMinutes(e.getMinutes() + STEP_MIN);
  return apptDate >= s && apptDate < e;
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function rangesOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && bStart < aEnd;
}

function getWeekDays(baseDate: Date) {
  const start = new Date(baseDate);
  start.setHours(0, 0, 0, 0);

  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1);
  start.setDate(diff);

  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function statusBadgeClasses(status: AppointmentStatus) {
  if (status === "COMPLETED") return "bg-green-100 text-green-800 border-green-200";
  if (status === "CANCELED") return "bg-gray-100 text-gray-700 border-gray-200";
  return "bg-yellow-100 text-yellow-800 border-yellow-200";
}

function paymentBadgeClasses(status: PaymentStatus) {
  if (status === "PAID") return "bg-green-100 text-green-800 border-green-200";
  if (status === "CANCELED") return "bg-gray-100 text-gray-700 border-gray-200";
  return "bg-orange-100 text-orange-800 border-orange-200";
}

function formatBlockedRange(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);

  return `${s.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  })} ${s.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })} - ${e.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

function formatPrice(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) return "";
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function AppointmentsPage() {
  const [viewMode, setViewMode] = useState<"day" | "week">("day");

  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");

  const [day, setDay] = useState<Date>(() => new Date());
  const [statusFilter, setStatusFilter] = useState<"" | AppointmentStatus>("");

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([]);
  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [patientSearch, setPatientSearch] = useState("");
  const [agendaPatientFilter, setAgendaPatientFilter] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalPatientId, setModalPatientId] = useState<string>("");
  const [modalDate, setModalDate] = useState<string>(toLocalInputValue(new Date()));
  const [modalStatus, setModalStatus] = useState<AppointmentStatus>("SCHEDULED");
  const [modalDurationMinutes, setModalDurationMinutes] = useState<30 | 60>(30);
  const [modalNotes, setModalNotes] = useState<string>("");
  const [modalProcedureName, setModalProcedureName] = useState<string>("");
  const [modalPrice, setModalPrice] = useState<string>("");
  const [modalPaymentStatus, setModalPaymentStatus] = useState<PaymentStatus>("PENDING");

  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [blockStart, setBlockStart] = useState("");
  const [blockEnd, setBlockEnd] = useState("");
  const [blockReason, setBlockReason] = useState("");

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [hoverWeekDayIso, setHoverWeekDayIso] = useState<string | null>(null);
  const [hoverSlotLabel, setHoverSlotLabel] = useState<string | null>(null);

  function showMsg(type: "success" | "error", text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 2500);
  }

  const selectedPatient = useMemo(
    () => patients.find((p) => p.id === selectedPatientId),
    [patients, selectedPatientId]
  );

  const filteredPatients = useMemo(() => {
    const term = patientSearch.trim().toLowerCase();
    if (!term) return patients;

    return patients.filter((p) => {
      return p.name.toLowerCase().includes(term) || p.email.toLowerCase().includes(term);
    });
  }, [patients, patientSearch]);

  const visibleAppointments = useMemo(() => {
    if (!agendaPatientFilter) return appointments;
    return appointments.filter((a) => a.patientId === agendaPatientFilter);
  }, [appointments, agendaPatientFilter]);

  const slots = useMemo(() => makeSlotsForDay(day), [day]);
  const weekDays = useMemo(() => getWeekDays(day), [day]);

  function getRangeForCurrentView() {
    if (viewMode === "week") {
      const start = new Date(weekDays[0]);
      start.setHours(0, 0, 0, 0);
      const end = new Date(weekDays[6]);
      end.setHours(23, 59, 59, 999);
      return { dateFrom: start.toISOString(), dateTo: end.toISOString() };
    }
    return { dateFrom: startOfDayISO(day), dateTo: endOfDayISO(day) };
  }

  const blockedInfoBySlot = useMemo(() => {
    const map = new Map<string, { blocked: boolean; reason?: string | null }>();

    for (const s of slots) {
      const slotStart = s.start;
      const slotEnd = addMinutes(slotStart, STEP_MIN);

      const conflict = blockedTimes.find((b) => {
        const bStart = new Date(b.start);
        const bEnd = new Date(b.end);
        return rangesOverlap(slotStart, slotEnd, bStart, bEnd);
      });

      map.set(s.label, {
        blocked: !!conflict,
        reason: conflict?.reason ?? null,
      });
    }

    return map;
  }, [blockedTimes, slots]);

  const dayLayout = useMemo(() => {
    type Block = {
      appt: Appointment;
      startIdx: number;
      span: number;
    };

    const blockedByActive = Array(slots.length).fill(false) as boolean[];
    const hasBlockStarting = Array(slots.length).fill(false) as boolean[][];
    const blocks: Block[] = [];

    for (const a of visibleAppointments) {
      const start = new Date(a.date);
      const dur = (a.durationMinutes ?? 30) as 30 | 60;
      const span = Math.max(1, Math.round(dur / STEP_MIN));

      const startIdx = slots.findIndex((s) => sameSlot(s.start, start));
      if (startIdx < 0) continue;

      blocks.push({ appt: a, startIdx, span });
      (hasBlockStarting as unknown as boolean[])[startIdx] = true;

      if (a.status !== "CANCELED") {
        for (let k = 0; k < span; k++) {
          const idx = startIdx + k;
          if (idx >= 0 && idx < blockedByActive.length) blockedByActive[idx] = true;
        }
      }
    }

    blocks.sort((x, y) => new Date(x.appt.date).getTime() - new Date(y.appt.date).getTime());

    const flatHasBlockStarting = hasBlockStarting as unknown as boolean[];
    const isContinuation = blockedByActive.map((blocked, idx) => blocked && !flatHasBlockStarting[idx]);

    return { blocks, blockedByActive, isContinuation, hasBlockStarting: flatHasBlockStarting };
  }, [visibleAppointments, slots]);

  async function loadPatients() {
    try {
      const res = await fetch("/api/patients", { cache: "no-store" });
      const data = await res.json();
      if (Array.isArray(data)) {
        setPatients(data);
        if (!selectedPatientId && data.length > 0) setSelectedPatientId(data[0].id);
      } else {
        setPatients([]);
      }
    } catch {
      showMsg("error", "Erro ao carregar pacientes.");
    }
  }

  async function loadAppointmentsByRange() {
    setLoading(true);
    try {
      const { dateFrom, dateTo } = getRangeForCurrentView();

      const apptQs = new URLSearchParams();
      apptQs.set("dateFrom", dateFrom);
      apptQs.set("dateTo", dateTo);
      if (statusFilter) apptQs.set("status", statusFilter);

      const blockedQs = new URLSearchParams();
      blockedQs.set("dateFrom", dateFrom);
      blockedQs.set("dateTo", dateTo);

      const [apptRes, blockedRes] = await Promise.all([
        fetch(`/api/appointments?${apptQs.toString()}`, { cache: "no-store" }),
        fetch(`/api/blocked-times?${blockedQs.toString()}`, { cache: "no-store" }),
      ]);

      const apptData = await apptRes.json();
      const blockedData = await blockedRes.json();

      setAppointments(Array.isArray(apptData) ? apptData : []);
      setBlockedTimes(Array.isArray(blockedData) ? blockedData : []);
    } catch {
      showMsg("error", "Erro ao carregar agenda.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPatients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadAppointmentsByRange();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day, statusFilter, viewMode]);

  function resetFinancialModalFields() {
    setModalProcedureName("");
    setModalPrice("");
    setModalPaymentStatus("PENDING");
  }

  function openCreateModalWith(date: Date) {
    setEditingId(null);
    setModalDate(toLocalInputValue(date));
    setModalStatus("SCHEDULED");
    setModalDurationMinutes(30);
    setModalNotes("");
    setPatientSearch("");
    setModalPatientId(selectedPatientId || (patients[0]?.id ?? ""));
    resetFinancialModalFields();
    setIsModalOpen(true);
  }

  function openEditModal(appt: Appointment) {
    setEditingId(appt.id);
    setModalPatientId(appt.patientId);
    setModalDate(toLocalInputValue(new Date(appt.date)));
    setModalStatus(appt.status);
    setModalDurationMinutes((appt.durationMinutes ?? 30) as 30 | 60);
    setModalNotes(appt.notes ?? "");
    setModalProcedureName(appt.procedureName ?? "");
    setModalPrice(
      appt.price === null || appt.price === undefined || Number.isNaN(appt.price)
        ? ""
        : String(appt.price)
    );
    setModalPaymentStatus(appt.paymentStatus ?? "PENDING");
    setPatientSearch("");
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingId(null);
    setModalNotes("");
    setPatientSearch("");
    resetFinancialModalFields();
  }

  function openBlockModal() {
    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);

    end.setMinutes(end.getMinutes() + 60);

    setBlockStart(toLocalInputValue(start));
    setBlockEnd(toLocalInputValue(end));
    setBlockReason("");
    setIsBlockModalOpen(true);
  }

  async function createBlockedTime() {
    if (!blockStart || !blockEnd) {
      showMsg("error", "Defina início e fim do bloqueio.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/blocked-times", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          start: new Date(blockStart).toISOString(),
          end: new Date(blockEnd).toISOString(),
          reason: blockReason.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showMsg("error", data?.error ?? "Erro ao criar bloqueio.");
        return;
      }

      showMsg("success", "Bloqueio criado!");
      setIsBlockModalOpen(false);
      await loadAppointmentsByRange();
    } finally {
      setLoading(false);
    }
  }

  async function deleteBlockedTime(id: string) {
    const ok = confirm("Deletar este bloqueio?");
    if (!ok) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/blocked-times/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        showMsg("error", data?.error ?? "Erro ao deletar bloqueio.");
        return;
      }

      showMsg("success", "Bloqueio deletado!");
      await loadAppointmentsByRange();
    } finally {
      setLoading(false);
    }
  }

  function goToday() {
    setDay(new Date());
  }

  function goPrev() {
    const d = new Date(day);
    d.setDate(d.getDate() + (viewMode === "week" ? -7 : -1));
    setDay(d);
  }

  function goNext() {
    const d = new Date(day);
    d.setDate(d.getDate() + (viewMode === "week" ? 7 : 1));
    setDay(d);
  }

  function handleClickSlot(slotStart: Date) {
    const label = `${pad(slotStart.getHours())}:${pad(slotStart.getMinutes())}`;
    const slotInfo = blockedInfoBySlot.get(label);

    if (slotInfo?.blocked) {
      showMsg("error", slotInfo.reason ? `Horário bloqueado: ${slotInfo.reason}` : "Horário bloqueado.");
      return;
    }

    openCreateModalWith(slotStart);
  }

  function handleClickDayHeader(d: Date) {
    setDay(d);
    setViewMode("day");
  }

  function handleQuickCreateFromWeek(d: Date) {
    const x = new Date(d);
    x.setHours(START_HOUR, 0, 0, 0);

    const hasBlocked = blockedTimes.some((b) => {
      const bStart = new Date(b.start);
      const bEnd = new Date(b.end);
      return rangesOverlap(x, addMinutes(x, STEP_MIN), bStart, bEnd);
    });

    if (hasBlocked) {
      showMsg("error", "Este horário inicial está bloqueado.");
      return;
    }

    openCreateModalWith(x);
  }

  async function handleSubmitModal(e: React.FormEvent) {
    e.preventDefault();

    if (!modalPatientId) {
      showMsg("error", "Selecione um paciente.");
      return;
    }
    if (!modalDate) {
      showMsg("error", "Escolha data/hora.");
      return;
    }

    const parsedPrice =
      modalPrice.trim() === ""
        ? undefined
        : Number(modalPrice.replace(",", "."));

    if (parsedPrice !== undefined && (Number.isNaN(parsedPrice) || parsedPrice < 0)) {
      showMsg("error", "Informe um valor válido.");
      return;
    }

    setLoading(true);
    try {
      const iso = new Date(modalDate).toISOString();

      if (editingId) {
        const res = await fetch(`/api/appointments/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patientId: modalPatientId,
            date: iso,
            status: modalStatus,
            durationMinutes: modalDurationMinutes,
            notes: modalNotes.trim() || undefined,
            procedureName: modalProcedureName.trim() || undefined,
            price: parsedPrice,
            paymentStatus: modalPaymentStatus,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          showMsg("error", data?.error ?? "Erro ao salvar consulta.");
          return;
        }

        showMsg("success", "Consulta atualizada!");
        closeModal();
        await loadAppointmentsByRange();
        return;
      }

      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: modalPatientId,
          date: iso,
          status: modalStatus,
          durationMinutes: modalDurationMinutes,
          notes: modalNotes.trim() || undefined,
          procedureName: modalProcedureName.trim() || undefined,
          price: parsedPrice,
          paymentStatus: modalPaymentStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showMsg("error", data?.error ?? "Erro ao criar consulta.");
        return;
      }

      showMsg("success", "Consulta criada!");
      closeModal();
      await loadAppointmentsByRange();
    } finally {
      setLoading(false);
    }
  }

  async function changeStatus(id: string, status: AppointmentStatus) {
    setLoading(true);
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();
      if (!res.ok) {
        showMsg("error", data?.error ?? "Erro ao atualizar status.");
        return;
      }

      showMsg("success", "Status atualizado!");
      await loadAppointmentsByRange();
    } finally {
      setLoading(false);
    }
  }

  async function updateAppointmentDate(id: string, newDate: Date) {
    setLoading(true);
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: newDate.toISOString() }),
      });

      const data = await res.json();
      if (!res.ok) {
        showMsg("error", data?.error ?? "Erro ao mover consulta.");
        return;
      }

      showMsg("success", "Consulta movida!");
      await loadAppointmentsByRange();
    } finally {
      setLoading(false);
      setHoverWeekDayIso(null);
      setHoverSlotLabel(null);
    }
  }

  async function deleteAppointment(id: string) {
    const ok = confirm("Deletar esta consulta?");
    if (!ok) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/appointments/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        showMsg("error", data?.error ?? "Erro ao deletar.");
        return;
      }

      showMsg("success", "Consulta deletada!");
      await loadAppointmentsByRange();
    } finally {
      setLoading(false);
    }
  }

  function allowDrop(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function onDragStartAppointment(a: Appointment, e: React.DragEvent) {
    setDraggingId(a.id);
    e.dataTransfer.setData("text/plain", a.id);
    e.dataTransfer.effectAllowed = "move";
  }

  function onDragEnd() {
    setDraggingId(null);
    setHoverWeekDayIso(null);
    setHoverSlotLabel(null);
  }

  function findAppointmentById(id: string) {
    return visibleAppointments.find((x) => x.id === id);
  }

  async function onDropToWeekDay(targetDay: Date, e: React.DragEvent) {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    const appt = findAppointmentById(id);
    if (!appt) return;

    const old = new Date(appt.date);
    const moved = new Date(targetDay);
    moved.setHours(old.getHours(), old.getMinutes(), 0, 0);

    await updateAppointmentDate(id, moved);
  }

  async function onDropToSlot(slotStart: Date, e: React.DragEvent) {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (!findAppointmentById(id)) return;

    await updateAppointmentDate(id, new Date(slotStart));
  }

  function onWeekColumnClick(dayDate: Date, e: React.MouseEvent) {
    const el = e.target as HTMLElement;

    if (el.closest("button, select, option, a, input, textarea")) return;
    if (el.closest('[data-appt-card="true"]')) return;
    if (el.closest('[data-week-header="true"]')) return;

    handleQuickCreateFromWeek(dayDate);
  }

  const headerRangeLabel = useMemo(() => {
    if (viewMode !== "week") return "";
    const a = weekDays[0].toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    const b = weekDays[6].toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    return `${a} – ${b}`;
  }, [viewMode, weekDays]);

  function hasBlockedInDay(date: Date) {
    return blockedTimes.some((b) => {
      const bStart = new Date(b.start);
      const bEnd = new Date(b.end);
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      return rangesOverlap(dayStart, dayEnd, bStart, bEnd);
    });
  }

  return (
    <div className="p-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Agenda</h1>
          <p className="text-gray-600 mt-1 capitalize">
            {viewMode === "day" ? fmtDayLabel(day) : `Semana (${headerRangeLabel})`}
          </p>

          <div className="flex gap-2 mt-3">
            <button
              type="button"
              className={`px-3 py-2 rounded-md border ${viewMode === "day" ? "bg-black text-white" : "hover:bg-gray-50"}`}
              onClick={() => setViewMode("day")}
            >
              Dia
            </button>
            <button
              type="button"
              className={`px-3 py-2 rounded-md border ${viewMode === "week" ? "bg-black text-white" : "hover:bg-gray-50"}`}
              onClick={() => setViewMode("week")}
            >
              Semana
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button className="px-3 py-2 rounded-md border hover:bg-gray-50" onClick={goPrev} type="button">
            ◀ {viewMode === "week" ? "Semana anterior" : "Anterior"}
          </button>
          <button className="px-3 py-2 rounded-md border hover:bg-gray-50" onClick={goToday} type="button">
            Hoje
          </button>
          <button className="px-3 py-2 rounded-md border hover:bg-gray-50" onClick={goNext} type="button">
            {viewMode === "week" ? "Próxima semana" : "Próximo"} ▶
          </button>
        </div>
      </div>

      {message && (
        <div
          className={[
            "mt-4 p-3 rounded-md border",
            message.type === "success" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200",
          ].join(" ")}
        >
          <p className="text-sm">{message.text}</p>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="p-4 border rounded-xl bg-white">
          <h2 className="font-medium mb-3">Filtros</h2>

          <label className="text-xs text-gray-600">Status</label>
          <select
            className="mt-1 border rounded-md p-2 w-full"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="">Todos</option>
            <option value="SCHEDULED">SCHEDULED</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELED">CANCELED</option>
          </select>

          <div className="mt-3">
            <label className="text-xs text-gray-600">Paciente</label>
            <select
              className="mt-1 border rounded-md p-2 w-full"
              value={agendaPatientFilter}
              onChange={(e) => setAgendaPatientFilter(e.target.value)}
            >
              <option value="">Todos os pacientes</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <p className="text-xs text-gray-500 mt-3">
            {viewMode === "day"
              ? "Arraste uma consulta e solte em outro horário. Slots bloqueados aparecem em cinza."
              : "Arraste e solte para mover. Clique no vazio da coluna para criar."}
          </p>
        </div>

        <div className="p-4 border rounded-xl bg-white lg:col-span-2">
          <h2 className="font-medium mb-3">Ações rápidas</h2>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="px-3 py-2 rounded-md border hover:bg-gray-50"
              onClick={() => openCreateModalWith(new Date())}
            >
              + Nova consulta (agora)
            </button>

            <button
              type="button"
              className="px-3 py-2 rounded-md border hover:bg-gray-50"
              onClick={openBlockModal}
            >
              🔒 Bloquear horário
            </button>
          </div>

          {selectedPatient && (
            <p className="text-xs text-gray-500 mt-3">
              Paciente padrão: <span className="font-medium text-gray-700">{selectedPatient.name}</span>
            </p>
          )}

          {blockedTimes.length > 0 && (
            <div className="mt-4 border rounded-xl p-3 bg-gray-50">
              <h3 className="text-sm font-medium mb-2">Bloqueios do período</h3>

              <div className="space-y-2 max-h-40 overflow-auto">
                {blockedTimes.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-start justify-between gap-3 rounded-lg border bg-white p-2"
                  >
                    <div>
                      <div className="text-sm font-medium">🔒 {b.reason || "Bloqueio"}</div>
                      <div className="text-xs text-gray-500">{formatBlockedRange(b.start, b.end)}</div>
                    </div>

                    <button
                      type="button"
                      className="px-2 py-1 rounded-md border text-xs hover:bg-red-50"
                      onClick={() => deleteBlockedTime(b.id)}
                      disabled={loading}
                    >
                      Excluir
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {viewMode === "day" ? (
        <div className="mt-6 border rounded-xl overflow-hidden bg-white">
          <div className="flex items-center justify-between p-4 border-b bg-gray-50">
            <h2 className="font-medium">
              Horários ({pad(START_HOUR)}:00 – {pad(END_HOUR)}:00)
            </h2>
            <span className="text-sm text-gray-600">{visibleAppointments.length} consulta(s)</span>
          </div>

          <div className="relative">
            <div
              className="grid"
              style={{
                gridTemplateColumns: "72px 1fr",
                gridTemplateRows: `repeat(${slots.length}, 64px)`,
              }}
            >
              {slots.map((s, idx) => {
                const isCont = dayLayout.isContinuation[idx];
                const blockedByAppointment = dayLayout.blockedByActive[idx];
                const hasStart = dayLayout.hasBlockStarting[idx];
                const blockedSlot = blockedInfoBySlot.get(s.label);

                return (
                  <div key={s.label} className="contents">
                    <div className="border-r border-gray-100 p-3 text-sm font-semibold text-gray-700 bg-white">
                      {s.label}
                    </div>

                    <div
                      className={[
                        "relative border-b border-gray-100 p-3",
                        hoverSlotLabel === s.label ? "bg-blue-50" : "bg-white",
                        isCont || blockedSlot?.blocked ? "bg-gray-50" : "",
                      ].join(" ")}
                      onDragOver={(e) => {
                        allowDrop(e);
                        if (draggingId) setHoverSlotLabel(s.label);
                      }}
                      onDragLeave={() => setHoverSlotLabel(null)}
                      onDrop={(e) => onDropToSlot(s.start, e)}
                    >
                      {!hasStart && !isCont && !blockedByAppointment && !blockedSlot?.blocked && (
                        <button
                          type="button"
                          onClick={() => handleClickSlot(s.start)}
                          className="text-sm text-gray-400 hover:text-black underline underline-offset-4"
                        >
                          + Criar consulta
                        </button>
                      )}

                      {blockedSlot?.blocked && !hasStart && (
                        <div className="text-xs text-gray-500 select-none">
                          🔒 Bloqueado{blockedSlot.reason ? ` • ${blockedSlot.reason}` : ""}
                        </div>
                      )}

                      {isCont && !blockedSlot?.blocked && (
                        <div className="text-xs text-gray-500 select-none">
                          ⤷ Continuação (ocupado)
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              className="absolute inset-0 grid pointer-events-none"
              style={{
                gridTemplateColumns: "72px 1fr",
                gridTemplateRows: `repeat(${slots.length}, 64px)`,
              }}
            >
              {dayLayout.blocks.map(({ appt, startIdx, span }) => {
                const dur = (appt.durationMinutes ?? 30) as 30 | 60;
                const canceled = appt.status === "CANCELED";

                return (
                  <div
                    key={appt.id}
                    className="pointer-events-auto"
                    style={{
                      gridColumn: 2,
                      gridRow: `${startIdx + 1} / span ${span}`,
                      padding: "10px 12px",
                    }}
                  >
                    <div
                      data-appt-card="true"
                      draggable
                      onDragStart={(e) => onDragStartAppointment(appt, e)}
                      onDragEnd={onDragEnd}
                      onClick={() => openEditModal(appt)}
                      className={[
                        "h-full w-full rounded-xl border shadow-sm bg-white cursor-move",
                        "px-3 py-2 flex flex-col justify-between",
                        canceled ? "opacity-60" : "",
                        span > 1 ? "ring-1 ring-black/10" : "",
                        draggingId === appt.id ? "opacity-60" : "",
                      ].join(" ")}
                      title="Clique para editar • Arraste para mover"
                    >
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusBadgeClasses(
                              appt.status
                            )}`}
                          >
                            {appt.status}
                          </span>

                          <span className="text-xs text-gray-500">• {dur}min</span>

                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${paymentBadgeClasses(
                              appt.paymentStatus ?? "PENDING"
                            )}`}
                          >
                            {appt.paymentStatus ?? "PENDING"}
                          </span>
                        </div>

                        <div className="mt-2 font-semibold leading-tight">
                          {appt.patient?.name ?? "Paciente"}
                        </div>
                        <div className="text-xs text-gray-600 truncate">{appt.patient?.email ?? ""}</div>

                        {appt.procedureName && (
                          <div className="mt-2 text-xs text-gray-700 font-medium">
                            {appt.procedureName}
                          </div>
                        )}

                        {appt.price !== null && appt.price !== undefined && (
                          <div className="text-xs text-gray-600">
                            {formatPrice(appt.price)}
                          </div>
                        )}

                        {appt.notes && (
                          <div className="mt-2 text-xs text-gray-500 line-clamp-2">
                            {appt.notes}
                          </div>
                        )}
                      </div>

                      <div className="mt-2 flex items-center gap-2">
                        <select
                          className="border rounded-md p-2 text-xs"
                          value={appt.status}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => changeStatus(appt.id, e.target.value as AppointmentStatus)}
                          disabled={loading}
                        >
                          <option value="SCHEDULED">SCHEDULED</option>
                          <option value="COMPLETED">COMPLETED</option>
                          <option value="CANCELED">CANCELED</option>
                        </select>

                        <button
                          className="px-2 py-2 rounded-md border text-xs hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteAppointment(appt.id);
                          }}
                          disabled={loading}
                          type="button"
                        >
                          Deletar
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3 text-xs text-gray-500 border-t bg-white">
            Dica: consultas de 60min ocupam 2 slots. Bloqueios aparecem em cinza. Clique no bloco para editar.
          </div>
        </div>
      ) : (
        <div className="mt-6 border rounded-xl bg-white overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b bg-gray-50">
            <h2 className="font-medium">Semana</h2>
            <span className="text-sm text-gray-600">{visibleAppointments.length} consulta(s)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-7 gap-0">
            {weekDays.map((d) => {
              const dayAppointments = visibleAppointments
                .filter((a) => isSameDay(new Date(a.date), d))
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

              const isToday = isSameDay(d, new Date());
              const iso = d.toISOString();
              const blockedInDay = hasBlockedInDay(d);

              return (
                <div
                  key={iso}
                  className={["border-r last:border-r-0", hoverWeekDayIso === iso ? "bg-blue-50/40" : ""].join(" ")}
                  onClick={(e) => onWeekColumnClick(d, e)}
                  onDragOver={(e) => {
                    allowDrop(e);
                    if (draggingId) setHoverWeekDayIso(iso);
                  }}
                  onDragLeave={() => setHoverWeekDayIso(null)}
                  onDrop={(e) => onDropToWeekDay(d, e)}
                  title="Clique no vazio para criar. Solte aqui para mover para este dia."
                >
                  <div data-week-header="true" className={`p-3 border-b ${isToday ? "bg-yellow-50" : "bg-white"}`}>
                    <button
                      type="button"
                      onClick={() => handleClickDayHeader(d)}
                      className="w-full text-left hover:opacity-90"
                      title="Abrir visão DIA"
                    >
                      <div className="text-xs text-gray-500 uppercase">
                        {d.toLocaleDateString("pt-BR", { weekday: "short" })}
                      </div>
                      <div className="font-semibold">{d.toLocaleDateString("pt-BR", { day: "2-digit" })}</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickCreateFromWeek(d)}
                      className="mt-2 w-full px-2 py-1 rounded-md border text-xs hover:bg-gray-50"
                      title="Abrir modal para este dia"
                    >
                      + Nova
                    </button>

                    {blockedInDay && (
                      <div className="mt-2 text-[10px] font-medium text-gray-500">
                        🔒 Há bloqueios
                      </div>
                    )}
                  </div>

                  <div className="p-3 space-y-2 min-h-[220px]">
                    {dayAppointments.length === 0 ? (
                      <div className="text-xs text-gray-500">Sem consultas</div>
                    ) : (
                      dayAppointments.map((a) => {
                        const time = new Date(a.date).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        });

                        return (
                          <div
                            key={a.id}
                            data-appt-card="true"
                            draggable
                            onDragStart={(e) => onDragStartAppointment(a, e)}
                            onDragEnd={onDragEnd}
                            onClick={() => openEditModal(a)}
                            className={[
                              "border rounded-lg p-2 bg-gray-50 cursor-move",
                              draggingId === a.id ? "opacity-60" : "",
                            ].join(" ")}
                            title="Clique para editar • Arraste para mover"
                          >
                            <div className="flex items-center gap-2 flex-wrap">
                              <div className="text-xs text-gray-600">
                                {time} • {(a.durationMinutes ?? 30)}min
                              </div>
                              <span
                                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusBadgeClasses(
                                  a.status
                                )}`}
                              >
                                {a.status}
                              </span>
                              <span
                                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${paymentBadgeClasses(
                                  a.paymentStatus ?? "PENDING"
                                )}`}
                              >
                                {a.paymentStatus ?? "PENDING"}
                              </span>
                            </div>

                            <div className="font-medium text-sm">{a.patient?.name ?? "Paciente"}</div>
                            <div className="text-xs text-gray-600 truncate">{a.patient?.email ?? ""}</div>

                            {a.procedureName && (
                              <div className="mt-1 text-xs text-gray-700 font-medium">
                                {a.procedureName}
                              </div>
                            )}

                            {a.price !== null && a.price !== undefined && (
                              <div className="text-xs text-gray-600">
                                {formatPrice(a.price)}
                              </div>
                            )}

                            {a.notes && (
                              <div className="mt-1 text-xs text-gray-500 line-clamp-2">
                                {a.notes}
                              </div>
                            )}

                            <div className="mt-2 flex flex-wrap gap-2 items-center">
                              <select
                                className="border rounded-md p-2 text-xs"
                                value={a.status}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => changeStatus(a.id, e.target.value as AppointmentStatus)}
                                disabled={loading}
                              >
                                <option value="SCHEDULED">SCHEDULED</option>
                                <option value="COMPLETED">COMPLETED</option>
                                <option value="CANCELED">CANCELED</option>
                              </select>

                              <button
                                className="px-2 py-1 rounded-md border text-xs hover:bg-red-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteAppointment(a.id);
                                }}
                                disabled={loading}
                                type="button"
                              >
                                Deletar
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 text-xs text-gray-500 border-t">
            Dica: arraste para mover. Semana muda o dia mantendo a hora. Dia muda o horário. Clique no card para editar.
          </div>
        </div>
      )}

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{editingId ? "Editar consulta" : "Nova consulta"}</h3>
              <button className="px-2 py-1 rounded-md border hover:bg-gray-50" onClick={closeModal} type="button">
                ✕
              </button>
            </div>

            <form className="mt-4 space-y-3" onSubmit={handleSubmitModal}>
              <div>
                <label className="text-xs text-gray-600">Buscar paciente</label>
                <input
                  type="text"
                  className="mt-1 border rounded-md p-2 w-full"
                  placeholder="Digite nome ou e-mail"
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs text-gray-600">Paciente</label>
                <select
                  className="mt-1 border rounded-md p-2 w-full"
                  value={modalPatientId}
                  onChange={(e) => setModalPatientId(e.target.value)}
                >
                  {filteredPatients.length === 0 ? (
                    <option value="">Nenhum paciente encontrado</option>
                  ) : (
                    filteredPatients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-600">Data/Hora</label>
                <input
                  type="datetime-local"
                  className="mt-1 border rounded-md p-2 w-full"
                  value={modalDate}
                  onChange={(e) => setModalDate(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs text-gray-600">Duração</label>
                <select
                  className="mt-1 border rounded-md p-2 w-full"
                  value={modalDurationMinutes}
                  onChange={(e) => setModalDurationMinutes(Number(e.target.value) as 30 | 60)}
                >
                  <option value={30}>30 minutos</option>
                  <option value={60}>60 minutos</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-600">Procedimento</label>
                <input
                  type="text"
                  className="mt-1 border rounded-md p-2 w-full"
                  value={modalProcedureName}
                  onChange={(e) => setModalProcedureName(e.target.value)}
                  placeholder="Ex.: Botox, limpeza de pele, consulta..."
                />
              </div>

              <div>
                <label className="text-xs text-gray-600">Valor</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="mt-1 border rounded-md p-2 w-full"
                  value={modalPrice}
                  onChange={(e) => setModalPrice(e.target.value)}
                  placeholder="Ex.: 250.00"
                />
              </div>

              <div>
                <label className="text-xs text-gray-600">Pagamento</label>
                <select
                  className="mt-1 border rounded-md p-2 w-full"
                  value={modalPaymentStatus}
                  onChange={(e) => setModalPaymentStatus(e.target.value as PaymentStatus)}
                >
                  <option value="PENDING">PENDING</option>
                  <option value="PAID">PAID</option>
                  <option value="CANCELED">CANCELED</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-600">Observação</label>
                <textarea
                  className="mt-1 border rounded-md p-2 w-full"
                  rows={3}
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  placeholder="Ex.: primeira consulta, encaixe, retorno..."
                />
              </div>

              <div>
                <label className="text-xs text-gray-600">Status</label>
                <select
                  className="mt-1 border rounded-md p-2 w-full"
                  value={modalStatus}
                  onChange={(e) => setModalStatus(e.target.value as AppointmentStatus)}
                >
                  <option value="SCHEDULED">SCHEDULED</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELED">CANCELED</option>
                </select>
              </div>

              <div className="pt-2 flex gap-2 justify-between">
                <div>
                  {editingId && (
                    <button
                      type="button"
                      className="px-4 py-2 rounded-md border hover:bg-red-50"
                      onClick={async () => {
                        const ok = confirm("Deletar esta consulta?");
                        if (!ok) return;
                        await deleteAppointment(editingId);
                        closeModal();
                      }}
                      disabled={loading}
                    >
                      Excluir
                    </button>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    className="px-4 py-2 rounded-md border hover:bg-gray-50"
                    onClick={closeModal}
                    disabled={loading}
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className="px-4 py-2 rounded-md bg-black text-white disabled:opacity-50"
                    disabled={loading || !modalPatientId || !modalDate}
                  >
                    {loading ? "Salvando..." : editingId ? "Salvar" : "Criar"}
                  </button>
                </div>
              </div>

              <p className="text-xs text-gray-500 pt-1">
                Obs: consulta cancelada aparece na agenda, mas não bloqueia horário.
              </p>
            </form>
          </div>
        </div>
      )}

      {isBlockModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setIsBlockModalOpen(false);
          }}
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Bloquear horário</h3>
              <button
                className="px-2 py-1 rounded-md border hover:bg-gray-50"
                onClick={() => setIsBlockModalOpen(false)}
                type="button"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs text-gray-600">Início</label>
                <input
                  type="datetime-local"
                  className="mt-1 border rounded-md p-2 w-full"
                  value={blockStart}
                  onChange={(e) => setBlockStart(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs text-gray-600">Fim</label>
                <input
                  type="datetime-local"
                  className="mt-1 border rounded-md p-2 w-full"
                  value={blockEnd}
                  onChange={(e) => setBlockEnd(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs text-gray-600">Motivo</label>
                <input
                  className="mt-1 border rounded-md p-2 w-full"
                  placeholder="Ex.: almoço, reunião, férias..."
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded-md border hover:bg-gray-50"
                  onClick={() => setIsBlockModalOpen(false)}
                  disabled={loading}
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  className="px-4 py-2 rounded-md bg-black text-white disabled:opacity-50"
                  onClick={createBlockedTime}
                  disabled={loading || !blockStart || !blockEnd}
                >
                  {loading ? "Salvando..." : "Criar bloqueio"}
                </button>
              </div>

              <p className="text-xs text-gray-500">
                Exemplo: almoço das 12:00 às 13:00 ou reunião interna.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}