"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock, Copy, MessageCircle, Plus, RefreshCcw, Save } from "lucide-react";

type WhatsAppTemplate = {
  id: string;
  category: string;
  title: string;
  content: string;
  defaultTime?: string | null;
  isActive?: boolean;
};

type TemplateForm = {
  category: string;
  title: string;
  defaultTime: string;
  content: string;
};

const initialForm: TemplateForm = {
  category: "Geral",
  title: "",
  defaultTime: "",
  content: "",
};

const variableButtons = [
  "[nome]",
  "[primeiroNome]",
  "[procedimento]",
  "[data]",
  "[horario]",
  "[valor]",
  "[retorno]",
];

function insertAtCursor(text: string, value: string) {
  const active = document.activeElement;
  if (!(active instanceof HTMLTextAreaElement)) return `${text}${value}`;

  const start = active.selectionStart ?? text.length;
  const end = active.selectionEnd ?? text.length;
  const next = `${text.slice(0, start)}${value}${text.slice(end)}`;

  window.requestAnimationFrame(() => {
    active.focus();
    active.selectionStart = start + value.length;
    active.selectionEnd = start + value.length;
  });

  return next;
}

export default function WhatsAppPage() {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [form, setForm] = useState<TemplateForm>(initialForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const categories = useMemo(() => {
    const values = new Set(templates.map((template) => template.category).filter(Boolean));
    return ["Geral", ...Array.from(values).filter((category) => category !== "Geral")];
  }, [templates]);

  async function load() {
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/whatsapp-templates", { cache: "no-store" });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "Não foi possível carregar as mensagens.");
      }

      setTemplates(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar as mensagens.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();

    if (isSaving) return;

    setError("");
    setSuccess("");
    setIsSaving(true);

    try {
      const payload = {
        category: form.category.trim() || "Geral",
        title: form.title.trim(),
        defaultTime: form.defaultTime || null,
        content: form.content.trim(),
      };

      const res = await fetch("/api/whatsapp-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "Não foi possível salvar a mensagem.");
      }

      setTemplates((current) => [...current, data].sort((a, b) => `${a.category}${a.title}`.localeCompare(`${b.category}${b.title}`)));
      setForm(initialForm);
      setSuccess("Mensagem salva com sucesso.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar a mensagem.");
    } finally {
      setIsSaving(false);
    }
  }

  async function copy(content: string) {
    try {
      await navigator.clipboard?.writeText(content);
      setSuccess("Mensagem copiada.");
    } catch {
      setError("Não foi possível copiar automaticamente. Selecione o texto e copie manualmente.");
    }
  }

  function addVariable(variable: string) {
    setForm((current) => ({
      ...current,
      content: insertAtCursor(current.content, variable),
    }));
  }

  return (
    <div className="min-h-screen px-2 py-3 font-sans text-brand-text sm:px-4 lg:px-6">
      <header className="border-b border-[rgba(90,31,43,.12)] pb-8">
        <p className="micro-label text-brand-primary/70">Relacionamento premium</p>
        <h1 className="page-title mt-2">WhatsApp</h1>
        <p className="mt-3 max-w-2xl text-[14px] leading-6 text-brand-text/64">
          Biblioteca de mensagens prontas para confirmação, pré e pós-procedimento, retorno, reativação, feedback e cobrança delicada.
        </p>
      </header>

      {(error || success) && (
        <div
          className={`mt-6 rounded-3xl border px-5 py-4 text-[13px] leading-6 ${
            error
              ? "border-brand-danger/20 bg-brand-danger/8 text-brand-danger"
              : "border-brand-success/20 bg-brand-success/10 text-brand-success"
          }`}
        >
          {error || success}
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_.75fr]">
        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="micro-label text-brand-primary/70">Mensagens salvas</p>
              <p className="mt-1 text-[13px] text-brand-text/60">{templates.length} templates ativos</p>
            </div>
            <button type="button" onClick={load} className="btn-secondary h-10 w-fit" disabled={isLoading}>
              <RefreshCcw size={14} className={isLoading ? "animate-spin" : ""} /> Atualizar
            </button>
          </div>

          {isLoading ? (
            <div className="premium-card p-8 text-center text-[13px] text-brand-text/60">Carregando mensagens...</div>
          ) : templates.length === 0 ? (
            <div className="premium-card p-8 text-center text-[13px] text-brand-text/60">
              Nenhuma mensagem salva ainda. Crie o primeiro template ao lado.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {templates.map((template) => (
                <article key={template.id} className="premium-card p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="micro-label text-brand-primary/70">{template.category}</p>
                      <h2 className="mt-2 font-serif text-2xl text-brand-strong">{template.title}</h2>
                      {template.defaultTime && (
                        <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-brand-primary/8 px-3 py-1 text-[11px] font-semibold text-brand-primary">
                          <Clock size={13} /> Horário: {template.defaultTime}
                        </p>
                      )}
                    </div>
                    <MessageCircle size={20} className="text-brand-primary" />
                  </div>
                  <p className="mt-5 whitespace-pre-wrap text-[13px] leading-7 text-brand-text/70">{template.content}</p>
                  <button type="button" onClick={() => copy(template.content)} className="btn-secondary mt-5 h-10">
                    <Copy size={14} /> Copiar
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>

        <form onSubmit={save} className="premium-card sticky top-6 h-fit p-6">
          <p className="micro-label">Nova mensagem</p>
          <h2 className="mt-2 font-serif text-3xl text-brand-strong">Criar template</h2>
          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="micro-label">Categoria</span>
              <input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="input-premium"
                list="whatsapp-template-categories"
                placeholder="Ex.: Confirmação, Retorno, Pós-procedimento"
              />
              <datalist id="whatsapp-template-categories">
                {categories.map((category) => (
                  <option key={category} value={category} />
                ))}
              </datalist>
            </label>

            <label className="block">
              <span className="micro-label">Título</span>
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="input-premium"
                placeholder="Ex.: Confirmação de avaliação"
              />
            </label>

            <label className="block">
              <span className="micro-label">Horário</span>
              <input
                type="time"
                value={form.defaultTime}
                onChange={(e) => setForm({ ...form, defaultTime: e.target.value })}
                className="input-premium"
              />
              <span className="mt-2 block text-[11px] leading-5 text-brand-text/55">
                Opcional. Use <strong>[horario]</strong> na mensagem para encaixar esse horário no texto.
              </span>
            </label>

            <label className="block">
              <span className="micro-label">Mensagem</span>
              <textarea
                required
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                className="input-premium min-h-44 py-3"
                placeholder="Ex.: Oi, [primeiroNome]. Confirmando sua avaliação no dia [data], às [horario]."
              />
            </label>

            <div className="rounded-3xl bg-brand-primary/8 p-4 text-[12px] leading-6 text-brand-text/64">
              <div className="flex items-center gap-2 font-semibold text-brand-primary">
                <Plus size={13} /> Variáveis rápidas
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {variableButtons.map((variable) => (
                  <button
                    key={variable}
                    type="button"
                    onClick={() => addVariable(variable)}
                    className="rounded-full border border-brand-primary/12 bg-brand-background px-3 py-1 text-[11px] font-semibold text-brand-primary transition hover:bg-brand-primary/8"
                  >
                    {variable}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" className="btn-primary h-12 w-full" disabled={isSaving}>
              <Save size={15} /> {isSaving ? "Salvando..." : "Salvar mensagem"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
