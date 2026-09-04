"use client";

import { useCallback, useState, useMemo, useEffect } from "react";
import { ChevronLeft, ChevronRight, X, CalendarOff } from "lucide-react";
import AppointmentEditModal from "@/components/calendar/AppointmentEditModal";
import BlockedTimeQuickModal from "@/components/calendar/BlockedTimeQuickModal";
import BlockedTimeEditModal from "@/components/calendar/BlockedTimeEditModal";
import { CLINIC_PROCEDURES } from "@/constants/procedures";

// --- CONFIGURAÇÕES ---
const PROCEDIMENTOS = CLINIC_PROCEDURES;

const HOURS = Array.from({ length: 25 }, (_, i) => {
  const hour = Math.floor(i / 2) + 8;
  const min = i % 2 === 0 ? "00" : "30";
  return `${hour.toString().padStart(2, '0')}:${min}`;
});

const DIAS_SEMANA_NOMES = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

type BlockedTime = {
  id: string;
  start: string;
  end: string;
  reason?: string | null;
};

export default function AgendaPage() {
  const [view, setView] = useState<"DIA" | "SEMANA" | "MES">("DIA");
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // --- ESTADOS DO BANCO DE DADOS ---
  const [dbPatients, setDbPatients] = useState<any[]>([]);
  const [dbAppointments, setDbAppointments] = useState<any[]>([]);
  const [dbBlockedTimes, setDbBlockedTimes] = useState<BlockedTime[]>([]);
  const [editingAppointment, setEditingAppointment] = useState<any | null>(null);
  const [editingBlockedTime, setEditingBlockedTime] = useState<BlockedTime | null>(null);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [blockInitialDate, setBlockInitialDate] = useState<string | null>(null);
  
  // --- ESTADO DO FORMULÁRIO LATERAL ---
  const [searchPatient, setSearchPatient] = useState("");
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [formData, setFormData] = useState({ 
    patientId: "", 
    procedures: [] as string[], 
    date: formatDate(new Date()), 
    time: "08:00", 
    room: "SALA A" as "SALA A" | "SALA B" 
  });

  // --- CARREGAR DADOS DA API ---
  const visibleRange = useMemo(() => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);

    if (view === "DIA") {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (view === "SEMANA") {
      start.setDate(start.getDate() - start.getDay());
      start.setHours(0, 0, 0, 0);
      end.setTime(start.getTime());
      end.setDate(end.getDate() + 7);
      end.setMilliseconds(-1);
    } else {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setFullYear(start.getFullYear(), start.getMonth() + 1, 1);
      end.setHours(0, 0, 0, 0);
      end.setMilliseconds(-1);
    }

    return { start, end };
  }, [currentDate, view]);

  const loadPatients = useCallback(async () => {
    try {
      const res = await fetch("/api/patients?compact=true");
      const data = await res.json();
      setDbPatients(Array.isArray(data) ? data : (data.data || []));
    } catch (err) {
      console.error("Erro ao carregar pacientes", err);
    }
  }, []);

  const loadAppointments = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        dateFrom: visibleRange.start.toISOString(),
        dateTo: visibleRange.end.toISOString(),
      });
      const res = await fetch(`/api/appointments?${params.toString()}`);
      const data = await res.json();
      setDbAppointments(Array.isArray(data) ? data : (data.data || []));
    } catch (err) {
      console.error("Erro ao carregar agenda", err);
    }
  }, [visibleRange]);

  const loadBlockedTimes = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        dateFrom: visibleRange.start.toISOString(),
        dateTo: visibleRange.end.toISOString(),
      });
      const res = await fetch(`/api/blocked-times?${params.toString()}`);
      const data = await res.json();
      setDbBlockedTimes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erro ao carregar bloqueios da agenda", err);
    }
  }, [visibleRange]);

  useEffect(() => { void loadPatients(); }, [loadPatients]);
  useEffect(() => { void loadAppointments(); }, [loadAppointments]);
  useEffect(() => { void loadBlockedTimes(); }, [loadBlockedTimes]);

  // --- TRATAMENTO DOS DADOS PARA A TELA ---
  const parsedAppointments = useMemo(() => {
    return dbAppointments.filter(app => app.status !== "CANCELED").map(app => {
      const d = new Date(app.date);
      return {
        ...app,
        patientName: app.patient?.name || "Paciente Removido",
        localDate: formatDate(d),
        localTime: `${String(d.getHours()).padStart(2, '0')}:${d.getMinutes() < 30 ? '00' : '30'}`,
        uiRoom: app.room === "B" ? "SALA B" : "SALA A"
      };
    });
  }, [dbAppointments]);

  const filteredPatientsForSchedule = useMemo(() => {
    const term = searchPatient.trim().toLowerCase();
    const list = dbPatients
      .slice()
      .sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "pt-BR"));

    if (!term) return list;

    return list.filter((patient) =>
      [patient.name, patient.phone, patient.email]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [dbPatients, searchPatient]);

  // --- AUXILIARES DE DATA ---
  function formatDate(date: Date) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

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

  const getSlotRange = (day: Date, hour: string) => {
    const [h, min] = hour.split(":").map(Number);
    const start = new Date(day);
    start.setHours(h, min, 0, 0);
    const end = new Date(start.getTime() + 30 * 60 * 1000);
    return { start, end };
  };

  const getBlockedTimeForSlot = (day: Date, hour: string) => {
    const slot = getSlotRange(day, hour);
    return dbBlockedTimes.find((block) => {
      const start = new Date(block.start);
      const end = new Date(block.end);
      return start < slot.end && end > slot.start;
    });
  };

  const getBlockedTimesForDay = (day: Date) => {
    const startOfDay = new Date(day);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    return dbBlockedTimes.filter((block) => {
      const start = new Date(block.start);
      const end = new Date(block.end);
      return start < endOfDay && end > startOfDay;
    });
  };

  const openBlockModalFromForm = () => {
    if (!formData.date) return;
    const [y, m, d] = formData.date.split("-").map(Number);
    const [h, min] = formData.time.split(":").map(Number);
    const initial = new Date(y, m - 1, d, h, min, 0);
    setBlockInitialDate(initial.toISOString());
    setBlockModalOpen(true);
  };

  // --- LÓGICA DE NAVEGAÇÃO ---
  const handleHoje = () => {
    setCurrentDate(new Date());
    setFormData(prev => ({ ...prev, date: formatDate(new Date()) }));
  };

  const changeDate = (amount: number) => {
    const newDate = new Date(currentDate);
    if (view === "DIA") newDate.setDate(newDate.getDate() + amount);
    if (view === "SEMANA") newDate.setDate(newDate.getDate() + (amount * 7));
    if (view === "MES") newDate.setMonth(newDate.getMonth() + amount);
    setCurrentDate(newDate);
    
    if (view === "DIA") setFormData(prev => ({ ...prev, date: formatDate(newDate) }));
  };

  // --- SALVAR NOVO AGENDAMENTO (API) ---
  const handleCreateAppointment = async () => {
    if (!formData.patientId || formData.procedures.length === 0 || !formData.date || !formData.time) {
      return alert("Preencha o paciente, a data, o horário e adicione pelo menos um procedimento.");
    }

    const [y, m, d] = formData.date.split('-');
    const [h, min] = formData.time.split(':');
    const dateObj = new Date(Number(y), Number(m)-1, Number(d), Number(h), Number(min), 0);

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: formData.patientId,
          date: dateObj.toISOString(),
          durationMinutes: 60,
          procedureName: formData.procedures.join(" + "),
          room: formData.room === "SALA B" ? "B" : "A",
          status: "SCHEDULED",
          paymentStatus: "PENDING",
          price: null,
          notes: null
        })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errMsg = data?.error?.formErrors?.[0] ?? data?.error ?? data?.message ?? "Erro desconhecido na API";
        throw new Error(errMsg);
      }
      
      setSearchPatient("");
      setShowPatientDropdown(false);
      setFormData(prev => ({ ...prev, patientId: "", procedures: [] }));
      loadAppointments();
    } catch (err: any) {
      alert(`Ocorreu um erro ao agendar:\n${err.message}`);
    }
  };

  // --- ARRASTAR E SOLTAR (API) ---
  const onDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("appointmentId", id);
  };

  const handleDrop = async (e: React.DragEvent, targetDate: string, targetTime?: string, targetRoom?: "SALA A" | "SALA B") => {
    e.preventDefault();
    const id = e.dataTransfer.getData("appointmentId");
    const app = dbAppointments.find(a => a.id === id);
    if(!app) return;

    const [y, m, d] = targetDate.split('-');
    let h = 8, min = 0;
    if (targetTime) {
      const parts = targetTime.split(':');
      h = parseInt(parts[0]);
      min = parseInt(parts[1]);
    } else {
      const oldD = new Date(app.date);
      h = oldD.getHours();
      min = oldD.getMinutes();
    }

    const newDate = new Date(Number(y), Number(m)-1, Number(d), h, min, 0);

    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: newDate.toISOString(),
          room: targetRoom ? (targetRoom === "SALA B" ? "B" : "A") : app.room
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || data?.message || "Não foi possível mover o agendamento.");
      }
      void loadAppointments();
    } catch(err) {
      alert(err instanceof Error ? err.message : "Não foi possível mover o agendamento.");
    }
  };

  return (
    <div className="flex h-screen bg-[#F7F2EA] font-sans antialiased text-[#1E1A18] overflow-hidden text-[11px]">
      
      {/* SIDEBAR AGENDAMENTO */}
      <aside className="w-75 bg-white border-r border-[#EEECE7] p-6 overflow-y-auto flex flex-col z-50 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="mb-6">
          <p className="text-[8px] font-bold tracking-[0.4em] text-[#5A1F2B] uppercase mb-1">Registration</p>
          <h3 className="text-xl font-serif italic text-black">Agendar Sessão</h3>
          <div className="h-px w-8 bg-[#5A1F2B] mt-2" />
        </div>
        
        <div className="space-y-5 flex-1">
          <div className="space-y-1 relative">
            <label className="text-[9px] font-bold uppercase tracking-widest opacity-60">Paciente</label>
            <input
              value={searchPatient}
              onFocus={() => setShowPatientDropdown(true)}
              onChange={e => {
                const value = e.target.value;
                setSearchPatient(value);
                setShowPatientDropdown(true);

                const exact = dbPatients.find(p => String(p.name || "").toLowerCase() === value.trim().toLowerCase());
                setFormData({ ...formData, patientId: exact?.id || "" });
              }}
              placeholder="Buscar ou selecionar paciente..."
              className="w-full py-2 border-b border-[#EEE] bg-transparent outline-none uppercase font-medium focus:border-[#5A1F2B] transition-colors"
            />
            {showPatientDropdown && (
              <div className="absolute left-0 right-0 top-full z-[80] mt-2 max-h-64 overflow-y-auto rounded-2xl border border-[#E9DEC9] bg-white shadow-[0_18px_45px_rgba(90,31,43,.14)]">
                {filteredPatientsForSchedule.length === 0 ? (
                  <div className="px-4 py-3 text-[11px] text-[#5B3A2E]/60">Nenhum paciente encontrado.</div>
                ) : (
                  filteredPatientsForSchedule.map((patient) => (
                    <button
                      key={patient.id}
                      type="button"
                      onClick={() => {
                        setSearchPatient(patient.name || "");
                        setFormData({ ...formData, patientId: patient.id });
                        setShowPatientDropdown(false);
                      }}
                      className="block w-full border-b border-[#F4EEE6] px-4 py-3 text-left text-[12px] font-bold uppercase tracking-[0.06em] text-[#1E1A18] hover:bg-[#F7F2EA]"
                    >
                      {patient.name}
                      {patient.phone && <span className="ml-2 font-normal text-[#5B3A2E]/55">{patient.phone}</span>}
                    </button>
                  ))
                )}
              </div>
            )}
            {formData.patientId && (
              <button
                type="button"
                onClick={() => {
                  setSearchPatient("");
                  setFormData({ ...formData, patientId: "" });
                }}
                className="mt-2 text-[9px] font-bold uppercase tracking-[0.18em] text-[#5A1F2B]/70"
              >
                Limpar paciente
              </button>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-bold uppercase tracking-widest opacity-60">Procedimentos</label>
            <select 
              value="" 
              onChange={e => {
                const val = e.target.value;
                if (val && !formData.procedures.includes(val)) {
                  setFormData({...formData, procedures: [...formData.procedures, val]});
                }
              }} 
              className="w-full py-1.5 border-b border-[#EEE] bg-transparent outline-none uppercase font-medium focus:border-[#5A1F2B] transition-colors"
            >
              <option value="">Adicionar procedimento...</option>
              {PROCEDIMENTOS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            
            <div className="flex flex-wrap gap-1.5 mt-2">
              {formData.procedures.map(proc => (
                <span key={proc} className="inline-flex items-center gap-1.5 bg-[#F7F2EA] border border-[#E9DEC9] text-[#5A1F2B] text-[8px] font-bold px-2 py-1 rounded uppercase">
                  {proc}
                  <button type="button" onClick={() => setFormData({...formData, procedures: formData.procedures.filter(p => p !== proc)})} className="hover:text-red-500 transition-colors">
                    <X size={10} strokeWidth={3} />
                  </button>
                </span>
              ))}
              {formData.procedures.length === 0 && (
                <span className="text-[9px] text-gray-400 italic">Nenhum selecionado</span>
              )}
            </div>
          </div>

          <div className="space-y-1">
             <label className="text-[9px] font-bold uppercase tracking-widest opacity-60">Data</label>
             <input 
               type="date" 
               value={formData.date} 
               onChange={e => {
                 setFormData({...formData, date: e.target.value});
                 if(e.target.value) {
                   const [y, m, d] = e.target.value.split('-');
                   setCurrentDate(new Date(Number(y), Number(m)-1, Number(d)));
                   setView("DIA");
                 }
               }} 
               className="w-full py-1.5 border-b border-[#EEE] bg-transparent outline-none focus:border-[#5A1F2B] transition-colors" 
             />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase tracking-widest opacity-60">Horário</label>
              <select
                value={formData.time}
                onChange={e => setFormData(prev => ({ ...prev, time: e.target.value }))}
                aria-label="Horário do agendamento"
                className="w-full py-1.5 border-b border-[#EEE] bg-transparent outline-none focus:border-[#5A1F2B] transition-colors cursor-pointer"
              >
                {HOURS.map(hour => (
                  <option key={hour} value={hour}>{hour}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase tracking-widest opacity-60">Sala</label>
              <select 
                value={formData.room} 
                onChange={e => setFormData({...formData, room: e.target.value as any})} 
                className="w-full py-1.5 border-b border-[#EEE] bg-transparent outline-none focus:border-[#5A1F2B] transition-colors"
              >
                <option value="SALA A">SALA A</option>
                <option value="SALA B">SALA B</option>
              </select>
            </div>
          </div>

          <button 
            onClick={handleCreateAppointment} 
            className="w-full mt-6 bg-[#1E1A18] hover:bg-[#5A1F2B] text-white py-3.5 rounded-sm text-[10px] font-bold uppercase tracking-[0.2em] transition-all shadow-md active:scale-95"
          >
            Confirmar Registro
          </button>

          <button
            type="button"
            onClick={openBlockModalFromForm}
            className="w-full mt-2 border border-[#5A1F2B]/25 bg-[#F7F2EA] hover:bg-[#F1E8DE] text-[#5A1F2B] py-3 rounded-sm text-[9px] font-bold uppercase tracking-[0.18em] transition-all flex items-center justify-center gap-2"
          >
            <CalendarOff size={14} /> Bloquear horário / diária
          </button>
          <p className="mt-2 text-[9px] leading-relaxed text-[#94A3B8]">
            Use para marcar dias em outras clínicas, compromissos ou períodos indisponíveis.
          </p>
        </div>
      </aside>

      {/* ÁREA DA AGENDA */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-[#EEECE7] px-8 py-4 flex justify-between items-center z-40">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-[#5A1F2B] mb-0.5">Mariana Concierge</p>
            <h1 className="text-2xl font-serif italic capitalize text-black">
              {currentDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </h1>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex bg-[#F5F5F5] p-1 border border-[#EEECE7] scale-90 rounded-sm">
              {(["DIA", "SEMANA", "MES"] as const).map((t) => (
                <button 
                  key={t} 
                  onClick={() => setView(t)} 
                  className={`px-6 py-1.5 text-[9px] font-bold uppercase tracking-[0.2em] transition-all rounded-sm ${view === t ? "bg-white text-[#1E1A18] shadow-sm" : "text-[#94A3B8] hover:text-[#1E1A18]"}`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="flex items-center border border-[#EEECE7] p-1 bg-white scale-90 rounded-sm shadow-sm">
              <button onClick={() => changeDate(-1)} className="p-1.5 hover:text-[#5A1F2B] transition-all"><ChevronLeft size={16}/></button>
              <button onClick={handleHoje} className="px-3 text-[9px] font-bold uppercase tracking-widest border-x border-[#EEECE7] hover:text-[#5A1F2B] transition-colors">Hoje</button>
              <button onClick={() => changeDate(1)} className="p-1.5 hover:text-[#5A1F2B] transition-all"><ChevronRight size={16}/></button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-[#F7F2EA]">
          <div className="bg-white border border-[#EEECE7] max-w-400 mx-auto shadow-sm rounded-sm overflow-hidden">
            
            {/* --- VISUALIZAÇÃO DIA --- */}
            {view === "DIA" && (
              <>
                <div className="flex bg-white border-b border-[#EEECE7] ml-16 sticky top-0 z-30">
                  <div className="flex-1 py-3 text-center border-r border-[#EEECE7] bg-[#FCFAF6]"><span className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#5A1F2B]">SALA A (AVANÇADA)</span></div>
                  <div className="flex-1 py-3 text-center bg-[#FCFAF6]"><span className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#5A1F2B]">SALA B (BÁSICA)</span></div>
                </div>
                <div className="divide-y divide-[#F9F9F9]">
                  {HOURS.map(hour => (
                    <div key={hour} className="flex min-h-15 group/row">
                      <div className="w-16 py-4 border-r border-[#EEECE7] flex justify-center items-start bg-[#F7F2EA] font-sans text-[11px] text-[#94A3B8] font-medium">{hour}</div>
                      <div className="flex-1 border-r border-[#F9F9F9] relative p-1 transition-colors hover:bg-gray-50/50" onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, formatDate(currentDate), hour, "SALA A")}>
                        {getBlockedTimeForSlot(currentDate, hour) && (
                          <BlockedSlotCard
                            block={getBlockedTimeForSlot(currentDate, hour)!}
                            onClick={() => setEditingBlockedTime(getBlockedTimeForSlot(currentDate, hour)!)}
                          />
                        )}
                        {parsedAppointments.filter(a => a.localTime === hour && a.uiRoom === "SALA A" && a.localDate === formatDate(currentDate)).map(app => (
                          <AppointmentCard key={app.id} app={app} onDragStart={onDragStart} onClick={() => setEditingAppointment(app)} />
                        ))}
                      </div>
                      <div className="flex-1 relative p-1 transition-colors hover:bg-gray-50/50" onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, formatDate(currentDate), hour, "SALA B")}>
                        {getBlockedTimeForSlot(currentDate, hour) && (
                          <BlockedSlotCard
                            block={getBlockedTimeForSlot(currentDate, hour)!}
                            onClick={() => setEditingBlockedTime(getBlockedTimeForSlot(currentDate, hour)!)}
                          />
                        )}
                        {parsedAppointments.filter(a => a.localTime === hour && a.uiRoom === "SALA B" && a.localDate === formatDate(currentDate)).map(app => (
                          <AppointmentCard key={app.id} app={app} onDragStart={onDragStart} onClick={() => setEditingAppointment(app)} />
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
                <div className="grid grid-cols-8 border-b border-[#EEECE7] bg-[#FCFAF6] sticky top-0 z-30">
                  <div className="w-16 border-r border-[#EEECE7]"></div>
                  {currentWeekDays.map(day => (
                    <div key={day.toString()} className="flex-1 py-3 text-center border-r border-[#EEECE7] last:border-0">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-[#5A1F2B]">{DIAS_SEMANA_NOMES[day.getDay()]} {day.getDate()}</span>
                    </div>
                  ))}
                </div>
                <div className="divide-y divide-[#F9F9F9]">
                  {HOURS.map(hour => (
                    <div key={hour} className="flex min-h-13.75">
                      <div className="w-16 flex justify-center items-center border-r border-[#EEECE7] bg-[#F7F2EA] font-sans text-[10px] text-[#94A3B8] font-medium">{hour}</div>
                      {currentWeekDays.map(day => (
                        <div key={day.toString()} className="flex-1 border-r border-[#F9F9F9] last:border-0 relative p-0.5 transition-colors hover:bg-gray-50/50" onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, formatDate(day), hour)}>
                          {getBlockedTimeForSlot(day, hour) && (
                            <BlockedSlotCard
                              block={getBlockedTimeForSlot(day, hour)!}
                              compact
                              onClick={() => setEditingBlockedTime(getBlockedTimeForSlot(day, hour)!)}
                            />
                          )}
                          {parsedAppointments.filter(a => a.localTime === hour && a.localDate === formatDate(day)).map(app => (
                            <AppointmentCard key={app.id} app={app} onDragStart={onDragStart} compact onClick={() => setEditingAppointment(app)} />
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
                  <div key={dia} className="py-3 text-center border-b border-r border-[#EEECE7] bg-[#FCFAF6] text-[9px] font-bold tracking-widest text-[#5A1F2B]">{dia}</div>
                ))}
                {getDaysInMonth(currentDate).map((day, i) => (
                  <div 
                    key={i} 
                    className={`min-h-27.5 p-2 border-b border-r border-[#F5F5F5] transition-colors relative group/day ${day ? 'cursor-pointer hover:bg-[#F7F2EA]' : ''}`}
                    onDragOver={e => e.preventDefault()} 
                    onDrop={e => day && handleDrop(e, formatDate(day))}
                    onClick={() => {
                      if (day) {
                        setCurrentDate(day);
                        setFormData(prev => ({ ...prev, date: formatDate(day) }));
                        setView("DIA");
                      }
                    }}
                  >
                    {day && (
                      <>
                        <span className={`text-[13px] font-sans font-bold w-6 h-6 flex items-center justify-center rounded-full transition-colors ${day.toDateString() === new Date().toDateString() ? 'bg-[#5A1F2B] text-white' : 'text-[#1E1A18] group-hover/day:bg-gray-200'}`}>
                          {day.getDate()}
                        </span>
                        <div className="mt-1 space-y-1">
                          {getBlockedTimesForDay(day).map((block) => (
                            <button
                              key={`block-${block.id}`}
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setEditingBlockedTime(block); }}
                              className="w-full bg-[#F4E8E8] border border-[#DCC2C7] text-[#5A1F2B] p-1.5 text-left text-[8px] font-bold uppercase truncate shadow-sm border-l-2 border-l-[#5A1F2B] hover:bg-[#ECDCDD] transition-colors flex items-center gap-1"
                            >
                              <CalendarOff size={9} className="shrink-0" />
                              <span className="truncate">{formatBlockedTimeLabel(block)}</span>
                            </button>
                          ))}
                          {parsedAppointments.filter(a => a.localDate === formatDate(day)).map(app => (
                            <div 
                              key={app.id} 
                              draggable 
                              onDragStart={e => { e.stopPropagation(); onDragStart(e, app.id); }} 
                              onClick={(e) => { e.stopPropagation(); setEditingAppointment(app); }} 
                              className="bg-white border border-[#EEECE7] text-[#1E1A18] p-1.5 text-[8px] font-bold uppercase truncate cursor-move shadow-sm border-l-2 border-l-[#5A1F2B] hover:bg-[#F7F2EA] transition-colors"
                            >
                              <span className="text-[#5A1F2B] mr-1">{app.localTime}</span> 
                              {app.patientName.split(' ')[0]}
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

      {/* 🛡️ MODAL PARA EXCLUIR / EDITAR */}
      <AppointmentEditModal
        open={!!editingAppointment}
        appointment={editingAppointment}
        onClose={() => setEditingAppointment(null)}
        onSaved={loadAppointments}
      />

      <BlockedTimeQuickModal
        open={blockModalOpen}
        initialDate={blockInitialDate}
        onClose={() => setBlockModalOpen(false)}
        onSaved={loadBlockedTimes}
      />

      <BlockedTimeEditModal
        open={!!editingBlockedTime}
        blockedTime={editingBlockedTime}
        onClose={() => setEditingBlockedTime(null)}
        onSaved={loadBlockedTimes}
      />
    </div>
  );
}

function formatBlockedTimeLabel(block: BlockedTime) {
  const start = new Date(block.start);
  const end = new Date(block.end);
  const time = `${start.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}–${end.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
  return `${time} • ${block.reason?.trim() || "Bloqueado"}`;
}

function BlockedSlotCard({ block, compact, onClick }: { block: BlockedTime; compact?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className="absolute inset-x-1 top-0.5 bottom-0.5 z-10 border border-[#DCC2C7] border-l-4 border-l-[#5A1F2B] bg-[#F4E8E8]/95 px-2 text-left shadow-sm transition hover:bg-[#ECDCDD]"
      title={formatBlockedTimeLabel(block)}
    >
      <div className="flex items-center gap-1 text-[#5A1F2B]">
        <CalendarOff size={compact ? 10 : 11} className="shrink-0" />
        <span className={`${compact ? "text-[7px]" : "text-[8px]"} font-extrabold uppercase tracking-wide truncate`}>
          {block.reason?.trim() || "Bloqueado"}
        </span>
      </div>
    </button>
  );
}

// --- CARD REFINADO ---
function AppointmentCard({ app, onDragStart, compact, onClick }: any) {
  return (
    <div 
      draggable 
      onDragStart={e => onDragStart(e, app.id)} 
      onClick={onClick}
      className="absolute inset-x-1 top-0.5 bottom-0.5 bg-white border border-[#EEECE7] p-2 flex flex-col justify-center shadow-sm cursor-move border-l-4 border-l-[#5A1F2B] z-20 transition-all hover:shadow-md hover:border-[#5A1F2B] group/card rounded-sm"
    >
      <p className="text-[#1E1A18] text-[9px] font-extrabold uppercase tracking-wide truncate">{app.patientName}</p>
      {!compact && <p className="text-[#94A3B8] text-[8px] font-semibold truncate uppercase mt-0.5 leading-tight">{app.procedureName}</p>}
    </div>
  );
}
