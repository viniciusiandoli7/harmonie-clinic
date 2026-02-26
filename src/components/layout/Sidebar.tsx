import {
  LayoutDashboard,
  Calendar,
  Users,
  DollarSign,
  MessageSquare,
  Sparkles,
  Settings,
} from "lucide-react";

type NavItemProps = {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  label: string;
  active?: boolean;
};

function NavItem({ icon: Icon, label, active = false }: NavItemProps) {
  return (
    <button
      type="button"
      className={`flex w-full items-center gap-3 text-left uppercase tracking-[0.1em] transition-colors ${
        active ? "text-[#C5A059]" : "text-[#FAFAFA]/70 hover:text-[#FAFAFA]"
      }`}
    >
      <span className={`h-7 w-[3px] ${active ? "bg-[#C5A059]" : "bg-transparent"}`} />
      <Icon size={17} strokeWidth={1.8} />
      <span className="text-[13px] font-semibold leading-none">{label}</span>
    </button>
  );
}

export default function Sidebar() {
  const items = [
    { label: "Dashboard", icon: LayoutDashboard },
    { label: "Agenda", icon: Calendar },
    { label: "CRM Pacientes", icon: Users },
    { label: "Financeiro", icon: DollarSign },
    { label: "WhatsApp", icon: MessageSquare },
    { label: "IA Marketing", icon: Sparkles, active: true },
  ];

  return (
    <aside className="flex min-h-screen w-[320px] flex-col bg-[#1A1A1A] text-[#FAFAFA]">
      <div className="border-t border-[#FAFAFA]/10 px-8 pt-10">
        <div className="mb-12 flex flex-col items-center">
          <div className="mb-8 flex h-12 w-12 items-center justify-center border border-[#C5A059]/65 text-[#C5A059]">
            <Sparkles size={18} strokeWidth={1.8} />
          </div>
          <h1 className="font-serif text-[18px] tracking-[0.42em] text-[#FAFAFA]">HARMONIE</h1>
          <p className="mt-2 text-[11px] font-semibold tracking-[0.28em] text-[#C5A059]">CLINIC</p>
        </div>

        <nav className="space-y-9">
          {items.map((item) => (
            <NavItem key={item.label} icon={item.icon} label={item.label} active={item.active} />
          ))}
        </nav>
      </div>

      <div className="mt-auto px-8 pb-8">
        <div className="mb-8 border-t border-[#FAFAFA]/10" />
        <div className="flex flex-col items-center">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full border border-[#C5A059]/65 text-lg font-serif text-[#C5A059]">
            M
          </div>
          <p className="text-center text-[12px] font-semibold uppercase tracking-[0.11em] text-[#FAFAFA]">
            Dra. Mariana
          </p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.17em] text-[#C5A059]">
            Diretora Clinica
          </p>
          <button
            aria-label="Configuracoes"
            className="mt-5 text-[#FAFAFA]/60 transition-colors hover:text-[#C5A059]"
            type="button"
          >
            <Settings size={16} strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </aside>
  );
}
