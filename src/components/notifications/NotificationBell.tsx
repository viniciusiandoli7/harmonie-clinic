"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, CalendarDays, CheckCheck, CircleAlert, Clock3, PackageCheck, RefreshCcw, Sparkles, X } from "lucide-react";

type NotificationItem = {
  id: string;
  type: "alert" | "activity";
  severity: "danger" | "warning" | "success" | "info" | "neutral";
  title: string;
  message: string;
  href?: string;
  createdAt: string;
  dueAt?: string | null;
  group: string;
};

type Props = {
  inactiveDays?: number;
};

const STORAGE_KEY = "mariana-clinic-read-notifications";

function formatRelative(dateString?: string | null) {
  if (!dateString) return "Agora";
  const date = new Date(dateString);
  const diffMs = date.getTime() - Date.now();
  const absMs = Math.abs(diffMs);
  const minutes = Math.round(absMs / 60000);
  const hours = Math.round(absMs / 3600000);
  const days = Math.round(absMs / 86400000);

  if (minutes < 1) return "Agora";
  if (minutes < 60) return diffMs < 0 ? `há ${minutes} min` : `em ${minutes} min`;
  if (hours < 24) return diffMs < 0 ? `há ${hours}h` : `em ${hours}h`;
  if (days <= 30) return diffMs < 0 ? `há ${days} dia${days > 1 ? "s" : ""}` : `em ${days} dia${days > 1 ? "s" : ""}`;
  return date.toLocaleDateString("pt-BR");
}

function severityClass(severity: NotificationItem["severity"]) {
  if (severity === "danger") return "border-brand-danger/20 bg-brand-danger/10 text-brand-danger";
  if (severity === "warning") return "border-brand-warning/25 bg-brand-warning/[.12] text-brand-warning";
  if (severity === "success") return "border-brand-success/20 bg-brand-success/10 text-brand-success";
  if (severity === "info") return "border-brand-primary/15 bg-brand-primary/[.08] text-brand-primary";
  return "border-[rgba(90,31,43,.10)] bg-brand-background-secondary/25 text-brand-text/60";
}

function IconForNotification({ item }: { item: NotificationItem }) {
  if (item.group === "Financeiro") return <CircleAlert size={15} />;
  if (item.group === "Estoque") return <PackageCheck size={15} />;
  if (item.group === "Agenda") return <CalendarDays size={15} />;
  if (item.type === "activity") return <Sparkles size={15} />;
  return <Clock3 size={15} />;
}

