"use client";

import { useEffect, useState } from "react";
import { Copy, MessageCircle, Plus, Save } from "lucide-react";

export default function WhatsAppPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [form, setForm] = useState({ category: "Geral", title: "", content: "" });

  async function load() {
    const res = await fetch("/api/whatsapp-templates");
    if (res.ok) setTemplates(await res.json());
  }

  useEffect(() => { load(); }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/whatsapp-templates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { setForm({ category: "Geral", title: "", content: "" }); load(); }
  }

  return (
    <div className="min-h-screen px-2 py-3 font-sans text-brand-text sm:px-4 lg:px-6">
      <header className="border-b border-[rgba(90,31,43,.12)] pb-8">
        <p className="micro-label text-brand-primary/70">Relacionamento premium</p>
        <h1 className="page-title mt-2">WhatsApp</h1>
        <p className="mt-3 max-w-2xl text-[14px] leading-6 text-brand-text/64">Biblioteca de mensagens prontas para confirmação, pré e pós-procedimento, retorno, reativação, feedback e cobrança delicada.</p>
      </header>

      <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_.75fr]">
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {templates.map((template) => (
            <article key={template.id} className="premium-card p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="micro-label text-brand-primary/70">{template.category}</p>
                  <h2 className="mt-2 font-serif text-2xl text-brand-strong">{template.title}</h2>
                </div>
                <MessageCircle size={20} className="text-brand-primary" />
              </div>
              <p className="mt-5 whitespace-pre-wrap text-[13px] leading-7 text-brand-text/70">{template.content}</p>
              <button onClick={() => navigator.clipboard?.writeText(template.content)} className="btn-secondary mt-5 h-10"><Copy size={14} /> Copiar</button>
            </article>
          ))}
        </section>

        <form onSubmit={save} className="premium-card sticky top-6 h-fit p-6">
          <p className="micro-label">Nova mensagem</p>
          <h2 className="mt-2 font-serif text-3xl text-brand-strong">Criar template</h2>
          <div className="mt-6 space-y-4">
            <label className="block"><span className="micro-label">Categoria</span><input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="input-premium" /></label>
            <label className="block"><span className="micro-label">Título</span><input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="input-premium" /></label>
            <label className="block"><span className="micro-label">Mensagem</span><textarea required value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} className="input-premium min-h-44 py-3" /></label>
            <div className="rounded-3xl bg-brand-primary/8 p-4 text-[12px] leading-6 text-brand-text/64">
              Variáveis disponíveis: <strong>[nome]</strong>, <strong>[primeiroNome]</strong>, <strong>[procedimento]</strong>, <strong>[data]</strong>, <strong>[valor]</strong>, <strong>[retorno]</strong>.
            </div>
            <button className="btn-primary h-12 w-full"><Save size={15} /> Salvar mensagem</button>
          </div>
        </form>
      </div>
    </div>
  );
}
