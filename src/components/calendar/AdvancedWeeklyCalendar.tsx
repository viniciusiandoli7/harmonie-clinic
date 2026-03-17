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
import { addDays, format, startOfWeek, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import CalendarQuickCreateModal from "@/components/calendar/CalendarQuickCreateModal";

type Patient = {
  id: string;
  name: string;
  email?: string;
};

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

function slotIdFromDate(date: Date) {
  return `slot:${format(date, "yyyy-MM-dd'T'HH:mm")}`;
}

function dateFromSlotId(slotId: string) {
  const raw = slotId.replace("slot:", "");
  return new Date(raw);
}

function getStatusClasses(status?: Appointment["status"]) {
  if (status === "COMPLETED") return "border-green-200 bg-green-50 text-green-700";
  if (status === "CANCELED") return "border-gray-200 bg-gray-50 text-gray-700";
  return "border-[#111827] bg-[#111827] text-white";
}

function getPaymentText(status?: Appointment["paymentStatus"]) {
  if (status === "PAID") return "Pago";
  if (status === "CANCELED") return "Cancelado";
  return "Pendente";
}

function DraggableAppointmentCard({
  appointment,
}: {
  appointment: Appointment;
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
      {...listeners}
      {...attributes}
      className={[
        "absolute left-1 right-1 cursor-grab rounded-xl border p-2 shadow-sm active:cursor-grabbing",
        getStatusClasses(appointment.status),
      ].join(" ")}
    >
      <div className="text-[11px] font-semibold">
        {appointment.patient?.name ?? "Paciente"}
      </div>
      <div className="mt-0.5 text-[10px] opacity-90">
        {appointment.procedureName ?? "Consulta"}
      </div>
      <div className="mt-1 text-[10px] opacity-80">
        {getPaymentText(appointment.paymentStatus)} • {appointment.durationMinutes ?? 30}min
      </div>
    </div>
  );
}

function OverlayCard({ appointment }: { appointment: Appointment }) {
  return (
    <div
      className={[
        "w-[220px] rounded-xl border p-3 shadow-xl",
        getStatusClasses(appointment.status),
      ].join(" ")}
    >
      <div className="text-sm font-semibold">
        {appointment.patient?.name ?? "Paciente"}
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

export default function AdvancedWeeklyCalendar({
  appointments,
  blockedTimes,
  onReload,
}: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [localAppointments, setLocalAppointments] = useState<Appointment[]>(appointments);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [weekAnchor, setWeekAnchor] = useState(new Date());
  const [openQuickModal, setOpenQuickModal] = useState(false);
  const [quickCreateDate, setQuickCreateDate] = useState<string | null>(null);

  useEffect(() => {
    setLocalAppointments(appointments);
  }, [appointments]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const weekStart = startOfWeek(weekAnchor, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const slots = useMemo(() => {
    const items: { id: string; date: Date; top: number }[] = [];

    for (const day of days) {
      for (let hour = START_HOUR; hour < END_HOUR; hour++) {
        for (const minute of [0, 30]) {
          const date = new Date(day);
          date.setHours(hour, minute, 0, 0);

          items.push({
            id: slotIdFromDate(date),
            date,
            top: toY(date),
          });
        }
      }
    }

    return items;
  }, [days]);

  const activeAppointment = activeId
    ? localAppointments.find((item) => item.id === activeId) ?? null
    : null;

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const appointmentId = String(active.id);
    const overId = String(over.id);

    if (!overId.startsWith("slot:")) return;

    const nextDate = clampDateToCalendar(dateFromSlotId(overId));

    const optimistic = localAppointments.map((item) =>
      item.id === appointmentId
        ? {
            ...item,
            date: nextDate.toISOString(),
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

  return (
    <>
      <div className="mt-10 overflow-hidden border border-[#ECE7DD] bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-[#ECE7DD] bg-[#FCFAF6] p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-medium text-[#111827]">Agenda semanal interativa</h2>
            <p className="mt-1 text-sm text-[#64748B]">
              Arraste consultas para reagendar ou clique em um horário para criar.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setWeekAnchor((prev) => subDays(prev, 7))}
              className="h-10 border border-[#ECE7DD] bg-white px-4 text-sm font-medium text-[#111827]"
            >
              Semana anterior
            </button>

            <button
              type="button"
              onClick={() => setWeekAnchor(new Date())}
              className="h-10 border border-[#ECE7DD] bg-white px-4 text-sm font-medium text-[#111827]"
            >
              Hoje
            </button>

            <button
              type="button"
              onClick={() => setWeekAnchor((prev) => addDays(prev, 7))}
              className="h-10 border border-[#ECE7DD] bg-white px-4 text-sm font-medium text-[#111827]"
            >
              Próxima semana
            </button>
          </div>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={(event) => setActiveId(String(event.active.id))}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveId(null)}
        >
          <div className="grid grid-cols-[72px_repeat(7,minmax(0,1fr))]">
            <div className="border-r border-[#ECE7DD] bg-white" />

            {days.map((day) => (
              <div
                key={day.toISOString()}
                className="border-r border-[#ECE7DD] p-3 text-center last:border-r-0"
              >
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#8E9AAF]">
                  {format(day, "EEE", { locale: ptBR })}
                </p>
                <p className="mt-1 text-sm font-semibold text-[#111827]">
                  {format(day, "dd/MM")}
                </p>
              </div>
            ))}

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

            {days.map((day) => {
              const dayAppointments = localAppointments.filter(
                (a) => dayKey(new Date(a.date)) === dayKey(day)
              );

              const dayBlocked = blockedTimes.filter(
                (b) => dayKey(new Date(b.start)) === dayKey(day)
              );

              return (
                <div
                  key={day.toISOString()}
                  className="relative border-r border-[#ECE7DD] last:border-r-0"
                  style={{ height: DAY_COLUMN_HEIGHT }}
                >
                  {slots
                    .filter((slot) => dayKey(slot.date) === dayKey(day))
                    .map((slot) => (
                      <DroppableSlot
                        key={slot.id}
                        id={slot.id}
                        top={slot.top}
                        onClick={() => {
                          setQuickCreateDate(slot.date.toISOString());
                          setOpenQuickModal(true);
                        }}
                      />
                    ))}

                  {dayBlocked.map((block) => {
                    const start = new Date(block.start);
                    const end = new Date(block.end);
                    const top = toY(start);
                    const duration = Math.max(
                      SLOT_HEIGHT,
                      ((end.getTime() - start.getTime()) / 60000 / SLOT_MINUTES) *
                        SLOT_HEIGHT
                    );

                    return (
                      <div
                        key={block.id}
                        className="absolute left-1 right-1 rounded-xl border border-red-200 bg-red-50 p-2 text-xs text-red-700"
                        style={{
                          top,
                          height: duration,
                        }}
                      >
                        🔒 {block.reason || "Bloqueado"}
                      </div>
                    );
                  })}

                  {dayAppointments.map((appointment) => {
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
                        <DraggableAppointmentCard appointment={appointment} />
                        {savingId === appointment.id && (
                          <div className="absolute -top-2 right-2 rounded-full bg-[#111827] px-2 py-0.5 text-[10px] text-white">
                            Salvando...
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          <DragOverlay>
            {activeAppointment ? <OverlayCard appointment={activeAppointment} /> : null}
          </DragOverlay>
        </DndContext>
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
    </>
  );
}