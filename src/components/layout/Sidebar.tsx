"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react"; 
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  DollarSign,
  Sparkles,
  LogOut,
} from "lucide-react";

const menu = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Agenda", href: "/appointments", icon: CalendarDays },
  { label: "CRM Pacientes", href: "/patients", icon: Users },
  { label: "Financeiro", href: "/finance", icon: DollarSign },
  { label: "IA Marketing", href: "/marketing", icon: Sparkles },
];

export default function Sidebar() {
  const pathname = usePathname();

  if (pathname === "/login") return null;

  return (
    <aside className="flex min-h-screen w-[275px] flex-col justify-between border-r border-[#1F1F1F] bg-[#0A0A0B] text-white font-sans">
      <div>
        <div className="px-8 pb-12 pt-10 text-center">
          {/* LOGOTIPO NO TOPO */}
          <div className="mb-8 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center border border-[#C5A059] bg-[#111] shadow-[0_0_20px_rgba(197,160,89,0.3)] rounded-md">
              <Image
                src="/favicon.ico" 
                alt="Harmonie Logo"
                width={32}
                height={32}
                className="brightness-200"
              />
            </div>
          </div>
          
          <div className="flex flex-col items-center">
            {/* 1. HARMONIE - AGORA VAI BRILHAR (BRANCO ABSOLUTO) */}
            <h1 className="font-serif text-[26px] tracking-[0.3em] font-bold !text-white !opacity-100 uppercase italic block">
              HARMONIE
            </h1>
            <div className="mt-2 text-[11px] uppercase tracking-[0.6em] text-[#C5A059] font-black">
              Clinic
            </div>
          </div>
        </div>
        
        {/* NAVEGAÇÃO */}
        <nav className="px-5">
          <ul className="space-y-1">
            {menu.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`group relative flex items-center gap-4 px-5 py-4 text-[13px] font-medium tracking-widest transition-all duration-300 rounded-lg ${
                      active ? "bg-white/10 text-white" : "text-[#71717A] hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Icon size={18} className={active ? "text-[#C5A059]" : "group-hover:text-white"} />
                    <span className="uppercase">{item.label}</span>
                    {active && <div className="absolute left-0 w-[2.5px] h-6 bg-[#C5A059]" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* RODAPÉ COM PERFIL E LOGOUT */}
      <div className="border-t border-white/5 px-6 py-12 bg-gradient-to-t from-white/[0.03] to-transparent">
        <div className="flex flex-col items-center mb-10">
          {/* CÍRCULO COM O "M" */}
          <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#C5A059]/60 bg-[#1A1A1A] shadow-[0_0_20px_rgba(255,255,255,0.15)] mb-4">
            <span className="!text-white text-2xl font-bold !opacity-100">M</span>
          </div>
          <p className="text-[16px] font-bold !text-white tracking-wide">Dra. Mariana</p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.25em] text-[#C5A059] font-black leading-tight">Diretora Clínica</p>
        </div>

        <button 
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center justify-center gap-3 px-4 py-4 text-[11px] font-bold uppercase tracking-[0.4em] text-white/40 hover:text-white hover:bg-white/5 transition-all duration-300 border border-white/10 rounded-md"
        >
          <LogOut size={14} />
          Encerrar Sessão
        </button>
      </div>
    </aside>
  );
}