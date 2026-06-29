"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  BarChart3,
  CalendarDays,
  FileText,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  LayoutDashboard,
  LogOut,
  PackageSearch,
  Users,
} from "lucide-react";
import { useState } from "react";
import { brand } from "@/lib/brand";

const menu = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Agenda", href: "/appointments", icon: CalendarDays },
  { label: "CRM Pacientes", href: "/patients", icon: Users },
  { label: "Financeiro", href: "/finance", icon: DollarSign },
  { label: "Estoque", href: "/inventory", icon: PackageSearch },
  { label: "WhatsApp", href: "/whatsapp", icon: MessageCircle },
  { label: "Relatórios", href: "/reports/monthly", icon: FileText },
  { label: "Executivo", href: "/executive", icon: BarChart3 },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  if (pathname === "/login") return null;

  return (
    <>
      <aside
        className={`hidden min-h-screen flex-col justify-between border-r border-[rgba(90,31,43,.12)] bg-[rgba(251,248,242,.86)] text-brand-text shadow-[18px_0_55px_rgba(63,22,32,.06)] backdrop-blur-2xl transition-all duration-300 lg:flex ${
          collapsed ? "w-[92px]" : "w-[308px]"
        }`}
        aria-label="Navegação principal"
      >
        <div>
          <div className="px-5 pb-8 pt-6">
            <div className={`flex items-start ${collapsed ? "justify-center" : "justify-between"}`}>
              <Link href="/dashboard" className={`group flex items-center ${collapsed ? "justify-center" : "w-full"}`} aria-label="Ir para dashboard">
                {collapsed ? (
                  <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-3xl border border-[rgba(90,31,43,.14)] bg-brand-background p-2 shadow-card transition group-hover:scale-[1.02]">
                    <img src={brand.symbol} alt="Logo Mariana Thomaz Carmona" className="h-full w-full object-contain" />
                  </div>
                ) : (
                  <div className="flex w-full flex-col items-center rounded-[28px] border border-[rgba(90,31,43,.10)] bg-brand-background/72 px-4 py-5 shadow-card transition group-hover:border-[rgba(90,31,43,.22)]">
                    <img src={brand.logo} alt="Logo Mariana Thomaz Carmona" className="h-[118px] w-full object-contain" />
                    <p className="mt-3 text-[8px] font-bold uppercase tracking-[0.32em] text-brand-primary/60">
                      Clinic Management
                    </p>
                  </div>
                )}
              </Link>

              {!collapsed && (
                <button
                  type="button"
                  onClick={() => setCollapsed(true)}
                  className="ml-3 mt-2 rounded-full border border-[rgba(90,31,43,.10)] p-2 text-brand-primary/70 transition hover:bg-[rgba(90,31,43,.08)] hover:text-brand-primary"
                  aria-label="Recolher menu"
                >
                  <ChevronLeft size={16} />
                </button>
              )}
            </div>

            {collapsed && (
              <button
                type="button"
                onClick={() => setCollapsed(false)}
                className="mx-auto mt-4 flex rounded-full border border-[rgba(90,31,43,.10)] p-2 text-brand-primary/70 transition hover:bg-[rgba(90,31,43,.08)] hover:text-brand-primary"
                aria-label="Expandir menu"
              >
                <ChevronRight size={16} />
              </button>
            )}
          </div>

          <nav className="px-4">
            <ul className="space-y-2">
              {menu.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      className={`group relative flex items-center gap-4 rounded-2xl px-4 py-3.5 text-[12px] font-semibold tracking-[0.06em] transition-all duration-200 ${
                        active
                          ? "bg-[rgba(90,31,43,.10)] text-brand-primary shadow-[inset_0_0_0_1px_rgba(90,31,43,.08)]"
                          : "text-brand-text/68 hover:bg-[rgba(90,31,43,.06)] hover:text-brand-primary"
                      } ${collapsed ? "justify-center" : ""}`}
                    >
                      {active && !collapsed && <span className="absolute left-0 h-8 w-1 rounded-r-full bg-brand-primary" />}
                      <Icon size={18} strokeWidth={1.7} className={active ? "text-brand-primary" : "text-brand-text/45 group-hover:text-brand-primary"} />
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        <div className="border-t border-[rgba(90,31,43,.10)] px-5 py-7">
          <div className={`mb-5 overflow-hidden rounded-[28px] border border-[rgba(90,31,43,.12)] bg-brand-background/68 shadow-card ${collapsed ? "p-2" : "p-3"}`}>
            <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
              <img
                src={brand.profilePhoto}
                alt="Foto da Dra. Mariana"
                className={`${collapsed ? "h-12 w-12" : "h-14 w-14"} rounded-2xl object-cover shadow-[0_12px_28px_rgba(63,22,32,.16)]`}
              />
              {!collapsed && (
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-bold text-brand-strong">Dra. Mariana</p>
                  <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.2em] text-brand-primary/70">Diretora Clínica</p>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className={`flex w-full items-center justify-center gap-3 rounded-2xl border border-[rgba(90,31,43,.10)] px-4 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-brand-text/55 transition hover:bg-[rgba(90,31,43,.08)] hover:text-brand-primary ${collapsed ? "px-0" : ""}`}
            title="Encerrar sessão"
          >
            <LogOut size={15} />
            {!collapsed && "Encerrar"}
          </button>
        </div>
      </aside>

      <header className="fixed inset-x-3 top-3 z-50 flex items-center justify-between rounded-3xl border border-[rgba(90,31,43,.12)] bg-[rgba(251,248,242,.92)] px-4 py-3 shadow-card backdrop-blur-2xl lg:hidden">
        <Link href="/dashboard" className="flex items-center gap-3">
          <img src={brand.symbol} alt="Logo Mariana Thomaz Carmona" className="h-11 w-11 object-contain" />
          <div>
            <p className="font-serif text-[18px] leading-none text-brand-primary">Mariana</p>
            <p className="text-[8px] font-bold uppercase tracking-[0.28em] text-brand-text/55">Thomaz Carmona</p>
          </div>
        </Link>
        <nav className="flex items-center gap-1" aria-label="Navegação rápida mobile">
          {menu.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} aria-label={item.label} className={`rounded-2xl p-2 transition ${active ? "bg-[rgba(90,31,43,.10)] text-brand-primary" : "text-brand-text/55"}`}>
                <Icon size={17} />
              </Link>
            );
          })}
        </nav>
      </header>
    </>
  );
}
