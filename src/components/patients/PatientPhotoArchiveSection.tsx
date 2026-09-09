"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, ExternalLink, Image as ImageIcon, RefreshCw } from "lucide-react";

type Props = { patientId: string };

type ArchivePhoto = {
  key: string;
  url: string;
  date?: string | null;
  title: string;
  source: "GALERIA" | "EVOLUCAO";
  authorized?: boolean;
};

function parseImages(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string" && /^https:\/\//i.test(item));
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string" && /^https:\/\//i.test(item)) : [];
    } catch {
      return /^https:\/\//i.test(value) ? [value] : [];
    }
  }
  return [];
}

function formatDate(value?: string | null) {
  if (!value) return "Sem data";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Sem data" : date.toLocaleDateString("pt-BR");
}

function safeFilePart(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
}

export default function PatientPhotoArchiveSection({ patientId }: Props) {
  const [legacyPhotos, setLegacyPhotos] = useState<any[]>([]);
  const [evolutionPlans, setEvolutionPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [photosRes, evolutionRes] = await Promise.all([
        fetch(`/api/patients/${patientId}/photos`, { cache: "no-store" }),
        fetch(`/api/patients/${patientId}/evolution`, { cache: "no-store" }),
      ]);

      const photosJson = await photosRes.json().catch(() => null);
      const evolutionJson = await evolutionRes.json().catch(() => null);

      if (!photosRes.ok && !evolutionRes.ok) {
        throw new Error(photosJson?.error || evolutionJson?.error || "Não foi possível ler o arquivo de fotos.");
      }

      setLegacyPhotos(photosRes.ok && Array.isArray(photosJson) ? photosJson : []);
      setEvolutionPlans(evolutionRes.ok && Array.isArray(evolutionJson) ? evolutionJson : []);
      if (!photosRes.ok || !evolutionRes.ok) {
        setError("Parte do arquivo não pôde ser carregada. O sistema preservou os registros disponíveis e não alterou nenhum dado.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar as fotos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (patientId) load(); }, [patientId]);

  const photos = useMemo<ArchivePhoto[]>(() => {
    const list: ArchivePhoto[] = [];
    for (const photo of legacyPhotos) {
      if (!photo?.imageUrl || !/^https:\/\//i.test(String(photo.imageUrl))) continue;
      list.push({
        key: `legacy-${photo.id || photo.imageUrl}`,
        url: String(photo.imageUrl),
        date: photo.takenAt || photo.createdAt,
        title: photo.title || photo.procedureName || "Registro clínico",
        source: "GALERIA",
        authorized: Boolean(photo.imageAuthorized),
      });
    }
    for (const plan of evolutionPlans) {
      for (const session of Array.isArray(plan?.sessions) ? plan.sessions : []) {
        parseImages(session.imagesJson).forEach((url, index) => {
          list.push({
            key: `evolution-${session.id}-${index}-${url}`,
            url,
            date: session.sessionDate || session.createdAt,
            title: plan.treatmentName || session.performedProcedure || "Evolução clínica",
            source: "EVOLUCAO",
          });
        });
      }
    }

    const seen = new Set<string>();
    return list
      .filter((item) => !seen.has(item.url) && seen.add(item.url))
      .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
  }, [legacyPhotos, evolutionPlans]);

  return (
    <section className="bg-white border border-[rgba(90,31,43,.10)] p-6 sm:p-10 rounded-sm shadow-sm animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#5A1F2B]/70">Arquivo preservado</p>
          <h3 className="mt-2 font-serif text-xl uppercase tracking-widest">Fotos clínicas</h3>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#5B3A2E]/64">
            Esta tela reúne as fotos da antiga galeria e as imagens salvas nas evoluções. É somente uma visualização do histórico: abrir esta aba não altera nem exclui registros.
          </p>
        </div>
        <button type="button" onClick={load} disabled={loading} className="inline-flex h-10 items-center gap-2 border border-[#E7DED0] px-4 text-[9px] font-bold uppercase tracking-widest text-[#5A1F2B] disabled:opacity-50">
          <RefreshCw size={13} className={loading ? "animate-spin" : ""}/> Atualizar
        </button>
      </div>

      {error && <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] leading-5 text-amber-800">{error}</div>}

      {loading ? (
        <div className="mt-8 rounded-2xl border border-dashed border-[#5A1F2B]/20 bg-[#F7F2EA]/60 p-10 text-center text-sm text-[#5B3A2E]/60">Carregando arquivo de fotos…</div>
      ) : photos.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-[#5A1F2B]/20 bg-[#F7F2EA]/60 p-10 text-center text-sm text-[#5B3A2E]/60">
          Nenhuma foto foi localizada nas fontes atuais. Isso não executa exclusão; se você sabe que havia imagens aqui, verifique o banco/backup antes de cadastrar novas por cima.
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {photos.map((photo, index) => {
            const filename = `${safeFilePart(photo.title)}-${formatDate(photo.date).replaceAll("/", "-")}-foto-${index + 1}`;
            return (
              <article key={photo.key} className="overflow-hidden rounded-sm border border-[#ECE7DD] bg-[#FCFAF6]">
                <a href={photo.url} target="_blank" rel="noreferrer" className="block aspect-[4/3] overflow-hidden bg-[#F7F2EA]">
                  <img src={photo.url} alt={photo.title} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                </a>
                <div className="p-3">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-[#5A1F2B]">{formatDate(photo.date)}</p>
                  <p className="mt-1 truncate text-[11px] font-semibold text-[#2C2724]">{photo.title}</p>
                  <p className="mt-1 text-[9px] uppercase tracking-wide text-gray-400">{photo.source === "EVOLUCAO" ? "Evolução" : "Galeria anterior"}{photo.authorized ? " • autorizada" : ""}</p>
                  <div className="mt-3 flex gap-2">
                    <a href={photo.url} target="_blank" rel="noreferrer" className="inline-flex h-8 flex-1 items-center justify-center gap-1 border border-[#E7DED0] text-[8px] font-bold uppercase tracking-wider text-[#5A1F2B]"><ExternalLink size={11}/> Abrir</a>
                    <a href={`/api/clinical-images/download?url=${encodeURIComponent(photo.url)}&name=${encodeURIComponent(filename)}`} className="inline-flex h-8 flex-1 items-center justify-center gap-1 bg-[#111] text-[8px] font-bold uppercase tracking-wider text-white"><Download size={11}/> Baixar</a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div className="mt-6 flex items-center gap-2 text-[10px] text-[#5B3A2E]/55"><ImageIcon size={13}/> {photos.length} imagem{photos.length === 1 ? "" : "s"} localizada{photos.length === 1 ? "" : "s"}.</div>
    </section>
  );
}
