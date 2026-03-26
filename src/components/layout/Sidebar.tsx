"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  DollarSign,
  Sparkles,
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

  return (
    <aside className="flex min-h-screen w-[286px] flex-col justify-between border-r border-[#1A1A1A] bg-[#0D0E10] text-white">
      <div>
        <div className="px-7 pb-10 pt-8">
          <div className="mb-10 flex justify-center">
            <div className="flex h-[50px] w-[50px] items-center justify-center border border-[#C8A35F]/55 bg-[#111214] shadow-[0_0_20px_rgba(200,163,95,0.08)]">
              <Image
                src="/harmonie-h-sidebar.png"
                alt="Harmonie"
                width={18}
                height={18}
                className="opacity-95"
                unoptimized
              />
            </div>
          </div>

          <div className="flex flex-col items-center text-center">
            <div
              className="whitespace-nowrap text-white"
              style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: "16px",
                lineHeight: 1,
                letterSpacing: "0.42em",
                fontWeight: 300,
              }}
            >
              HARMONIE
            </div>

            <div
              className="mt-3 whitespace-nowrap text-[#C8A35F]"
              style={{
                fontSize: "9px",
                lineHeight: 1,
                letterSpacing: "0.48em",
                fontWeight: 400,
                textTransform: "uppercase",
              }}
            >
              CLINIC
            </div>
          </div>
        </div>

        <nav className="px-4">
          <ul className="space-y-2">
            {menu.map((item) => {
              const Icon = item.icon;

              const active =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname?.startsWith(item.href));

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={[
                      "group relative flex items-center gap-4 px-4 py-3 text-[14px] uppercase tracking-[0.08em] transition-all duration-200",
                      active
                        ? "border-l-2 border-[#C8A35F] bg-gradient-to-r from-white/8 to-white/[0.03] text-[#C8A35F]"
                        : "border-l-2 border-transparent text-[#94A3B8] hover:bg-white/5 hover:text-white",
                    ].join(" ")}
                  >
                    <Icon
                      size={17}
                      strokeWidth={1.6}
                      className={
                        active
                          ? "text-[#C8A35F]"
                          : "text-[#64748B] transition-colors group-hover:text-white"
                      }
                    />

                    <span className="font-medium tracking-[0.06em]">
                      {item.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      <div className="border-t border-[#222222] px-8 py-8">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#C8A35F]/40 text-[17px] font-light text-[#C8A35F] shadow-[0_0_18px_rgba(200,163,95,0.06)]">
            M
          </div>

          <p className="mt-5 text-[14px] font-semibold text-white tracking-[0.02em]">
            Dra. Mariana
          </p>

          <p
            className="mt-2 text-[9px] uppercase text-[#C8A35F]"
            style={{
              letterSpacing: "0.24em",
              fontWeight: 400,
            }}
          >
            Diretora Clínica
          </p>
        </div>
      </div>
    </aside>
  );
}