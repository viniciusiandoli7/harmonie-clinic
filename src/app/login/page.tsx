"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);

    const res = await signIn("credentials", {
      username: user,
      password: pass,
      redirect: false,
    });

    if (res?.error) {
      setError(true);
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="relative h-screen w-full bg-[#050505] flex items-center justify-center overflow-hidden font-sans">
      
      {/* 1. FUNDO ATMOSFÉRICO (AGORA ESTÁTICO E ULTRA-LEVE) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Halo de luz dourado suave e fixo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#C5A059]/10 rounded-full blur-[160px] opacity-40" />
        
        {/* Textura sutil de stardust para aspecto de luxo */}
        <div className="absolute inset-0 opacity-[0.04] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
      </div>

      {/* 2. CARD DE ACESSO */}
      <div className="relative z-10 w-full max-w-[420px] p-16 bg-[#0A0A0B]/70 backdrop-blur-3xl border border-white/[0.08] shadow-[0_40px_100px_rgba(0,0,0,0.8)] rounded-sm">
        
        {/* LOGO DA CLÍNICA (O H DO FAVICON) */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-8">
            {/* Medalhão dourado (Adicionei Tailwind hover simples e leve) */}
            <div className="relative w-16 h-16 border border-[#C5A059]/40 p-2 rounded-full hover:scale-105 transition-transform duration-300">
              <div className="w-full h-full border border-[#C5A059] rounded-full flex items-center justify-center bg-[#0A0A0B]">
                <Image 
                  src="/favicon.ico" 
                  alt="Harmonie Logo" 
                  width={32} 
                  height={32} 
                  className="brightness-125 contrast-125"
                />
              </div>
            </div>
          </div>

          {/* HARMONIE - OURO NÍTIDO E BONITO (SEM ALTERAÇÃO NA ESTÉTICA) */}
          <h1 className="font-serif text-[46px] tracking-[0.2em] font-normal uppercase italic 
                         bg-gradient-to-b from-[#FFF5D1] via-[#C5A059] to-[#866B3B] 
                         bg-clip-text text-transparent drop-shadow-[0_5px_15px_rgba(0,0,0,0.5)]">
            Harmonie
          </h1>
          <div className="h-[1px] w-12 bg-[#C5A059]/40 mx-auto mt-4" />
          <p className="mt-4 text-[9px] tracking-[0.7em] text-white/40 uppercase font-black">Private Cloud System</p>
        </div>

        {/* INPUTS LIMPOS, RÁPIDOS E SEM FRAME-MOTION */}
        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="group relative border-b border-white/10 focus-within:border-[#C5A059] transition-all duration-300">
            <input 
              type="text" required placeholder="IDENTIFICAÇÃO"
              className="w-full bg-transparent py-3 text-[11px] text-white tracking-[0.3em] outline-none placeholder:text-white/5 uppercase"
              onChange={(e) => { setUser(e.target.value); setError(false); }}
            />
          </div>

          <div className="group relative border-b border-white/10 focus-within:border-[#C5A059] transition-all duration-300">
            <input 
              type="password" required placeholder="CHAVE MESTRA"
              className="w-full bg-transparent py-3 text-[11px] text-white tracking-[0.3em] outline-none placeholder:text-white/5 uppercase"
              onChange={(e) => { setPass(e.target.value); setError(false); }}
            />
          </div>

          {/* MENSAGEM DE ERRO (Renderização Condicional Direta, Sem Animação) */}
          {error && (
            <p className="text-[10px] text-[#C5A059] font-bold uppercase tracking-[0.2em] text-center italic transition-opacity duration-300">
              Acesso Negado
            </p>
          )}

          <button 
            disabled={loading}
            className="w-full py-5 bg-transparent border border-[#C5A059]/40 text-white/90 text-[11px] font-bold uppercase tracking-[0.5em] 
                       hover:bg-[#C5A059] hover:text-black transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Sincronizando..." : "Acessar Sistema"}
          </button>
        </form>

        <div className="mt-20 text-center opacity-30">
           <p className="text-[7px] text-white tracking-[0.5em] uppercase font-bold">
             v2.6 • Harmonie Clinic Intelligence
           </p>
        </div>
      </div>
    </div>
  );
}