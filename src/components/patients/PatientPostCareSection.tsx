"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, MessageCircle, Plus, Send, Save } from "lucide-react";
import { applyTemplate, buildWhatsAppLink } from "@/lib/clinic-intelligence";

type Props = { patient: { id: string; name: string; phone?: string | null } };

export default function PatientPostCareSection({ patient }: Props) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [form, setForm] = useState({ title: "Acompanhamento pós-procedimento", dueDate: "", message: "" });

  async function load() {
    const [tasksRes, templatesRes] = await Promise.all([fetch(`/api/patients/${patient.id}/post-procedure-tasks`), fetch("/api/whatsapp-templates")]);
    if (tasksRes.ok) setTasks(await tasksRes.json());
    if (templatesRes.ok) setTemplates(await templatesRes.json());
  }
  useEffect(() => { if (patient?.id) load(); }, [patient?.id]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/patients/${patient.id}/post-procedure-tasks`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { setForm({ title: "Acompanhamento pós-procedimento", dueDate: "", message: "" }); load(); }
  }

  async function markDone(id: string) {
    await fetch(`/api/post-procedure-tasks/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "DONE" }) });
    load();
  }

  function send(message: string) {
    window.open(buildWhatsAppLink(patient.phone, applyTemplate(message, patient)), "_blank");
  }

  return (
    <div className="space-y-8">
      <section className="bg-white border border-[rgba(90,31,43,.10)] p-10 rounded-sm shadow-sm">
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#5A1F2B]/70">Relacionamento</p>
        <h3 className="font-serif text-2xl uppercase tracking-widest mt-2">Pós-procedimento e WhatsApp</h3>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[#5B3A2E]/64">Acompanhamentos, retornos e mensagens prontas para manter a experiência da paciente mais cuidadosa.</p>
        <div className="mt-8 space-y-4">
          {tasks.length === 0 ? <div className="rounded-3xl border border-dashed border-[#5A1F2B]/20 bg-[#F7F2EA]/60 p-8 text-center text-sm text-[#5B3A2E]/60">Nenhum acompanhamento pendente.</div> : tasks.map((task) => (
            <article key={task.id} className="rounded-3xl border border-[rgba(90,31,43,.10)] bg-[#F7F2EA]/60 p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#5A1F2B]">{new Date(task.dueDate).toLocaleDateString("pt-BR")} • {task.status}</p>
                  <p className="mt-1 text-sm font-bold text-[#1E1A18]">{task.title}</p>
                  {task.message && <p className="mt-2 text-[12px] leading-6 text-[#5B3A2E]/68">{applyTemplate(task.message, patient)}</p>}
                </div>
                <div className="flex gap-2">
                  {task.message && <button onClick={() => send(task.message)} className="btn-secondary h-10"><Send size={13}/> WhatsApp</button>}
                  {task.status !== "DONE" && <button onClick={() => markDone(task.id)} className="btn-primary h-10"><CheckCircle2 size={13}/> Feito</button>}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <form onSubmit={save} className="bg-white border border-[rgba(90,31,43,.10)] p-10 rounded-sm shadow-sm">
        <h3 className="font-serif text-xl uppercase tracking-widest mb-6">Criar acompanhamento</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_180px]">
          <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="input-premium" placeholder="Título" />
          <input required type="datetime-local" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} className="input-premium" />
        </div>
        <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} className="input-premium mt-4 min-h-24 py-3" placeholder="Mensagem para enviar no WhatsApp" />
        <button className="btn-primary mt-5"><Save size={14}/> Salvar acompanhamento</button>
      </form>

      <section className="bg-white border border-[rgba(90,31,43,.10)] p-10 rounded-sm shadow-sm">
        <h3 className="font-serif text-xl uppercase tracking-widest mb-6">Mensagens prontas</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {templates.map((template) => (
            <div key={template.id} className="rounded-3xl border border-[rgba(90,31,43,.10)] bg-[#F7F2EA]/60 p-5">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#5A1F2B]">{template.category}</p>
              <p className="mt-1 text-sm font-bold text-[#1E1A18]">{template.title}</p>
              <p className="mt-2 text-[12px] leading-6 text-[#5B3A2E]/68">{applyTemplate(template.content, patient)}</p>
              <button onClick={() => send(template.content)} className="btn-secondary mt-4 h-10"><MessageCircle size={13}/> Enviar</button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
