"use client";

import { useState, useMemo, useEffect } from "react";
import { 
  ChevronLeft, ChevronRight, Search, Clock, Plus, 
  MoreHorizontal, Trash2, Edit3, Bell, MapPin, X 
} from "lucide-react";
import AppointmentEditModal from "@/components/calendar/AppointmentEditModal";

// --- CONFIGURAÇÕES ---
const PROCEDIMENTOS = [
  "Consulta", "Retorno", "Ultrassom Micro e Macrofocado", "Toxina Botulínica",
  "Skinbooster", "Preenchimento", "PEIM", "Peeling", "PDRN", "Microagulhamento",
  "Mesoterapia", "Limpeza de Pele Profunda", "Lavieen", "Jato de Plasma",
  "Fios de PDO", "Bioestimulador", "Intradermoterapia local", "Intradermoterapia IM"
];

const HOURS = Array.from({ length: 25 }, (_, i) => {
  const hour = Math.floor(i / 2) + 8;
  const min = i % 2 === 0 ? "00" : "30";
  return `${hour.toString().padStart(2, '0')}:${min}`;
});

const DIAS_SEMANA_NOMES = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

export default function AgendaPage() {
  const [view, setView] = useState<"DIA" | "SEMANA" | "MES">("DIA");
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // --- ESTADOS DO BANCO DE DADOS ---
  const [dbPatients, setDbPatients] = useState<any[]>([]);
  const [dbAppointments, setDbAppointments] = useState<any[]>([]);
  const [editingAppointment, setEditingAppointment] = useState<any | null>(null);
  
  // --- ESTADO DO FORMULÁRIO LATERAL ---
  const [searchPatient, setSearchPatient] = useState("");
  const [formData, setFormData] = useState({ 
    patientId: "", 
    procedures: [] as string[], 
    date: formatDate(new Date()), 
    time: "08:00", 
    room: "SALA A" as "SALA A" | "SALA B" 
  });

  // --- CARREGAR DADOS DA API ---
  const loadData = async () => {
    try {
      const [pRes, aRes] = await Promise.all([
        fetch("/api/patients"),
        fetch("/api/appointments")
      ]);
      setDbPatients(await pRes.json());
      setDbAppointments(await aRes.json());
    } catch (err) {
      console.error("Erro ao carregar dados", err);
    }
  };

  useEffect(() => { loadData(); }, []);

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
    if (!formData.patientId || formData.procedures.length === 0 || !formData.date) {
      return alert("Preencha o paciente, a data e adicione pelo menos um procedimento.");
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
          paymentStatus: "PENDING"
        })
      });

      if (!res.ok) throw new Error("Erro ao salvar");
      
      setSearchPatient("");
      setFormData(prev => ({ ...prev, patientId: "", procedures: [] }));
      loadData();
    } catch (err) {
      alert("Ocorreu um erro ao agendar.");
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
      await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: newDate.toISOString(),
          room: targetRoom ? (targetRoom === "SALA B" ? "B" : "A") : app.room
        })
      });
      loadData();
    } catch(err) {
      console.error(err);
    }
  };

  return (
    <div className="flex h-screen bg-[#FAFAFA] font-sans antialiased text-[#1A1A1A] overflow-hidden text-[11px]">
      
      {/* SIDEBAR AGENDAMENTO */}
      <aside className="w-75 bg-white border-r border-[#EEECE7] p-6 overflow-y-auto flex flex-col z-50 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="mb-6">
          <p className="text-[8px] font-bold tracking-[0.4em] text-[#C5A059] uppercase mb-1">Registration</p>
          <h3 className="text-xl font-serif italic text-black">Agendar Sessão</h3>
          <div className="h-px w-8 bg-[#C5A059] mt-2" />
        </div>
        
        <div className="space-y-5 flex-1">
          <div className="space-y-1">
            <label className="text-[9px] font-bold uppercase tracking-widest opacity-60">Paciente</label>
            <input 
              list="patients-list"
              value={searchPatient} 
              onChange={e => {
                setSearchPatient(e.target.value);
                const found = dbPatients.find(p => p.name.toLowerCase() === e.target.value.toLowerCase());
                if(found) setFormData({...formData, patientId: found.id});
                else setFormData({...formData, patientId: ""});
              }} 
              placeholder="BUSCAR NOME..." 
              className="w-full py-1.5 border-b border-[#EEE] outline-none bg-transparent focus:border-[#C5A059] transition-colors" 
            />
            <datalist id="patients-list">
              {dbPatients.map(p => <option key={p.id} value={p.name} />)}
            </datalist>
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
              className="w-full py-1.5 border-b border-[#EEE] bg-transparent outline-none uppercase font-medium focus:border-[#C5A059] transition-colors"
            >
              <option value="">Adicionar procedimento...</option>
              {PROCEDIMENTOS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            
            <div className="flex flex-wrap gap-1.5 mt-2">
              {formData.procedures.map(proc => (
                <span key={proc} className="inline-flex items-center gap-1.5 bg-[#FAF8F3] border border-[#E9DEC9] text-[#C8A35F] text-[8px] font-bold px-2 py-1 rounded uppercase">
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
               className="w-full py-1.5 border-b border-[#EEE] bg-transparent outline-none focus:border-[#C5A059] transition-colors" 
             />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase tracking-widest opacity-60">Horário</label>
              <input 
                type="time" 
                value={formData.time} 
                onChange={e => setFormData({...formData, time: e.target.value})} 
                className="w-full py-1.5 border-b border-[#EEE] bg-transparent outline-none focus:border-[#C5A059] transition-colors" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase tracking-widest opacity-60">Sala</label>
              <select 
                value={formData.room} 
                onChange={e => setFormData({...formData, room: e.target.value as any})} 
                className="w-full py-1.5 border-b border-[#EEE] bg-transparent outline-none focus:border-[#C5A059] transition-colors"
              >
                <option value="SALA A">SALA A</option>
                <option value="SALA B">SALA B</option>
              </select>
            </div>
          </div>

          <button 
            onClick={handleCreateAppointment} 
            className="w-full mt-6 bg-[#1A1A1A] hover:bg-[#C5A059] text-white py-3.5 rounded-sm text-[10px] font-bold uppercase tracking-[0.2em] transition-all shadow-md active:scale-95"
          >
            Confirmar Registro
          </button>
        </div>
      </aside>

      {/* ÁREA DA AGENDA */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-[#EEECE7] px-8 py-4 flex justify-between items-center z-40">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-[#C5A059] mb-0.5">Harmonie Concierge</p>
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
                  className={`px-6 py-1.5 text-[9px] font-bold uppercase tracking-[0.2em] transition-all rounded-sm ${view === t ? "bg-white text-[#1A1A1A] shadow-sm" : "text-[#94A3B8] hover:text-[#1A1A1A]"}`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="flex items-center border border-[#EEECE7] p-1 bg-white scale-90 rounded-sm shadow-sm">
              <button onClick={() => changeDate(-1)} className="p-1.5 hover:text-[#C5A059] transition-all"><ChevronLeft size={16}/></button>
              <button onClick={handleHoje} className="px-3 text-[9px] font-bold uppercase tracking-widest border-x border-[#EEECE7] hover:text-[#C5A059] transition-colors">Hoje</button>
              <button onClick={() => changeDate(1)} className="p-1.5 hover:text-[#C5A059] transition-all"><ChevronRight size={16}/></button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-[#FAFAFA]">
          <div className="bg-white border border-[#EEECE7] max-w-400 mx-auto shadow-sm rounded-sm overflow-hidden">
            
            {/* --- VISUALIZAÇÃO DIA --- */}
            {view === "DIA" && (
              <>
                <div className="flex bg-white border-b border-[#EEECE7] ml-16 sticky top-0 z-30">
                  <div className="flex-1 py-3 text-center border-r border-[#EEECE7] bg-[#FCFAF6]"><span className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#C5A059]">SALA A (AVANÇADA)</span></div>
                  <div className="flex-1 py-3 text-center bg-[#FCFAF6]"><span className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#C5A059]">SALA B (BÁSICA)</span></div>
                </div>
                <div className="divide-y divide-[#F9F9F9]">
                  {HOURS.map(hour => (
                    <div key={hour} className="flex min-h-15 group/row">
                      <div className="w-16 py-4 border-r border-[#EEECE7] flex justify-center items-start bg-[#FAFAFA] font-sans text-[11px] text-[#94A3B8] font-medium">{hour}</div>
                      <div className="flex-1 border-r border-[#F9F9F9] relative p-1 transition-colors hover:bg-gray-50/50" onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, formatDate(currentDate), hour, "SALA A")}>
                        {parsedAppointments.filter(a => a.localTime === hour && a.uiRoom === "SALA A" && a.localDate === formatDate(currentDate)).map(app => (
                          <AppointmentCard key={app.id} app={app} onDragStart={onDragStart} onClick={() => setEditingAppointment(app)} />
                        ))}
                      </div>
                      <div className="flex-1 relative p-1 transition-colors hover:bg-gray-50/50" onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, formatDate(currentDate), hour, "SALA B")}>
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
                      <span className="text-[9px] font-bold uppercase tracking-widest text-[#C5A059]">{DIAS_SEMANA_NOMES[day.getDay()]} {day.getDate()}</span>
                    </div>
                  ))}
                </div>
                <div className="divide-y divide-[#F9F9F9]">
                  {HOURS.map(hour => (
                    <div key={hour} className="flex min-h-13.75">
                      <div className="w-16 flex justify-center items-center border-r border-[#EEECE7] bg-[#FAFAFA] font-sans text-[10px] text-[#94A3B8] font-medium">{hour}</div>
                      {currentWeekDays.map(day => (
                        <div key={day.toString()} className="flex-1 border-r border-[#F9F9F9] last:border-0 relative p-0.5 transition-colors hover:bg-gray-50/50" onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, formatDate(day), hour)}>
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
                  <div key={dia} className="py-3 text-center border-b border-r border-[#EEECE7] bg-[#FCFAF6] text-[9px] font-bold tracking-widest text-[#C5A059]">{dia}</div>
                ))}
                {getDaysInMonth(currentDate).map((day, i) => (
                  <div 
                    key={i} 
                    className={`min-h-27.5 p-2 border-b border-r border-[#F5F5F5] transition-colors relative group/day ${day ? 'cursor-pointer hover:bg-[#FAFAFA]' : ''}`}
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
                        <span className={`text-[13px] font-sans font-bold w-6 h-6 flex items-center justify-center rounded-full transition-colors ${day.toDateString() === new Date().toDateString() ? 'bg-[#C5A059] text-white' : 'text-[#1A1A1A] group-hover/day:bg-gray-200'}`}>
                          {day.getDate()}
                        </span>
                        <div className="mt-1 space-y-1">
                          {parsedAppointments.filter(a => a.localDate === formatDate(day)).map(app => (
                            <div 
                              key={app.id} 
                              draggable 
                              onDragStart={e => { e.stopPropagation(); onDragStart(e, app.id); }} 
                              onClick={(e) => { e.stopPropagation(); setEditingAppointment(app); }} 
                              className="bg-white border border-[#EEECE7] text-[#1A1A1A] p-1.5 text-[8px] font-bold uppercase truncate cursor-move shadow-sm border-l-2 border-l-[#C5A059] hover:bg-[#FAF8F3] transition-colors"
                            >
                              <span className="text-[#C5A059] mr-1">{app.localTime}</span> 
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
        onSaved={loadData}
      />
    </div>
  );
}

// --- CARD REFINADO ---
function AppointmentCard({ app, onDragStart, compact, onClick }: any) {
  return (
    <div 
      draggable 
      onDragStart={e => onDragStart(e, app.id)} 
      onClick={onClick}
      className="absolute inset-x-1 top-0.5 bottom-0.5 bg-white border border-[#EEECE7] p-2 flex flex-col justify-center shadow-sm cursor-move border-l-4 border-l-[#C5A059] z-20 transition-all hover:shadow-md hover:border-[#C5A059] group/card rounded-sm"
    >
      <p className="text-[#1A1A1A] text-[9px] font-extrabold uppercase tracking-wide truncate">{app.patientName}</p>
      {!compact && <p className="text-[#94A3B8] text-[8px] font-semibold truncate uppercase mt-0.5 leading-tight">{app.procedureName}</p>}
    </div>
  );
}