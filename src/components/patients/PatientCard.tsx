"use client";

import { useState, useCallback, memo } from "react";
import { MoreHorizontal, Phone, Mail, CalendarDays, Edit3, MessageCircle, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

// Removi o import do Modal daqui para evitar conflito de CSS
const PatientCard = memo(({ p, onOpenSale }: { p: any, onOpenSale: (p: any) => void }) => {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleNavigate = useCallback(() => {
    router.push(`/patients/${p.id}`);
  }, [router, p.id]);

  const handleMenuToggle = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMenuOpen((prev) => !prev);
  }, []);

  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/patients/${p.id}/edit`);
  }, [router, p.id]);

  const handleWhatsApp = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!p.phone) return alert("Paciente sem telefone.");
    const cleanPhone = p.phone.replace(/\D/g, "");
    window.open(`https://api.whatsapp.com/send?phone=55${cleanPhone}`, "_blank");
  }, [p.phone]);

  const handleDelete = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Excluir ficha de ${p.name}?`)) {
      const res = await fetch(`/api/patients/${p.id}`, { method: "DELETE" });
      if (res.ok) window.location.reload();
    }
  }, [p.id, p.name]);

  return (
    <div 
      onClick={handleNavigate}
      className="group bg-white border border-[#EEECE7] p-7 transition-all duration-200 hover:border-[#C5A059]/40 hover:shadow-md rounded-sm relative cursor-pointer will-change-transform"
    >
      <div className="flex justify-between items-start mb-6">
        <div className="h-14 w-14 flex items-center justify-center border border-[#EEECE7] bg-[#FCFAF6] text-2xl font-serif text-[#C5A059] rounded-none shadow-sm transition-colors group-hover:border-[#C5A059]">
          {p.name[0]}
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <span className={`px-2.5 py-1 text-[8px] font-bold uppercase tracking-widest border ${p.isActive === false ? 'text-gray-400 border-[#EEECE7]' : 'text-[#C5A059] border-[#C5A059] bg-[#FCFAF6]'}`}>
            {p.isActive === false ? "Inativo" : "Ativo"}
          </span>

          <div className="relative">
            <button 
              onClick={handleMenuToggle}
              className="text-gray-300 hover:text-[#1A1A1A] p-1 transition-colors"
            >
              <MoreHorizontal size={18}/>
            </button>

            {isMenuOpen && (
              <>
                <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-44 bg-white border border-[#EEECE7] shadow-xl z-50 py-2 animate-in fade-in zoom-in duration-100">
                  <button onClick={handleEdit} className="flex items-center gap-3 w-full px-4 py-2 text-[9px] font-bold uppercase tracking-widest text-gray-600 hover:bg-[#FCFAF6]">
                    <Edit3 size={12} className="text-[#C5A059]" /> Editar Dados
                  </button>
                  <button onClick={handleWhatsApp} className="flex items-center gap-3 w-full px-4 py-2 text-[9px] font-bold uppercase tracking-widest text-gray-600 hover:bg-[#FCFAF6]">
                    <MessageCircle size={12} className="text-green-500" /> WhatsApp
                  </button>
                  <div className="h-px bg-[#F5F5F5] my-1" />
                  <button onClick={handleDelete} className="flex items-center gap-3 w-full px-4 py-2 text-[9px] font-bold uppercase tracking-widest text-red-500 hover:bg-red-50">
                    <Trash2 size={12} /> Excluir
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <h3 className="text-[20px] font-serif mb-1 text-[#1A1A1A] group-hover:text-[#C5A059] transition-colors uppercase tracking-tight">{p.name}</h3>
      
      <div className="text-[11px] text-[#94A3B8] font-semibold mb-6 flex items-center gap-2">
        <Phone size={12} className="text-[#C5A059]" /> {p.phone || "N/A"}
      </div>

      <div className="grid grid-cols-2 gap-4 pt-5 border-t border-[#F5F5F5]">
        <div className="flex items-center gap-3 overflow-hidden">
           <Mail size={14} className="text-[#C5A059] shrink-0" />
           <div className="min-w-0">
              <p className="text-[8px] font-bold text-[#BBB] uppercase mb-1">E-mail</p>
              <p className="text-[10px] font-medium text-[#1A1A1A] truncate">{p.email || "—"}</p>
           </div>
        </div>
        <div className="flex items-center gap-3 justify-end text-right">
           <CalendarDays size={14} className="text-[#C5A059] shrink-0" />
           <div>
              <p className="text-[8px] font-bold text-[#BBB] uppercase mb-1">Desde</p>
              <p className="text-[10px] font-medium text-[#1A1A1A]">
                {p.createdAt ? new Date(p.createdAt).toLocaleDateString('pt-BR', {month: 'short', year: 'numeric'}) : "—"}
              </p>
           </div>
        </div>
      </div>

      <div className="mt-8 flex gap-2 pt-6 border-t border-[#F5F5F5] opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button 
          onClick={(e) => { e.stopPropagation(); handleNavigate(); }}
          className="flex-1 bg-white text-[#1A1A1A] py-2.5 text-[9px] font-bold uppercase tracking-widest border border-[#EEECE7] hover:bg-[#1A1A1A] hover:text-white transition-colors"
        >
          Abrir Ficha
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onOpenSale(p); }}
          className="flex-1 bg-[#C5A059] text-white py-2.5 text-[9px] font-bold uppercase tracking-widest shadow-sm hover:bg-[#1A1A1A] transition-colors"
        >
          Fechar Venda
        </button>
      </div>
    </div>
  );
});

PatientCard.displayName = "PatientCard";
export default PatientCard;