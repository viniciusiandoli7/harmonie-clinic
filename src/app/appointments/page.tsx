"use client";

import { useState, useMemo } from "react";
import { 
  ChevronLeft, ChevronRight, Search, Clock, Plus, 
  MoreHorizontal, Trash2, Edit3, Bell, MapPin 
} from "lucide-react";

// --- CONFIGURAÇÕES ---
const PROCEDIMENTOS = [
  "ULTRASSOM MICRO E MACROFOCADO", "TOXINA BOTULÍNICA", "SKINBOOSTER",
  "PREENCHIMENTO", "PEIM", "PEELING", "PDRN", "MICROAGULHAMENTO",
  "MESOTERAPIA", "LIMPEZA DE PELE PROFUNDA", "LAVIEEN", "JATO DE PLASMA",
  "FIOS DE PDO BIOESTIMULADOR"
];

const HOURS = Array.from({ length: 25 }, (_, i) => {
  const hour = Math.floor(i / 2) + 8;
  const min = i % 2 === 0 ? "00" : "30";
  return `${hour.toString().padStart(2, '0')}:${min}`;
});

const DIAS_SEMANA_NOMES = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

interface Appointment {
  id: string;
  patient: string;
  procedure: string;
  date: string; // formato YYYY-MM-DD
  time: string;
  room: "SALA A" | "SALA B";
  duration: string;
}

