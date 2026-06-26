"use client";

import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LockKeyhole, Sparkles, UserRound } from "lucide-react";
import { brand } from "@/lib/brand";

export default function LoginPage() {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const savedUser = window.localStorage.getItem("mariana-login-user");
    if (savedUser) setUser(savedUser);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);

    if (remember) window.localStorage.setItem("mariana-login-user", user);
    else window.localStorage.removeItem("mariana-login-user");

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
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-brand-background px-6 py-10 font-sans text-brand-text">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -left-48 -top-48 h-[520px] w-[520px] rounded-full bg-brand-primary/10 blur-[110px]" />
        <div className="absolute -bottom-56 right-[-120px] h-[620px] w-[620px] rounded-full bg-brand-background-secondary/40 blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.22] [background-image:radial-gradient(rgba(90,31,43,.16)_1px,transparent_1px)] [background-size:28px_28px]" />
      </div>

      <section className="relative z-10 grid w-full max-w-6xl overflow-hidden rounded-[36px] border border-[rgba(90,31,43,.12)] bg-[rgba(251,248,242,.76)] shadow-[0_28px_90px_rgba(63,22,32,.13)] backdrop-blur-2xl lg:grid-cols-[1.05fr_.95fr]">
        <div className="hidden min-h-[690px] flex-col justify-between bg-[linear-gradient(135deg,rgba(90,31,43,.95),rgba(63,22,32,.94))] p-12 text-[#F7F2EA] lg:flex">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#F7F2EA]/18 bg-[#F7F2EA]/8 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.22em]">
              <Sparkles size={13} /> Clínica estética premium
            </div>
            <h1 className="mt-14 max-w-[540px] font-serif text-[72px] leading-[0.9] text-[#F7F2EA]">
              Cuidar da beleza é construir confiança, naturalidade e presença.
            </h1>
            <p className="mt-8 max-w-[450px] text-[14px] leading-7 text-[#F7F2EA]/72">
              Um sistema pensado para organizar a experiência da paciente com acolhimento, precisão clínica e gestão elegante.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-[#F7F2EA]/78">
            {["Pacientes", "Financeiro", "Agenda"].map((item) => (
              <div key={item} className="rounded-3xl border border-[#F7F2EA]/12 bg-[#F7F2EA]/7 p-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.24em]">{item}</p>
                <div className="mt-5 h-1.5 rounded-full bg-[#F7F2EA]/14">
                  <div className="h-full w-2/3 rounded-full bg-[#F7F2EA]/58" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex min-h-[690px] items-center justify-center p-7 sm:p-12">
          <div className="w-full max-w-[430px] animate-soft-in">
            <div className="mb-10 text-center">
              <div className="mx-auto mb-7 flex min-h-[220px] w-full max-w-[310px] items-center justify-center rounded-[42px] border border-[rgba(90,31,43,.12)] bg-brand-surface px-7 py-6 shadow-card">
                <img
                  src={brand.logo}
                  alt="Logo Mariana Thomaz Carmona"
                  className="h-full max-h-[196px] w-full object-contain"
                />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.36em] text-brand-primary/70">Bem-vinda</p>
              <h2 className="mt-3 font-serif text-[40px] leading-none text-brand-strong">Painel da clínica</h2>
              <p className="mt-4 text-[13px] leading-6 text-brand-text/62">Acesse sua rotina com segurança, clareza e sofisticação.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-brand-text/58">
                  <UserRound size={13} /> Usuário
                </span>
                <input
                  type="text"
                  required
                  value={user}
                  placeholder="Digite seu usuário"
                  className="h-13 w-full border px-4 text-[14px] outline-none"
                  onChange={(e) => {
                    setUser(e.target.value);
                    setError(false);
                  }}
                  autoComplete="username"
                />
              </label>

              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-brand-text/58">
                  <LockKeyhole size={13} /> Senha
                </span>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={pass}
                    placeholder="Digite sua senha"
                    className="h-13 w-full border px-4 pr-13 text-[14px] outline-none"
                    onChange={(e) => {
                      setPass(e.target.value);
                      setError(false);
                    }}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-brand-text/55 transition hover:bg-[rgba(90,31,43,.08)] hover:text-brand-primary"
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </label>

              <div className="flex items-center justify-between pt-1">
                <label className="mb-0 flex cursor-pointer items-center gap-2 text-[12px] font-medium normal-case tracking-normal text-brand-text/64">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded-md accent-brand-primary"
                  />
                  Lembrar usuário
                </label>
              </div>

              {error && (
                <div className="rounded-2xl border border-brand-danger/18 bg-brand-danger/8 px-4 py-3 text-center text-[11px] font-bold uppercase tracking-[0.18em] text-brand-danger animate-soft-in">
                  Acesso negado. Confira usuário e senha.
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-primary h-13 w-full disabled:cursor-not-allowed disabled:opacity-60">
                {loading ? "Sincronizando..." : "Acessar sistema"}
              </button>
            </form>

            <p className="mt-10 text-center text-[8px] font-bold uppercase tracking-[0.28em] text-brand-text/40">
              Mariana Thomaz Carmona • Clinic Management
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
