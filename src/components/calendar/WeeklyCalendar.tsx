"use client";

import { format, addDays, startOfWeek, addMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";

type Appointment = {
  id: string;
  date: string;
  durationMinutes?: number;
  patient?: { name: string };
  procedureName?: string | null;
};

type BlockedTime = {
  id: string;
  start: string;
  end: string;
  reason?: string | null;
};

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 08h → 19h

export default function WeeklyCalendar({
  appointments,
  blockedTimes,
}: {
  appointments: Appointment[];
  blockedTimes: BlockedTime[];
}) {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  function getAppointmentsForDay(day: Date) {
    return appointments.filter((a) => {
      const d = new Date(a.date);
      return d.toDateString() === day.toDateString();
    });
  }

  function getBlockedForDay(day: Date) {
    return blockedTimes.filter((b) => {
      const d = new Date(b.start);
      return d.toDateString() === day.toDateString();
    });
  }

  return (
    <div className="mt-10 border border-[#ECE7DD] bg-white shadow-sm">
      <div className="grid grid-cols-8 border-b">
        <div className="p-3 text-xs text-gray-400"></div>

        {days.map((day) => (
          <div key={day.toISOString()} className="p-3 text-center">
            <p className="text-xs text-gray-400">
              {format(day, "EEE", { locale: ptBR })}
            </p>
            <p className="text-sm font-semibold">
              {format(day, "dd/MM")}
            </p>
          </div>
        ))}
      </div>

      {HOURS.map((hour) => (
        <div key={hour} className="grid grid-cols-8 border-b">
          <div className="p-3 text-xs text-gray-400">
            {hour}:00
          </div>

          {days.map((day) => {
            const dayAppointments = getAppointmentsForDay(day);
            const dayBlocked = getBlockedForDay(day);

            return (
              <div key={day.toISOString() + hour} className="relative h-20 border-l">
                
                {/* APPOINTMENTS */}
                {dayAppointments.map((a) => {
                  const d = new Date(a.date);
                  if (d.getHours() !== hour) return null;

                  return (
                    <div
                      key={a.id}
                      className="absolute left-1 right-1 top-1 rounded bg-[#111827] p-2 text-xs text-white"
                      style={{
                        height: `${(a.durationMinutes ?? 30) * 1.2}px`,
                      }}
                    >
                      <div className="font-semibold">
                        {a.patient?.name ?? "Paciente"}
                      </div>
                      <div className="text-[10px] opacity-80">
                        {a.procedureName ?? "Consulta"}
                      </div>
                    </div>
                  );
                })}

                {/* BLOCKED */}
                {dayBlocked.map((b) => {
                  const start = new Date(b.start);
                  if (start.getHours() !== hour) return null;

                  const duration =
                    (new Date(b.end).getTime() - start.getTime()) / 60000;

                  return (
                    <div
                      key={b.id}
                      className="absolute left-1 right-1 top-1 rounded bg-red-200 p-2 text-xs text-red-800"
                      style={{
                        height: `${duration * 1.2}px`,
                      }}
                    >
                      🔒 {b.reason || "Bloqueado"}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}