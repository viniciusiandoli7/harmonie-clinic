"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { addDays, format, isSameDay, startOfWeek, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import CalendarQuickCreateModal from "@/components/calendar/CalendarQuickCreateModal";
import AppointmentEditModal from "@/components/calendar/AppointmentEditModal";
import BlockedTimeQuickModal from "@/components/calendar/BlockedTimeQuickModal";
import BlockedTimeEditModal from "@/components/calendar/BlockedTimeEditModal";

type Patient = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
};

type Room = "A" | "B";
type CalendarMode = "appointment" | "blocked";
type StatusFilter = "ALL" | "SCHEDULED" | "COMPLETED" | "CANCELED";
type RoomFilter = "ALL" | "A" | "B";

type Appointment = {
  id: string;
  date: string;
  patientId: string;
  patient?: Patient;
  durationMinutes?: number;
  procedureName?: string | null;
  price?: number | null;
  status?: "SCHEDULED" | "COMPLETED" | "CANCELED";
  paymentStatus?: "PENDING" | "PAID" | "CANCELED";
  notes?: string | null;
  room?: Room;
};

type BlockedTime = {
  id: string;
  start: string;
  end: string;
  reason?: string | null;
};

type Props = {
  appointments: Appointment[];
  blockedTimes: BlockedTime[];
  onReload: () => void | Promise<void>;
};

type CalendarColumn = {
  day: Date;
  room: Room;
};

const ROOMS: Room[] = ["A", "B"];
const START_HOUR = 8;
const END_HOUR = 20;
const SLOT_MINUTES = 30;
const SLOT_HEIGHT = 44;
const DAY_COLUMN_HEIGHT =
  (((END_HOUR - START_HOUR) * 60) / SLOT_MINUTES) * SLOT_HEIGHT;

function toY(date: Date) {
  const totalMinutes = date.getHours() * 60 + date.getMinutes();
  const startMinutes = START_HOUR * 60;
  return ((totalMinutes - startMinutes) / SLOT_MINUTES) * SLOT_HEIGHT;
}

function dayKey(date: Date) {
  return format(date, "yyyy-MM-dd");
}

function clampDateToCalendar(date: Date) {
  const next = new Date(date);
  const mins = next.getMinutes();
  next.setMinutes(mins >= 30 ? 30 : 0, 0, 0);

  if (next.getHours() < START_HOUR) {
    next.setHours(START_HOUR, 0, 0, 0);
  }

  if (next.getHours() >= END_HOUR) {
    next.setHours(END_HOUR - 1, 30, 0, 0);
  }

  return next;
}