export default function AgendaPage() {
  const [view, setView] = useState<"DIA" | "SEMANA" | "MES">("DIA");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  // --- ESTADO DE AGENDAMENTOS (Exemplos) ---
  const [appointments, setAppointments] = useState<Appointment[]>([
    { id: "1", patient: "MARIA SILVA", procedure: "TOXINA BOTULÍNICA", date: "2026-04-01", time: "10:00", room: "SALA A", duration: "60 MIN" },
    { id: "2", patient: "VINICIUS TESTE", procedure: "LAVIEEN", date: "2026-04-02", time: "14:30", room: "SALA B", duration: "30 MIN" }
  ]);

  const [formData, setFormData] = useState({ 
    patient: "", procedure: "", time: "08:00", room: "SALA A" as "SALA A" | "SALA B" 
  });

  // --- AUXILIARES DE DATA ---
  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const days = [];
    const lastDay = new Date(year, month + 1, 0).getDate();
    
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= lastDay; i++) days.push(new Date(year, month, i));
    return days;
  };

  const currentWeekDays = useMemo(() => {
    const start = new Date(currentDate);
    start.setDate(currentDate.getDate() - currentDate.getDay());
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [currentDate]);

  // --- LÓGICA DE NAVEGAÇÃO ---
  const handleHoje = () => setCurrentDate(new Date());
  const changeDate = (amount: number) => {
    const newDate = new Date(currentDate);
    if (view === "DIA") newDate.setDate(newDate.getDate() + amount);
    if (view === "SEMANA") newDate.setDate(newDate.getDate() + (amount * 7));
    if (view === "MES") newDate.setMonth(newDate.getMonth() + amount);
    setCurrentDate(newDate);
  };

  // --- DRAG & DROP UNIFICADO ---
  const onDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("appointmentId", id);
  };

  const updateAppointment = (id: string, updates: Partial<Appointment>) => {
    setAppointments(prev => prev.map(app => app.id === id ? { ...app, ...updates } : app));
  };

  const handleDrop = (e: React.DragEvent, targetDate: string, targetTime?: string, targetRoom?: "SALA A" | "SALA B") => {
    e.preventDefault();
    const id = e.dataTransfer.getData("appointmentId");
    const updates: Partial<Appointment> = { date: targetDate };
    if (targetTime) updates.time = targetTime;
    if (targetRoom) updates.room = targetRoom;
    updateAppointment(id, updates);
  };

  return (
    <div className="flex h-screen bg-[#FAFAFA] font-sans antialiased text-[#1A1A1A] overflow-hidden text-[11px]">
      
      {/* SIDEBAR AGENDAMENTO */}
      <aside className="w-[300px] bg-white border-r border-[#EEECE7] p-6 overflow-y-auto flex flex-col z-50">
        <div className="mb-6">
          <p className="text-[8px] font-bold tracking-[0.4em] text-[#C5A059] uppercase mb-1">Registration</p>
          <h3 className="text-xl font-serif italic text-[#000]">Agendar Sessão</h3>
          <div className="h-[1px] w-8 bg-[#C5A059] mt-2" />
        </div>
        
        <div className="space-y-5 flex-1">
          <div className="space-y-1">
            <label className="text-[9px] font-bold uppercase tracking-widest opacity-60">Paciente</label>
            <input value={formData.patient} onChange={e => setFormData({...formData, patient: e.target.value})} placeholder="BUSCAR NOME..." className="w-full py-1.5 border-b border-[#EEE] outline-none bg-transparent" />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-bold uppercase tracking-widest opacity-60">Procedimento</label>
            <select value={formData.procedure} onChange={e => setFormData({...formData, procedure: e.target.value})} className="w-full py-1.5 border-b border-[#EEE] bg-transparent outline-none uppercase font-medium">
              <option value="">Selecione...</option>
              {PROCEDIMENTOS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase tracking-widest opacity-60">Horário</label>
              <input type="time" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} className="w-full py-1 border-b border-[#EEE]" />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase tracking-widest opacity-60">Sala</label>
              <select value={formData.room} onChange={e => setFormData({...formData, room: e.target.value as any})} className="w-full py-1 border-b border-[#EEE]">
                <option value="SALA A">SALA A</option>
                <option value="SALA B">SALA B</option>
              </select>
            </div>
          </div>

          <button onClick={() => {
             const newApp = { id: Math.random().toString(), ...formData, date: formatDate(currentDate), duration: "60 MIN" };
             setAppointments([...appointments, newApp]);
          }} className="btn-primary w-full mt-4 !py-3">Confirmar Registro</button>
        </div>
      </aside>

      {/* ÁREA DA AGENDA */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        <header className="bg-white border-b border-[#EEECE7] px-8 py-4 flex justify-between items-center z-40">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-[#C5A059] mb-0.5">Harmonie Concierge</p>
            <h1 className="text-2xl font-serif italic capitalize text-[#000]">
              {currentDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </h1>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex bg-[#F5F5F5] p-1 border border-[#EEECE7] scale-90">
              {(["DIA", "SEMANA", "MES"] as const).map((t) => (
                <button key={t} onClick={() => setView(t)} className={`px-6 py-1.5 text-[9px] font-bold uppercase tracking-[0.2em] transition-all ${view === t ? "bg-white text-[#1A1A1A] shadow-sm" : "text-[#94A3B8] hover:text-[#1A1A1A]"}`}>{t}</button>
              ))}
            </div>

            <div className="flex items-center border border-[#EEECE7] p-1 bg-white scale-90">
              <button onClick={() => changeDate(-1)} className="p-1.5 hover:text-[#C5A059] transition-all"><ChevronLeft size={16}/></button>
              <button onClick={handleHoje} className="px-3 text-[9px] font-bold uppercase tracking-widest border-x border-[#EEECE7]">Hoje</button>
              <button onClick={() => changeDate(1)} className="p-1.5 hover:text-[#C5A059] transition-all"><ChevronRight size={16}/></button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-[#FAFAFA]">
          <div className="bg-white border border-[#EEECE7] max-w-[1600px] mx-auto shadow-sm">
            
            {/* --- VISUALIZAÇÃO DIA --- */}
            {view === "DIA" && (
              <>
                <div className="flex bg-white border-b border-[#EEECE7] ml-16 sticky top-0 z-30">
                  <div className="flex-1 py-3 text-center border-r border-[#EEECE7]"><span className="text-[9px] font-bold uppercase tracking-[0.3em]">SALA A (AVANÇADA)</span></div>
                  <div className="flex-1 py-3 text-center"><span className="text-[9px] font-bold uppercase tracking-[0.3em]">SALA B (BÁSICA)</span></div>
                </div>
                <div className="divide-y divide-[#F9F9F9]">
                  {HOURS.map(hour => (
                    <div key={hour} className="flex min-h-[60px]">
                      <div className="w-16 py-4 border-r border-[#EEECE7] flex justify-center items-start bg-[#FAFAFA]/50 font-sans text-[11px] opacity-60">{hour}</div>
                      <div className="flex-1 border-r border-[#F9F9F9] relative p-1" onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, formatDate(currentDate), hour, "SALA A")}>
                        {appointments.filter(a => a.time === hour && a.room === "SALA A" && a.date === formatDate(currentDate)).map(app => (
                          <AppointmentCard key={app.id} app={app} onDragStart={onDragStart} />
                        ))}
                      </div>
                      <div className="flex-1 relative p-1" onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, formatDate(currentDate), hour, "SALA B")}>
                        {appointments.filter(a => a.time === hour && a.room === "SALA B" && a.date === formatDate(currentDate)).map(app => (
                          <AppointmentCard key={app.id} app={app} onDragStart={onDragStart} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* --- VISUALIZAÇÃO SEMANA --- */}
            {view === "SEMANA" && (
              <div className="overflow-hidden">
                <div className="grid grid-cols-8 border-b border-[#EEECE7] bg-white sticky top-0 z-30">
                  <div className="w-16 border-r border-[#EEECE7]"></div>
                  {currentWeekDays.map(day => (
                    <div key={day.toString()} className="flex-1 py-3 text-center border-r border-[#EEECE7] last:border-0">
                      <span className="text-[9px] font-bold uppercase tracking-widest">{DIAS_SEMANA_NOMES[day.getDay()]} {day.getDate()}</span>
                    </div>
                  ))}
                </div>
                <div className="divide-y divide-[#F9F9F9]">
                  {HOURS.map(hour => (
                    <div key={hour} className="flex min-h-[55px]">
                      <div className="w-16 flex justify-center items-center border-r border-[#EEECE7] bg-[#FAFAFA] font-sans text-[10px] opacity-40">{hour}</div>
                      {currentWeekDays.map(day => (
                        <div key={day.toString()} className="flex-1 border-r border-[#F9F9F9] last:border-0 relative p-0.5" onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, formatDate(day), hour)}>
                          {appointments.filter(a => a.time === hour && a.date === formatDate(day)).map(app => (
                            <AppointmentCard key={app.id} app={app} onDragStart={onDragStart} compact />
                          ))}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* --- VISUALIZAÇÃO MÊS --- */}
            {view === "MES" && (
              <div className="grid grid-cols-7 border-collapse">
                {DIAS_SEMANA_NOMES.map(dia => (
                  <div key={dia} className="py-3 text-center border-b border-r border-[#EEECE7] bg-[#FAFAFA] text-[9px] font-bold tracking-widest">{dia}</div>
                ))}
                {getDaysInMonth(currentDate).map((day, i) => (
                  <div key={i} className="min-h-[110px] p-2 border-b border-r border-[#F5F5F5] transition-colors relative" onDragOver={e => e.preventDefault()} onDrop={e => day && handleDrop(e, formatDate(day))}>
                    {day && (
                      <>
                        <span className={`text-[13px] font-sans font-bold ${day.toDateString() === new Date().toDateString() ? 'text-[#C5A059]' : 'text-[#1A1A1A]'}`}>
                          {day.getDate()}
                        </span>
                        <div className="mt-1 space-y-1">
                          {appointments.filter(a => a.date === formatDate(day)).map(app => (
                            <div key={app.id} draggable onDragStart={e => onDragStart(e, app.id)} className="bg-[#C5A059] text-white p-1 text-[8px] font-bold uppercase truncate cursor-move shadow-sm border-l-2 border-black/20">
                              {app.time} {app.patient.split(' ')[0]}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}

// --- CARD REFINADO ---
function AppointmentCard({ app, onDragStart, compact }: any) {
  return (
    <div draggable onDragStart={e => onDragStart(e, app.id)} className="absolute inset-x-1 top-0.5 bottom-0.5 bg-[#C5A059] p-2 flex flex-col justify-center shadow-md cursor-move border-l-4 border-[#1A1A1A] z-20 transition-all hover:brightness-105 group/card">
      <p className="text-white text-[9px] font-extrabold uppercase tracking-wide truncate drop-shadow-sm">{app.patient}</p>
      {!compact && <p className="text-white/95 text-[8px] font-semibold truncate uppercase mt-0.5 leading-tight">{app.procedure}</p>}
    </div>
  );
}