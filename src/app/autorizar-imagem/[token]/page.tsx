"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import SignatureCanvas from "react-signature-canvas";
import { CheckCircle, Eraser, ShieldCheck } from "lucide-react";
import {
  IMAGE_AUTHORIZATION_SECTIONS,
  IMAGE_AUTHORIZATION_TITLE,
  IMAGE_CHANNEL_OPTIONS,
  IMAGE_CONTENT_OPTIONS,
  imageAuthorizationIntro,
} from "@/lib/imageAuthorizationLegal";
import { CONTRACTOR_INFO } from "@/lib/contractLegalCore";

type PublicAuthorization = {
  id: string;
  title: string;
  status: "PENDING" | "SIGNED" | "REVOKED" | "CANCELED";
  contentTypes?: string[] | null;
  channels?: string[] | null;
  signatureName?: string | null;
  signatureImage?: string | null;
  signedAt?: string | null;
  revokedAt?: string | null;
  patient: { name?: string | null; cpf?: string | null };
};

export default function ImageAuthorizationPage() {
  const params = useParams<{ token: string }>();
  const token = Array.isArray(params?.token) ? params.token[0] : params?.token;
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [doc, setDoc] = useState<PublicAuthorization | null>(null);
  const [contentTypes, setContentTypes] = useState<string[]>([]);
  const [channels, setChannels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/public/image-authorization/${token}`, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Não foi possível carregar a autorização.");
      setDoc(data);
      setContentTypes(Array.isArray(data.contentTypes) ? data.contentTypes : []);
      setChannels(Array.isArray(data.channels) ? data.channels : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível carregar a autorização.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [token]);

  function toggle(list: string[], setter: (next: string[]) => void, key: string) {
    setter(list.includes(key) ? list.filter((item) => item !== key) : [...list, key]);
  }

  async function sign() {
    if (!token || !doc) return;
    if (!contentTypes.length) return alert("Selecione ao menos um tipo de conteúdo que você autoriza.");
    if (!channels.length) return alert("Selecione ao menos um canal de divulgação que você autoriza.");
    if (sigCanvas.current?.isEmpty()) return alert("Por favor, assine no quadro em branco antes de confirmar.");

    setSaving(true);
    try {
      const signatureImage = sigCanvas.current?.getTrimmedCanvas().toDataURL("image/png");
      const res = await fetch(`/api/public/image-authorization/${token}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentTypes, channels, signatureImage }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Não foi possível registrar a autorização.");
      setDoc(data);
      setContentTypes(Array.isArray(data.contentTypes) ? data.contentTypes : contentTypes);
      setChannels(Array.isArray(data.channels) ? data.channels : channels);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro ao registrar a autorização.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="min-h-screen bg-[#F7F2EA] flex items-center justify-center text-sm">Carregando autorização...</div>;
  if (error || !doc) return <div className="min-h-screen bg-[#F7F2EA] flex items-center justify-center p-6"><div className="max-w-md bg-white border border-red-200 p-7 text-center"><h1 className="font-serif text-2xl">Autorização indisponível</h1><p className="mt-3 text-sm text-[#64748B]">{error}</p></div></div>;

  const locked = doc.status !== "PENDING";
  const signed = doc.status === "SIGNED";

  return (
    <div className="min-h-screen bg-[#F7F2EA] text-[#1E1A18] font-sans">
      <header className="sticky top-0 z-40 bg-[#1E1A18] px-5 py-5 text-center shadow-md">
        <h1 className="font-serif text-lg md:text-xl uppercase tracking-widest text-[#C8A35F]">Mariana Thomaz Carmona</h1>
        <p className="mt-1 flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/70"><ShieldCheck size={12}/> Autorização de imagem e voz</p>
      </header>

      <main className="mx-auto max-w-4xl px-3 py-5 md:px-6 md:py-10">
        {signed && (
          <div className="mb-5 border border-emerald-200 bg-emerald-50 p-5 text-center text-emerald-700">
            <CheckCircle className="mx-auto mb-2" size={28}/>
            <p className="font-semibold">Autorização registrada com sucesso.</p>
            {doc.signedAt && <p className="mt-1 text-xs">Assinado em {new Date(doc.signedAt).toLocaleString("pt-BR")}</p>}
          </div>
        )}
        {doc.status === "REVOKED" && <div className="mb-5 border border-red-200 bg-red-50 p-5 text-center text-red-700"><strong>Autorização revogada.</strong>{doc.revokedAt && <div className="text-xs mt-1">Revogada em {new Date(doc.revokedAt).toLocaleString("pt-BR")}</div>}</div>}
        {doc.status === "CANCELED" && <div className="mb-5 border border-gray-200 bg-gray-50 p-5 text-center text-gray-600"><strong>Esta solicitação foi cancelada.</strong></div>}

        <article className="border border-[#ECE7DD] bg-white p-5 shadow-sm md:p-9">
          <div className="border-b border-[#E9DEC9] pb-6 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#5A1F2B]">THOMAZ &amp; CARMONA LTDA.</p>
            <h2 className="mt-3 font-serif text-2xl md:text-3xl">{IMAGE_AUTHORIZATION_TITLE}</h2>
            <div className="mt-4 text-xs leading-relaxed text-[#64748B]">
              <div>Paciente: <strong className="text-[#1E1A18]">{doc.patient?.name || "Não informado"}</strong></div>
              <div>CPF: <strong className="text-[#1E1A18]">{doc.patient?.cpf || "Não informado"}</strong></div>
            </div>
          </div>

          <p className="mt-7 text-[14px] leading-7 text-[#2D2926]">{imageAuthorizationIntro(doc.patient?.name, doc.patient?.cpf)}</p>

          <div className="mt-7 space-y-7">
            {IMAGE_AUTHORIZATION_SECTIONS.map((section) => (
              <section key={section.title}>
                <h3 className="mb-3 text-[11px] font-black uppercase tracking-[0.14em] text-[#5A1F2B]">{section.title}</h3>
                {"type" in section && section.type === "content-options" ? (
                  <>
                    <p className="mb-3 text-[14px] leading-7">{section.paragraphs[0]}</p>
                    <div className="grid gap-2 md:grid-cols-2">
                      {IMAGE_CONTENT_OPTIONS.map((option) => (
                        <label key={option.key} className={`flex items-start gap-3 border p-3 text-sm ${locked ? "bg-[#FCFAF6]" : "cursor-pointer hover:bg-[#FCFAF6]"}`}>
                          <input type="checkbox" disabled={locked} checked={contentTypes.includes(option.key)} onChange={() => toggle(contentTypes, setContentTypes, option.key)} className="mt-0.5 h-4 w-4"/>
                          <span>{option.label}</span>
                        </label>
                      ))}
                    </div>
                    <p className="mt-3 text-[14px] leading-7">{section.paragraphs[1]}</p>
                  </>
                ) : "type" in section && section.type === "channel-options" ? (
                  <>
                    <p className="mb-3 text-[14px] leading-7">{section.paragraphs[0]}</p>
                    <div className="grid gap-2">
                      {IMAGE_CHANNEL_OPTIONS.map((option) => (
                        <label key={option.key} className={`flex items-start gap-3 border p-3 text-sm ${locked ? "bg-[#FCFAF6]" : "cursor-pointer hover:bg-[#FCFAF6]"}`}>
                          <input type="checkbox" disabled={locked} checked={channels.includes(option.key)} onChange={() => toggle(channels, setChannels, option.key)} className="mt-0.5 h-4 w-4"/>
                          <span>{option.label}</span>
                        </label>
                      ))}
                    </div>
                    <p className="mt-3 text-[14px] leading-7">{section.paragraphs[1]}</p>
                  </>
                ) : (
                  <div className="space-y-3">
                    {section.paragraphs.map((paragraph) => (
                      <p key={paragraph.slice(0, 60)} className="whitespace-pre-line text-[14px] leading-7 text-[#2D2926]">{paragraph}</p>
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>

          <section className="mt-9 border-t border-[#E9DEC9] pt-7">
            <div className="rounded-sm bg-[#FCFAF6] p-4 text-xs leading-6 text-[#4B403A]">
              <strong>Paciente:</strong> {doc.patient?.name || "Não informado"}<br/>
              <strong>CPF:</strong> {doc.patient?.cpf || "Não informado"}<br/>
              {doc.signedAt && <><strong>Data e horário da autorização:</strong> {new Date(doc.signedAt).toLocaleString("pt-BR")}<br/></>}
            </div>

            <div className="mt-7 text-center">
              <div className="font-serif italic text-xl">{CONTRACTOR_INFO.professionalName}</div>
              <div className="mx-auto mt-1 h-px w-64 bg-[#1E1A18]"/>
              <div className="mt-2 text-xs font-bold">{CONTRACTOR_INFO.companyName}</div>
              <div className="text-xs text-[#64748B]">CNPJ nº {CONTRACTOR_INFO.cnpj}</div>
              <div className="text-xs text-[#64748B]">Responsável profissional: {CONTRACTOR_INFO.professionalName} – {CONTRACTOR_INFO.professionalCredential}</div>
              <div className="mt-1 text-[9px] uppercase tracking-widest text-[#96A4C1]">Assinatura da CONTRATADA fixa no sistema</div>
            </div>

            {doc.status === "PENDING" && (
              <div className="mx-auto mt-9 max-w-xl">
                <h3 className="text-center font-serif text-xl">Assinatura eletrônica do(a) paciente</h3>
                <p className="mt-2 text-center text-sm leading-relaxed text-[#64748B]">Após selecionar exatamente o conteúdo e os canais que autoriza, assine no quadro abaixo.</p>
                <div className="mb-2 mt-6 flex items-end justify-between px-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#96A4C1]">Sua assinatura</span>
                  <button type="button" onClick={() => sigCanvas.current?.clear()} className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-red-400"><Eraser size={12}/> Limpar</button>
                </div>
                <div className="h-64 touch-none overflow-hidden rounded-xl border-2 border-dashed border-[#5A1F2B]/50 bg-white shadow-inner">
                  <SignatureCanvas ref={sigCanvas} penColor="#1E1A18" canvasProps={{ className: "w-full h-full" }}/>
                </div>
                <button type="button" disabled={saving} onClick={sign} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1E1A18] py-4 text-[12px] font-bold uppercase tracking-widest text-white shadow-lg transition hover:bg-[#5A1F2B] disabled:opacity-60">
                  {saving ? "Registrando autorização..." : <><CheckCircle size={18}/> Confirmar autorização e assinatura</>}
                </button>
              </div>
            )}

            {signed && doc.signatureImage && (
              <div className="mx-auto mt-8 max-w-xl border-t pt-6 text-center">
                <img src={doc.signatureImage} alt="Assinatura da paciente" className="mx-auto h-20 max-w-full object-contain"/>
                <div className="mx-auto h-px w-64 bg-[#1E1A18]"/>
                <p className="mt-2 text-xs font-semibold">{doc.signatureName || doc.patient?.name}</p>
                {doc.signedAt && <p className="text-[10px] text-[#64748B]">Assinado em {new Date(doc.signedAt).toLocaleString("pt-BR")}</p>}
              </div>
            )}
          </section>
        </article>
      </main>
    </div>
  );
}