function fmtHour(hour: number, minutes: number) {
  return `${String(hour).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function slotIdFromDateAndRoom(date: Date, room: Room) {
  return `slot:${format(date, "yyyy-MM-dd'T'HH:mm")}:room:${room}`;
}

function parseSlotId(slotId: string) {
  const match = slotId.match(/^slot:(.+):room:(A|B)$/);
  if (!match) return null;

  return {
    date: new Date(match[1]),
    room: match[2] as Room,
  };
}

function getStatusClasses(status?: Appointment["status"]) {
  if (status === "COMPLETED") return "border-green-200 bg-green-50 text-green-700";
  if (status === "CANCELED") return "border-gray-200 bg-gray-100 text-gray-700";
  return "border-[#111827] bg-[#111827] text-white";
}

function getPaymentText(status?: Appointment["paymentStatus"]) {
  if (status === "PAID") return "Pago";
  if (status === "CANCELED") return "Cancelado";
  return "Pendente";
}

function formatMoney(value?: number | null) {
  return (value ?? 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function DraggableAppointmentCard({
  appointment,
  onClick,
}: {
  appointment: Appointment;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: appointment.id,
    data: {
      type: "appointment",
      appointmentId: appointment.id,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.35 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        "absolute left-1 right-1 rounded-2xl border p-2 shadow-sm backdrop-blur-sm",
        getStatusClasses(appointment.status),
      ].join(" ")}
    >
      <button
        type="button"
        onClick={onClick}
        className="absolute inset-0 z-10 rounded-2xl"
        aria-label="Editar consulta"
      />

      <div
        {...listeners}
        {...attributes}
        className="relative z-20 cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 text-[11px] font-semibold leading-tight">
            <div className="truncate">{appointment.patient?.name ?? "Paciente"}</div>
          </div>

          <span className="rounded-full border border-current px-2 py-0.5 text-[9px] font-semibold uppercase opacity-90">
            Sala {appointment.room ?? "A"}
          </span>
        </div>

        <div className="mt-1 truncate text-[10px] opacity-90">
          {appointment.procedureName ?? "Consulta"}
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-1 text-[10px] opacity-80">
          <span>{getPaymentText(appointment.paymentStatus)}</span>
          <span>•</span>
          <span>{appointment.durationMinutes ?? 30}min</span>
          {!!appointment.price && (
            <>
              <span>•</span>
              <span>{formatMoney(appointment.price)}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function OverlayCard({ appointment }: { appointment: Appointment }) {
  return (
    <div
      className={[
        "w-[260px] rounded-2xl border p-3 shadow-xl",
        getStatusClasses(appointment.status),
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="text-sm font-semibold">
          {appointment.patient?.name ?? "Paciente"}
        </div>
        <span className="rounded-full border border-current px-2 py-0.5 text-[10px] font-semibold uppercase opacity-90">
          Sala {appointment.room ?? "A"}
        </span>
      </div>

      <div className="mt-1 text-xs opacity-90">
        {appointment.procedureName ?? "Consulta"}
      </div>

      <div className="mt-2 text-xs opacity-80">
        {getPaymentText(appointment.paymentStatus)} • {appointment.durationMinutes ?? 30}min
      </div>
    </div>
  );
}

function DroppableSlot({
  id,
  top,
  onClick,
}: {
  id: string;
  top: number;
  onClick: () => void;
}) {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={onClick}
      className={[
        "absolute left-0 right-0 border-t text-left transition-colors",
        isOver ? "bg-[#C8A35F]/10 border-[#C8A35F]" : "border-[#F3EFE7]",
      ].join(" ")}
      style={{
        top,
        height: SLOT_HEIGHT,
      }}
    />
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-2xl border border-[#ECE7DD] bg-white px-4 py-3 shadow-sm">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8E9AAF]">
        {label}
      </div>
      <div className="mt-1 text-lg font-semibold text-[#111827]">{value}</div>
    </div>
  );
}

export default function AdvancedWeeklyCalendar({
  appointments,
  blockedTimes,
  onReload,
}: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [localAppointments, setLocalAppointments] = useState<Appointment[]>(appointments);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [weekAnchor, setWeekAnchor] = useState(new Date());

  const [mode, setMode] = useState<CalendarMode>("appointment");
  const [roomFilter, setRoomFilter] = useState<RoomFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [search, setSearch] = useState("");

  const [openQuickModal, setOpenQuickModal] = useState(false);
  const [quickCreateDate, setQuickCreateDate] = useState<string | null>(null);

  const [openBlockedModal, setOpenBlockedModal] = useState(false);
  const [blockedCreateDate, setBlockedCreateDate] = useState<string | null>(null);

  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [editingBlockedTime, setEditingBlockedTime] = useState<BlockedTime | null>(null);

  useEffect(() => {
    setLocalAppointments(appointments);
  }, [appointments]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const weekStart = startOfWeek(weekAnchor, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const columns = useMemo<CalendarColumn[]>(
    () =>
      days.flatMap((day) =>
        ROOMS.map((room) => ({
          day,
          room,
        }))
      ),
    [days]
  );

  const slots = useMemo(() => {
    const items: { id: string; date: Date; room: Room; top: number }[] = [];

    for (const column of columns) {
      for (let hour = START_HOUR; hour < END_HOUR; hour++) {
        for (const minute of [0, 30]) {
          const date = new Date(column.day);
          date.setHours(hour, minute, 0, 0);

          items.push({
            id: slotIdFromDateAndRoom(date, column.room),
            date,
            room: column.room,
            top: toY(date),
          });
        }
      }
    }

    return items;
  }, [columns]);

  const filteredAppointments = useMemo(() => {
    const term = search.trim().toLowerCase();

    return localAppointments.filter((appointment) => {
      if (roomFilter !== "ALL" && (appointment.room ?? "A") !== roomFilter) return false;
      if (statusFilter !== "ALL" && (appointment.status ?? "SCHEDULED") !== statusFilter) return false;

      if (!term) return true;

      const patientName = appointment.patient?.name?.toLowerCase() ?? "";
      const procedureName = appointment.procedureName?.toLowerCase() ?? "";

      return patientName.includes(term) || procedureName.includes(term);
    });
  }, [localAppointments, roomFilter, statusFilter, search]);

  const activeAppointment = activeId
    ? filteredAppointments.find((item) => item.id === activeId) ??
      localAppointments.find((item) => item.id === activeId) ??
      null
    : null;

  const weekAppointmentsCount = filteredAppointments.filter((item) =>
    days.some((day) => dayKey(new Date(item.date)) === dayKey(day))
  ).length;

  const weekRevenue = filteredAppointments
    .filter((item) => item.paymentStatus === "PAID")
    .reduce((acc, item) => acc + (item.price ?? 0), 0);

  const scheduledCount = filteredAppointments.filter(
    (item) => (item.status ?? "SCHEDULED") === "SCHEDULED"
  ).length;

  const completedCount = filteredAppointments.filter(
    (item) => item.status === "COMPLETED"
  ).length;

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const appointmentId = String(active.id);
    const overId = String(over.id);
    const parsedSlot = parseSlotId(overId);

    if (!parsedSlot) return;

    const nextDate = clampDateToCalendar(parsedSlot.date);
    const nextRoom = parsedSlot.room;

    const optimistic = localAppointments.map((item) =>
      item.id === appointmentId
        ? {
            ...item,
            date: nextDate.toISOString(),
            room: nextRoom,
          }
        : item
    );

    setLocalAppointments(optimistic);
    setSavingId(appointmentId);

    try {
      const res = await fetch(`/api/appointments/${appointmentId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: nextDate.toISOString(),
          room: nextRoom,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data?.error ?? "Erro ao mover consulta.");
        setLocalAppointments(appointments);
        return;
      }

      await onReload();
    } catch {
      alert("Erro ao mover consulta.");
      setLocalAppointments(appointments);
    } finally {
      setSavingId(null);
    }
  }

  function handleSlotClick(dateIso: string) {
    if (mode === "appointment") {
      setQuickCreateDate(dateIso);
      setOpenQuickModal(true);
      return;
    }

    setBlockedCreateDate(dateIso);
    setOpenBlockedModal(true);
  }

  return (
    <>
      <div className="mt-10 space-y-4">
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <SummaryCard label="Consultas na visão" value={weekAppointmentsCount} />
          <SummaryCard label="Agendadas" value={scheduledCount} />
          <SummaryCard label="Concluídas" value={completedCount} />
          <SummaryCard label="Receita paga" value={formatMoney(weekRevenue)} />
        </div>

        <div className="overflow-hidden rounded-[28px] border border-[#ECE7DD] bg-white shadow-sm">
          <div className="border-b border-[#ECE7DD] bg-gradient-to-r from-[#FCFAF6] to-white p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-[#111827]">
                  Agenda semanal interativa
                </h2>
                <p className="mt-1 text-sm text-[#64748B]">
                  Visual profissional com filtro por sala, status e busca rápida.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex overflow-hidden rounded-full border border-[#ECE7DD] bg-white">
                  <button
                    type="button"
                    onClick={() => setMode("appointment")}
                    className={[
                      "px-4 py-2 text-sm font-medium",
                      mode === "appointment"
                        ? "bg-[#111111] text-white"
                        : "text-[#111827] hover:bg-gray-50",
                    ].join(" ")}
                  >
                    Modo consulta
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode("blocked")}
                    className={[
                      "px-4 py-2 text-sm font-medium",
                      mode === "blocked"
                        ? "bg-[#111111] text-white"
                        : "text-[#111827] hover:bg-gray-50",
                    ].join(" ")}
                  >
                    Modo bloqueio
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setWeekAnchor((prev) => subDays(prev, 7))}
                  className="h-10 rounded-full border border-[#ECE7DD] bg-white px-4 text-sm font-medium text-[#111827]"
                >
                  Semana anterior
                </button>

                <button
                  type="button"
                  onClick={() => setWeekAnchor(new Date())}
                  className="h-10 rounded-full border border-[#ECE7DD] bg-white px-4 text-sm font-medium text-[#111827]"
                >
                  Hoje
                </button>

                <button
                  type="button"
                  onClick={() => setWeekAnchor((prev) => addDays(prev, 7))}
                  className="h-10 rounded-full border border-[#ECE7DD] bg-white px-4 text-sm font-medium text-[#111827]"
                >
                  Próxima semana
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-4">
              <div>
                <input
                  type="text"
                  placeholder="Buscar paciente ou procedimento"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-11 w-full rounded-xl border border-[#ECE7DD] px-3 outline-none"
                />
              </div>

              <div>
                <select
                  value={roomFilter}
                  onChange={(e) => setRoomFilter(e.target.value as RoomFilter)}
                  className="h-11 w-full rounded-xl border border-[#ECE7DD] px-3 outline-none"
                >
                  <option value="ALL">Todas as salas</option>
                  <option value="A">Sala A</option>
                  <option value="B">Sala B</option>
                </select>
              </div>

              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                  className="h-11 w-full rounded-xl border border-[#ECE7DD] px-3 outline-none"
                >
                  <option value="ALL">Todos os status</option>
                  <option value="SCHEDULED">Agendadas</option>
                  <option value="COMPLETED">Concluídas</option>
                  <option value="CANCELED">Canceladas</option>
                </select>
              </div>

              <div className="flex items-center gap-2 text-xs text-[#64748B]">
                <span className="inline-flex items-center rounded-full border border-yellow-200 bg-yellow-100 px-2 py-1 font-semibold text-yellow-800">
                  Agendada
                </span>
                <span className="inline-flex items-center rounded-full border border-green-200 bg-green-100 px-2 py-1 font-semibold text-green-700">
                  Concluída
                </span>
                <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-100 px-2 py-1 font-semibold text-gray-700">
                  Cancelada
                </span>
              </div>
            </div>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={(event) => setActiveId(String(event.active.id))}
            onDragEnd={handleDragEnd}
            onDragCancel={() => setActiveId(null)}
          >
            <div className="grid grid-cols-[72px_repeat(14,minmax(120px,1fr))] overflow-x-auto">
              <div className="border-r border-[#ECE7DD] bg-white" />

              {columns.map((column) => {
                const isToday = isSameDay(column.day, new Date());

                return (
                  <div
                    key={`${column.day.toISOString()}-${column.room}`}
                    className={[
                      "border-r border-[#ECE7DD] p-3 text-center last:border-r-0",
                      isToday ? "bg-[#FFF8EC]" : "bg-white",
                    ].join(" ")}
                  >
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[#8E9AAF]">
                      {format(column.day, "EEE", { locale: ptBR })}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[#111827]">
                      {format(column.day, "dd/MM")}
                    </p>
                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#C8A35F]">
                      Sala {column.room}
                    </p>
                  </div>
                );
              })}

              <div className="border-r border-[#ECE7DD] bg-white">
                {Array.from({ length: (END_HOUR - START_HOUR) * 2 }, (_, i) => {
                  const hour = START_HOUR + Math.floor(i / 2);
                  const minute = i % 2 === 0 ? 0 : 30;

                  return (
                    <div
                      key={`${hour}-${minute}`}
                      className="flex h-[44px] items-start justify-center border-t border-[#F3EFE7] pt-1 text-[11px] text-[#8E9AAF]"
                    >
                      {fmtHour(hour, minute)}
                    </div>
                  );
                })}
              </div>

              {columns.map((column) => {
                const columnAppointments = filteredAppointments.filter(
                  (a) =>
                    dayKey(new Date(a.date)) === dayKey(column.day) &&
                    (a.room ?? "A") === column.room
                );

                const columnBlocked = blockedTimes.filter(
                  (b) => dayKey(new Date(b.start)) === dayKey(column.day)
                );

                return (
                  <div
                    key={`${column.day.toISOString()}-${column.room}-body`}
                    className="relative border-r border-[#ECE7DD] last:border-r-0"
                    style={{ height: DAY_COLUMN_HEIGHT }}
                  >
                    {slots
                      .filter(
                        (slot) =>
                          dayKey(slot.date) === dayKey(column.day) &&
                          slot.room === column.room
                      )
                      .map((slot) => (
                        <DroppableSlot
                          key={slot.id}
                          id={slot.id}
                          top={slot.top}
                          onClick={() => handleSlotClick(slot.date.toISOString())}
                        />
                      ))}

                    {columnBlocked.map((block) => {
                      const start = new Date(block.start);
                      const end = new Date(block.end);
                      const top = toY(start);
                      const duration = Math.max(
                        SLOT_HEIGHT,
                        ((end.getTime() - start.getTime()) / 60000 / SLOT_MINUTES) *
                          SLOT_HEIGHT
                      );

                      return (
                        <button
                          key={`${block.id}-${column.room}`}
                          type="button"
                          onClick={() => setEditingBlockedTime(block)}
                          className="absolute left-1 right-1 rounded-2xl border border-red-200 bg-red-50 p-2 text-left text-xs text-red-700 shadow-sm"
                          style={{
                            top,
                            height: duration,
                          }}
                        >
                          🔒 {block.reason || "Bloqueado"}
                        </button>
                      );
                    })}

                    {columnAppointments.map((appointment) => {
                      const start = new Date(appointment.date);
                      const top = toY(start);
                      const height = Math.max(
                        SLOT_HEIGHT,
                        ((appointment.durationMinutes ?? 30) / SLOT_MINUTES) * SLOT_HEIGHT
                      );

                      return (
                        <div
                          key={appointment.id}
                          className="absolute left-0 right-0"
                          style={{
                            top,
                            height,
                            zIndex: activeId === appointment.id ? 50 : 20,
                          }}
                        >
                          <DraggableAppointmentCard
                            appointment={appointment}
                            onClick={() => setEditingAppointment(appointment)}
                          />

                          {savingId === appointment.id && (
                            <div className="absolute -top-2 right-2 rounded-full bg-[#111827] px-2 py-0.5 text-[10px] text-white">
                              Salvando...
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {columnAppointments.length === 0 && columnBlocked.length === 0 && (
                      <div className="pointer-events-none absolute inset-x-2 top-2 rounded-xl border border-dashed border-transparent p-2 text-center text-[10px] text-transparent xl:text-[#CBD5E1]">
                        Livre
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <DragOverlay>
              {activeAppointment ? <OverlayCard appointment={activeAppointment} /> : null}
            </DragOverlay>
          </DndContext>

          <div className="border-t border-[#ECE7DD] bg-[#FCFAF6] px-5 py-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#64748B]">
              <span className="inline-flex items-center rounded-full border px-2 py-1 font-semibold">
                Clique no slot para criar {mode === "appointment" ? "consulta" : "bloqueio"}
              </span>
              <span className="inline-flex items-center rounded-full border px-2 py-1 font-semibold">
                Clique no card para editar consulta
              </span>
              <span className="inline-flex items-center rounded-full border px-2 py-1 font-semibold">
                Clique no bloqueio para editar
              </span>
              <span className="inline-flex items-center rounded-full border px-2 py-1 font-semibold">
                Arraste para reagendar
              </span>
            </div>
          </div>
        </div>
      </div>

      <CalendarQuickCreateModal
        open={openQuickModal}
        initialDate={quickCreateDate}
        onClose={() => {
          setOpenQuickModal(false);
          setQuickCreateDate(null);
        }}
        onSaved={onReload}
      />

      <BlockedTimeQuickModal
        open={openBlockedModal}
        initialDate={blockedCreateDate}
        onClose={() => {
          setOpenBlockedModal(false);
          setBlockedCreateDate(null);
        }}
        onSaved={onReload}
      />

      <AppointmentEditModal
        open={!!editingAppointment}
        appointment={editingAppointment}
        onClose={() => setEditingAppointment(null)}
        onSaved={onReload}
      />

      <BlockedTimeEditModal
        open={!!editingBlockedTime}
        blockedTime={editingBlockedTime}
        onClose={() => setEditingBlockedTime(null)}
        onSaved={onReload}
      />
    </>
  );
}