export default function NotificationBell({ inactiveDays = 90 }: Props) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  async function loadNotifications() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/notifications?inactiveDays=${inactiveDays}&take=35`, { cache: "no-store" });
      if (!res.ok) throw new Error("Erro ao carregar notificações");
      const data = await res.json();
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (err) {
      console.error(err);
      setError("Não foi possível carregar as notificações agora.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      setReadIds(saved ? JSON.parse(saved) : []);
    } catch {
      setReadIds([]);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    const interval = window.setInterval(loadNotifications, 60000);
    return () => window.clearInterval(interval);
  }, [inactiveDays]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = useMemo(() => items.filter((item) => !readIds.includes(item.id)).length, [items, readIds]);

  function markAllAsRead() {
    const next = Array.from(new Set([...readIds, ...items.map((item) => item.id)]));
    setReadIds(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  function markOneAsRead(id: string) {
    if (readIds.includes(id)) return;
    const next = [...readIds, id];
    setReadIds(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  return (
    <div ref={popoverRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="relative grid h-12 w-12 place-items-center rounded-full border border-[rgba(90,31,43,.12)] bg-brand-surface text-brand-primary shadow-card transition hover:bg-[rgba(90,31,43,.08)]"
        aria-label={unreadCount > 0 ? `${unreadCount} notificações não lidas` : "Notificações"}
      >
        <Bell size={19} strokeWidth={1.7} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-danger px-1.5 text-[10px] font-black text-brand-background ring-2 ring-brand-background">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-3 w-[min(92vw,430px)] overflow-hidden rounded-[28px] border border-[rgba(90,31,43,.14)] bg-brand-surface shadow-[0_24px_80px_rgba(63,22,32,.18)]">
          <div className="flex items-start justify-between gap-4 border-b border-[rgba(90,31,43,.10)] px-5 py-4">
            <div>
              <p className="micro-label mb-1">Central da clínica</p>
              <h3 className="text-[26px] leading-none">Notificações</h3>
              <p className="mt-2 text-[12px] leading-5 text-brand-text/58">
                Atividades recentes, retornos, financeiro e alertas operacionais.
              </p>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="rounded-full p-2 text-brand-text/45 transition hover:bg-[rgba(90,31,43,.08)] hover:text-brand-primary" aria-label="Fechar notificações">
              <X size={16} />
            </button>
          </div>

          <div className="flex items-center justify-between gap-3 border-b border-[rgba(90,31,43,.08)] px-5 py-3">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-text/48">
              {unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? "s" : ""}` : "Tudo em dia"}
            </span>
            <div className="flex items-center gap-2">
              <button type="button" onClick={loadNotifications} className="rounded-full p-2 text-brand-primary transition hover:bg-[rgba(90,31,43,.08)]" title="Atualizar notificações">
                <RefreshCcw size={14} className={loading ? "animate-spin" : ""} />
              </button>
              <button type="button" onClick={markAllAsRead} className="inline-flex items-center gap-2 rounded-full border border-[rgba(90,31,43,.12)] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-primary transition hover:bg-[rgba(90,31,43,.08)]">
                <CheckCheck size={13} /> Marcar lidas
              </button>
            </div>
          </div>

          <div className="max-h-[520px] overflow-y-auto p-3">
            {error && <div className="rounded-2xl border border-brand-danger/18 bg-brand-danger/[.08] p-4 text-[13px] text-brand-danger">{error}</div>}

            {!error && items.length === 0 && !loading && (
              <div className="rounded-3xl border border-[rgba(90,31,43,.10)] bg-brand-background/55 p-6 text-center">
                <p className="font-serif text-2xl text-brand-strong">Nenhuma notificação agora.</p>
                <p className="mt-2 text-[13px] leading-5 text-brand-text/58">Quando houver atividade, retorno, parcela vencida ou alerta de estoque, aparecerá aqui.</p>
              </div>
            )}

            {loading && items.length === 0 && (
              <div className="space-y-3">
                {[1, 2, 3].map((item) => <div key={item} className="h-20 animate-pulse rounded-3xl bg-brand-background-secondary/30" />)}
              </div>
            )}

            <div className="space-y-2">
              {items.map((item) => {
                const unread = !readIds.includes(item.id);
                const content = (
                  <div className={`group flex gap-3 rounded-3xl border p-3 transition hover:bg-[rgba(90,31,43,.045)] ${unread ? "border-[rgba(90,31,43,.18)] bg-brand-background/78" : "border-transparent bg-transparent"}`}>
                    <div className={`mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-2xl border ${severityClass(item.severity)}`}>
                      <IconForNotification item={item} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-[11px] font-bold uppercase tracking-[0.16em] text-brand-primary/58">{item.group}</p>
                          <h4 className="mt-1 text-[13px] font-bold text-brand-strong">{item.title}</h4>
                        </div>
                        {unread && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-danger" />}
                      </div>
                      <p className="mt-1 line-clamp-2 text-[12px] leading-5 text-brand-text/62">{item.message}</p>
                      <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-text/38">{formatRelative(item.dueAt || item.createdAt)}</p>
                    </div>
                  </div>
                );

                if (item.href) {
                  return (
                    <Link key={item.id} href={item.href} onClick={() => markOneAsRead(item.id)} className="block">
                      {content}
                    </Link>
                  );
                }

                return (
                  <button key={item.id} type="button" onClick={() => markOneAsRead(item.id)} className="block w-full text-left">
                    {content}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
