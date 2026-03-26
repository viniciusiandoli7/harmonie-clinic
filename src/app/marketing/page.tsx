"use client";

import { useMemo, useRef, useState } from "react";
import {
  Wand2,
  Download,
  Sparkles,
  Type,
  LayoutTemplate,
  Image as ImageIcon,
  RefreshCcw,
  Copy,
  Check,
  GripVertical,
  Upload,
  Trash2,
  Save,
  FolderOpen,
} from "lucide-react";
import { toPng } from "html-to-image";

type MarketingGoal = "INSTAGRAM_POST" | "STORY";
type CanvasTemplate =
  | "RESULTADO_DUO"
  | "TEXTO_EDUCATIVO"
  | "ANTES_DEPOIS"
  | "PROMO_LUXO";
type PaletteKey = "BLACK" | "GOLD";
type DraggableElement = "headline" | "subheadline" | "cta" | "logo";

type BrandPalette = {
  background: string;
  card: string;
  text: string;
  muted: string;
  accent: string;
  accentSoft: string;
};

type GeneratedCreative = {
  headline: string;
  subheadline: string;
  cta: string;
  visualSuggestion: string;
  hashtags: string[];
};

type DraftData = {
  goal: MarketingGoal;
  template: CanvasTemplate;
  paletteKey: PaletteKey;
  clinicName: string;
  procedure: string;
  audience: string;
  benefit: string;
  tone: string;
  promo: string;
  prompt: string;
  headline: string;
  subheadline: string;
  cta: string;
  visualSuggestion: string;
  hashtags: string;
  positions: Record<DraggableElement, { x: number; y: number }>;
  primaryImage: string | null;
  secondaryImage: string | null;
};

const brandStyle = {
  fontTitle: 'Georgia, "Times New Roman", serif',
};

const palettes: Record<PaletteKey, BrandPalette> = {
  BLACK: {
    background: "#111111",
    card: "#181818",
    text: "#F5F1EA",
    muted: "#C7BFB2",
    accent: "#C8A35F",
    accentSoft: "#2B241B",
  },
  GOLD: {
    background: "#F7F3EC",
    card: "#FFFDF9",
    text: "#111111",
    muted: "#8E9AAF",
    accent: "#C8A35F",
    accentSoft: "#EFE3CC",
  },
};

function getGoalSize(goal: MarketingGoal) {
  if (goal === "STORY") return { width: 1080, height: 1920 };
  return { width: 1080, height: 1080 };
}

function generateCreative(params: {
  procedure: string;
  audience: string;
  benefit: string;
  tone: string;
  promo: string;
  template: CanvasTemplate;
}): GeneratedCreative {
  const procedure = params.procedure || "tratamento estético";
  const audience = params.audience || "mulheres que buscam resultados naturais";
  const benefit = params.benefit || "mais autoestima e naturalidade";
  const tone = params.tone || "sofisticado";
  const promo = params.promo || "";

  const byTemplate: Record<
    CanvasTemplate,
    { headline: string; subheadline: string; cta: string }
  > = {
    RESULTADO_DUO: {
      headline: "Resultados naturais e estratégicos",
      subheadline: `${procedure} com foco em ${benefit}.`,
      cta: "Agende sua avaliação",
    },
    TEXTO_EDUCATIVO: {
      headline: `O que ${procedure} realmente faz?`,
      subheadline: `Conteúdo ${tone} para ${audience}, explicando benefícios, indicações e cuidados.`,
      cta: "Fale com a clínica",
    },
    ANTES_DEPOIS: {
      headline: "Antes e depois com naturalidade",
      subheadline: `${procedure} valorizando sua beleza sem exageros.`,
      cta: "Reserve seu horário",
    },
    PROMO_LUXO: {
      headline: `Realce sua beleza com ${procedure}`,
      subheadline: promo
        ? `${promo}. Atendimento premium com foco em ${benefit}.`
        : `Uma experiência ${tone}, segura e personalizada.`,
      cta: "Solicite atendimento",
    },
  };

  return {
    headline: byTemplate[params.template].headline,
    subheadline: byTemplate[params.template].subheadline,
    cta: byTemplate[params.template].cta,
    visualSuggestion:
      "Arte premium para clínica estética com fundo escuro sofisticado, serif editorial, dourado discreto e composição clean.",
    hashtags: [
      "#harmonieclinic",
      "#clinicadeestetica",
      "#belezanatural",
      "#esteticapremium",
      "#resultadosnaturais",
    ],
  };
}

function PanelTitle({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-10 w-10 items-center justify-center border border-[#ECE7DD] bg-white text-[#C8A35F]">
        {icon}
      </div>
      <div>
        <h3 className="text-[15px] font-semibold text-[#111111]">{title}</h3>
        {subtitle ? <p className="mt-1 text-[13px] text-[#64748B]">{subtitle}</p> : null}
      </div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.22em] text-[#96A4C1]">
      {children}
    </label>
  );
}

export default function MarketingPage() {
  const [goal, setGoal] = useState<MarketingGoal>("INSTAGRAM_POST");
  const [template, setTemplate] = useState<CanvasTemplate>("RESULTADO_DUO");
  const [paletteKey, setPaletteKey] = useState<PaletteKey>("BLACK");

  const [clinicName, setClinicName] = useState("Harmonie Clinic");
  const [procedure, setProcedure] = useState("Preenchimento labial");
  const [audience, setAudience] = useState(
    "mulheres que buscam sofisticação e naturalidade"
  );
  const [benefit, setBenefit] = useState("harmonia facial e autoestima");
  const [tone, setTone] = useState("sofisticado");
  const [promo, setPromo] = useState("Avaliação personalizada");
  const [prompt, setPrompt] = useState(
    "Criar arte premium para clínica estética com tipografia editorial, fundo escuro, dourado discreto e foco em resultados naturais."
  );

  const initialCreative = useMemo(
    () =>
      generateCreative({
        procedure,
        audience,
        benefit,
        tone,
        promo,
        template,
      }),
    []
  );

  const [headline, setHeadline] = useState(initialCreative.headline);
  const [subheadline, setSubheadline] = useState(initialCreative.subheadline);
  const [cta, setCta] = useState(initialCreative.cta);
  const [visualSuggestion, setVisualSuggestion] = useState(
    initialCreative.visualSuggestion
  );
  const [hashtags, setHashtags] = useState(initialCreative.hashtags.join(" "));
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [notice, setNotice] = useState("");

  const [positions, setPositions] = useState<
    Record<DraggableElement, { x: number; y: number }>
  >({
    headline: { x: 8, y: 14 },
    subheadline: { x: 8, y: 78 },
    cta: { x: 8, y: 90 },
    logo: { x: 50, y: 6 },
  });

  const [dragging, setDragging] = useState<DraggableElement | null>(null);
  const [primaryImage, setPrimaryImage] = useState<string | null>(null);
  const [secondaryImage, setSecondaryImage] = useState<string | null>(null);

  const palette = palettes[paletteKey];
  const size = getGoalSize(goal);
  const previewRef = useRef<HTMLDivElement | null>(null);

  function showNotice(text: string) {
    setNotice(text);
    setTimeout(() => setNotice(""), 1800);
  }

  function handleGenerate() {
    const creative = generateCreative({
      procedure,
      audience,
      benefit,
      tone,
      promo,
      template,
    });

    setHeadline(creative.headline);
    setSubheadline(`${creative.subheadline} ${prompt}`);
    setCta(creative.cta);
    setVisualSuggestion(creative.visualSuggestion);
    setHashtags(creative.hashtags.join(" "));

    if (template === "RESULTADO_DUO") {
      setPositions({
        headline: { x: 8, y: 13 },
        subheadline: { x: 8, y: 78 },
        cta: { x: 8, y: 90 },
        logo: { x: 50, y: 6 },
      });
    } else if (template === "TEXTO_EDUCATIVO") {
      setPositions({
        headline: { x: 50, y: 40 },
        subheadline: { x: 50, y: 58 },
        cta: { x: 50, y: 84 },
        logo: { x: 50, y: 8 },
      });
    } else if (template === "ANTES_DEPOIS") {
      setPositions({
        headline: { x: 8, y: 10 },
        subheadline: { x: 8, y: 80 },
        cta: { x: 8, y: 91 },
        logo: { x: 50, y: 95 },
      });
    } else {
      setPositions({
        headline: { x: 8, y: 20 },
        subheadline: { x: 8, y: 38 },
        cta: { x: 8, y: 58 },
        logo: { x: 8, y: 88 },
      });
    }
  }

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!dragging) return;
    const rect = previewRef.current?.getBoundingClientRect();
    if (!rect) return;

    const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
    const yPercent = ((e.clientY - rect.top) / rect.height) * 100;

    setPositions((prev) => ({
      ...prev,
      [dragging]: {
        x: Math.max(2, Math.min(92, xPercent)),
        y: Math.max(4, Math.min(95, yPercent)),
      },
    }));
  }

  function stopDragging() {
    setDragging(null);
  }

  function readImageFile(
    e: React.ChangeEvent<HTMLInputElement>,
    target: "primary" | "secondary"
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : null;
      if (!result) return;
      if (target === "primary") setPrimaryImage(result);
      else setSecondaryImage(result);
    };
    reader.readAsDataURL(file);
  }

  async function handleCopyPrompt() {
    await navigator.clipboard.writeText(visualSuggestion);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  async function handleExportPng() {
    if (!previewRef.current) return;
    try {
      setExporting(true);
      const dataUrl = await toPng(previewRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `arte-harmonie-${Date.now()}.png`;
      a.click();
      showNotice("PNG exportado");
    } catch {
      showNotice("Erro ao exportar PNG");
    } finally {
      setExporting(false);
    }
  }

  function handleSaveDraft() {
    const draft: DraftData = {
      goal,
      template,
      paletteKey,
      clinicName,
      procedure,
      audience,
      benefit,
      tone,
      promo,
      prompt,
      headline,
      subheadline,
      cta,
      visualSuggestion,
      hashtags,
      positions,
      primaryImage,
      secondaryImage,
    };

    localStorage.setItem("harmonie-marketing-draft", JSON.stringify(draft));
    showNotice("Rascunho salvo");
  }

  function handleLoadDraft() {
    const raw = localStorage.getItem("harmonie-marketing-draft");
    if (!raw) {
      showNotice("Nenhum rascunho salvo");
      return;
    }

    const draft = JSON.parse(raw) as DraftData;
    setGoal(draft.goal);
    setTemplate(draft.template);
    setPaletteKey(draft.paletteKey);
    setClinicName(draft.clinicName);
    setProcedure(draft.procedure);
    setAudience(draft.audience);
    setBenefit(draft.benefit);
    setTone(draft.tone);
    setPromo(draft.promo);
    setPrompt(draft.prompt);
    setHeadline(draft.headline);
    setSubheadline(draft.subheadline);
    setCta(draft.cta);
    setVisualSuggestion(draft.visualSuggestion);
    setHashtags(draft.hashtags);
    setPositions(draft.positions);
    setPrimaryImage(draft.primaryImage);
    setSecondaryImage(draft.secondaryImage);
    showNotice("Rascunho carregado");
  }

  const previewScale = goal === "STORY" ? 0.22 : 0.34;

  function renderCanvasImages() {
    if (template === "RESULTADO_DUO") {
      return (
        <div className="absolute inset-x-[8%] top-[25%] grid h-[45%] grid-cols-2 gap-3">
          <div className="overflow-hidden border border-white/10 bg-[#1E1E1E]">
            {primaryImage ? (
              <img src={primaryImage} alt="arte 1" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-white/45">
                imagem 1
              </div>
            )}
          </div>
          <div className="overflow-hidden border border-white/10 bg-[#1E1E1E]">
            {secondaryImage ? (
              <img src={secondaryImage} alt="arte 2" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-white/45">
                imagem 2
              </div>
            )}
          </div>
        </div>
      );
    }

    if (template === "ANTES_DEPOIS") {
      return (
        <div className="absolute inset-x-[8%] top-[22%] grid h-[52%] grid-cols-2 gap-3">
          <div className="overflow-hidden border border-white/10 bg-[#1E1E1E]">
            {primaryImage ? (
              <img src={primaryImage} alt="antes" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-white/45">
                antes
              </div>
            )}
          </div>
          <div className="overflow-hidden border border-white/10 bg-[#1E1E1E]">
            {secondaryImage ? (
              <img src={secondaryImage} alt="depois" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-white/45">
                depois
              </div>
            )}
          </div>
        </div>
      );
    }

    if (template === "PROMO_LUXO") {
      return (
        <div className="absolute right-[7%] top-[10%] h-[74%] w-[38%] overflow-hidden border border-white/10 bg-[#1E1E1E]">
          {primaryImage ? (
            <img src={primaryImage} alt="promo" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-white/45">
              imagem principal
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="absolute inset-0">
        {primaryImage ? (
          <img src={primaryImage} alt="educativo" className="h-full w-full object-cover opacity-55" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-white/30">
            imagem de fundo
          </div>
        )}
        <div className="absolute inset-0 bg-black/35" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F3] px-8 py-8 md:px-10 xl:px-14 xl:py-10">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.38em] text-[#C8A35F]">
            Harmonie Management System
          </p>
          <h1
            className="mt-3 text-[46px] leading-none text-[#111111] xl:text-[48px]"
            style={{ fontFamily: brandStyle.fontTitle }}
          >
            IA Marketing
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleGenerate}
            className="inline-flex h-11 items-center justify-center gap-2 border border-[#ECE7DD] bg-white px-5 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#111111]"
          >
            <RefreshCcw size={14} />
            Gerar com IA
          </button>

          <button
            type="button"
            onClick={handleSaveDraft}
            className="inline-flex h-11 items-center justify-center gap-2 border border-[#ECE7DD] bg-white px-5 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#111111]"
          >
            <Save size={14} />
            Salvar rascunho
          </button>

          <button
            type="button"
            onClick={handleLoadDraft}
            className="inline-flex h-11 items-center justify-center gap-2 border border-[#ECE7DD] bg-white px-5 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#111111]"
          >
            <FolderOpen size={14} />
            Carregar
          </button>

          <button
            type="button"
            onClick={handleExportPng}
            disabled={exporting}
            className="inline-flex h-11 items-center justify-center gap-2 bg-[#111111] px-5 text-[12px] font-semibold uppercase tracking-[0.14em] text-white disabled:opacity-60"
          >
            <Download size={14} />
            {exporting ? "Exportando..." : "Exportar PNG"}
          </button>
        </div>
      </div>

      {notice ? (
        <div className="mt-4 border border-[#ECE7DD] bg-white px-4 py-3 text-sm text-[#111111]">
          {notice}
        </div>
      ) : null}

      <div className="mt-8 grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)_360px]">
        <section className="space-y-5">
          <div className="border border-[#F0ECE4] bg-white p-5">
            <PanelTitle
              icon={<Wand2 size={16} />}
              title="Briefing da campanha"
              subtitle="Defina a peça e gere a base visual."
            />

            <div className="mt-5 space-y-4">
              <div>
                <FieldLabel>Formato</FieldLabel>
                <select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value as MarketingGoal)}
                  className="h-11 w-full border border-[#ECE7DD] px-3 text-sm outline-none"
                >
                  <option value="INSTAGRAM_POST">Post Instagram</option>
                  <option value="STORY">Story</option>
                </select>
              </div>

              <div>
                <FieldLabel>Template Harmonie</FieldLabel>
                <select
                  value={template}
                  onChange={(e) => setTemplate(e.target.value as CanvasTemplate)}
                  className="h-11 w-full border border-[#ECE7DD] px-3 text-sm outline-none"
                >
                  <option value="RESULTADO_DUO">Resultados lado a lado</option>
                  <option value="TEXTO_EDUCATIVO">Texto educativo</option>
                  <option value="ANTES_DEPOIS">Antes e depois</option>
                  <option value="PROMO_LUXO">Promo luxo</option>
                </select>
              </div>

              <div>
                <FieldLabel>Nome da clínica</FieldLabel>
                <input
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  className="h-11 w-full border border-[#ECE7DD] px-3 text-sm outline-none"
                />
              </div>

              <div>
                <FieldLabel>Procedimento</FieldLabel>
                <input
                  value={procedure}
                  onChange={(e) => setProcedure(e.target.value)}
                  className="h-11 w-full border border-[#ECE7DD] px-3 text-sm outline-none"
                />
              </div>

              <div>
                <FieldLabel>Público</FieldLabel>
                <input
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  className="h-11 w-full border border-[#ECE7DD] px-3 text-sm outline-none"
                />
              </div>

              <div>
                <FieldLabel>Benefício principal</FieldLabel>
                <input
                  value={benefit}
                  onChange={(e) => setBenefit(e.target.value)}
                  className="h-11 w-full border border-[#ECE7DD] px-3 text-sm outline-none"
                />
              </div>

              <div>
                <FieldLabel>Tom</FieldLabel>
                <input
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="h-11 w-full border border-[#ECE7DD] px-3 text-sm outline-none"
                />
              </div>

              <div>
                <FieldLabel>Oferta / Promo</FieldLabel>
                <input
                  value={promo}
                  onChange={(e) => setPromo(e.target.value)}
                  className="h-11 w-full border border-[#ECE7DD] px-3 text-sm outline-none"
                />
              </div>

              <div>
                <FieldLabel>Prompt criativo</FieldLabel>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[120px] w-full border border-[#ECE7DD] p-3 text-sm outline-none"
                />
              </div>

              <div>
                <FieldLabel>Paleta</FieldLabel>
                <div className="grid grid-cols-2 gap-3">
                  {(Object.keys(palettes) as PaletteKey[]).map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setPaletteKey(key)}
                      className={[
                        "border px-3 py-3 text-left",
                        paletteKey === key
                          ? "border-[#111111] bg-[#FCFAF6]"
                          : "border-[#ECE7DD] bg-white",
                      ].join(" ")}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="h-4 w-4 border"
                          style={{ background: palettes[key].accent }}
                        />
                        <span className="text-sm font-medium text-[#111111]">{key}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleGenerate}
                className="inline-flex h-11 w-full items-center justify-center gap-2 bg-[#111111] px-5 text-[12px] font-semibold uppercase tracking-[0.14em] text-white"
              >
                <Sparkles size={14} />
                Gerar copy e arte
              </button>
            </div>
          </div>

          <div className="border border-[#F0ECE4] bg-white p-5">
            <PanelTitle
              icon={<Upload size={16} />}
              title="Imagens da arte"
              subtitle="Suba as imagens da clínica."
            />

            <div className="mt-5 space-y-4">
              <div>
                <FieldLabel>Imagem principal</FieldLabel>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => readImageFile(e, "primary")}
                  className="block w-full text-sm"
                />
              </div>

              <div>
                <FieldLabel>Imagem secundária</FieldLabel>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => readImageFile(e, "secondary")}
                  className="block w-full text-sm"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setPrimaryImage(null)}
                  className="inline-flex h-10 flex-1 items-center justify-center gap-2 border border-[#ECE7DD] bg-white px-4 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#111111]"
                >
                  <Trash2 size={13} />
                  Limpar 1
                </button>

                <button
                  type="button"
                  onClick={() => setSecondaryImage(null)}
                  className="inline-flex h-10 flex-1 items-center justify-center gap-2 border border-[#ECE7DD] bg-white px-4 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#111111]"
                >
                  <Trash2 size={13} />
                  Limpar 2
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="border border-[#F0ECE4] bg-white p-5">
          <PanelTitle
            icon={<LayoutTemplate size={16} />}
            title="Canvas da arte"
            subtitle="Arraste textos e monte a peça."
          />

          <div className="mt-5 flex min-h-[760px] items-start justify-center overflow-auto rounded-none border border-[#ECE7DD] bg-[#F6F2EA] p-6">
            <div
              ref={previewRef}
              onMouseMove={handleMouseMove}
              onMouseUp={stopDragging}
              onMouseLeave={stopDragging}
              className="relative overflow-hidden border border-[#E4D9C7] shadow-[0_12px_40px_rgba(17,17,17,0.08)]"
              style={{
                width: size.width * previewScale,
                height: size.height * previewScale,
                background: paletteKey === "BLACK" ? "#111111" : "#F7F3EC",
              }}
            >
              {renderCanvasImages()}

              {template === "TEXTO_EDUCATIVO" ? (
                <div className="absolute inset-0 bg-black/30" />
              ) : null}

              <div
                className="absolute flex items-center gap-1 rounded border border-transparent bg-white/10 px-1 py-0.5 backdrop-blur-sm"
                style={{
                  left: `${positions.logo.x}%`,
                  top: `${positions.logo.y}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <button
                  type="button"
                  onMouseDown={() => setDragging("logo")}
                  className="cursor-move text-white/70"
                >
                  <GripVertical size={10} />
                </button>

                <div
                  className="cursor-text text-[8px]"
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => setClinicName(e.currentTarget.textContent || "")}
                  style={{
                    color: paletteKey === "BLACK" ? "#F5F1EA" : palette.accent,
                    letterSpacing: "0.35em",
                    textTransform: "uppercase",
                  }}
                >
                  {clinicName}
                </div>
              </div>

              <div
                className="absolute max-w-[84%] rounded border border-transparent bg-black/10 px-1 py-0.5 backdrop-blur-[1px]"
                style={{
                  left: `${positions.headline.x}%`,
                  top: `${positions.headline.y}%`,
                  transform:
                    template === "TEXTO_EDUCATIVO" ? "translate(-50%, -50%)" : "translate(0, -50%)",
                  textAlign: template === "TEXTO_EDUCATIVO" ? "center" : "left",
                }}
              >
                <div className="mb-1 flex items-center gap-1 text-white/70">
                  <button
                    type="button"
                    onMouseDown={() => setDragging("headline")}
                    className="cursor-move"
                  >
                    <GripVertical size={12} />
                  </button>
                </div>

                <div
                  className="cursor-text"
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => setHeadline(e.currentTarget.textContent || "")}
                  style={{
                    fontFamily: brandStyle.fontTitle,
                    color: paletteKey === "BLACK" ? "#F5F1EA" : palette.text,
                    fontSize: goal === "STORY" ? 24 : 28,
                    lineHeight: 1.05,
                    fontStyle: template === "RESULTADO_DUO" ? "italic" : "normal",
                  }}
                >
                  {headline}
                </div>
              </div>

              <div
                className="absolute max-w-[84%] rounded border border-transparent bg-black/10 px-1 py-0.5 backdrop-blur-[1px]"
                style={{
                  left: `${positions.subheadline.x}%`,
                  top: `${positions.subheadline.y}%`,
                  transform:
                    template === "TEXTO_EDUCATIVO" ? "translate(-50%, -50%)" : "translate(0, -50%)",
                  textAlign: template === "TEXTO_EDUCATIVO" ? "center" : "left",
                }}
              >
                <div className="mb-1 flex items-center gap-1 text-white/70">
                  <button
                    type="button"
                    onMouseDown={() => setDragging("subheadline")}
                    className="cursor-move"
                  >
                    <GripVertical size={12} />
                  </button>
                </div>

                <div
                  className="cursor-text"
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => setSubheadline(e.currentTarget.textContent || "")}
                  style={{
                    color: paletteKey === "BLACK" ? palette.muted : "#60759B",
                    fontSize: goal === "STORY" ? 10 : 12,
                    lineHeight: 1.45,
                    letterSpacing: template === "ANTES_DEPOIS" ? "0.18em" : "normal",
                    textTransform: template === "ANTES_DEPOIS" ? "uppercase" : "none",
                  }}
                >
                  {subheadline}
                </div>
              </div>

              <div
                className="absolute"
                style={{
                  left: `${positions.cta.x}%`,
                  top: `${positions.cta.y}%`,
                  transform:
                    template === "TEXTO_EDUCATIVO" ? "translate(-50%, -50%)" : "translate(0, -50%)",
                }}
              >
                <div className="mb-1 flex items-center gap-1 text-white/70">
                  <button
                    type="button"
                    onMouseDown={() => setDragging("cta")}
                    className="cursor-move rounded border border-transparent bg-white/10 p-0.5 backdrop-blur-sm"
                  >
                    <GripVertical size={12} />
                  </button>
                </div>

                <div
                  className="inline-flex min-h-[44px] min-w-[150px] cursor-text items-center justify-center px-4 text-center"
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => setCta(e.currentTarget.textContent || "")}
                  style={{
                    background:
                      template === "PROMO_LUXO" || template === "TEXTO_EDUCATIVO"
                        ? "rgba(255,255,255,0.08)"
                        : "transparent",
                    color: palette.accent,
                    border: `1px solid ${palette.accent}`,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                  }}
                >
                  {cta}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-5">
          <div className="border border-[#F0ECE4] bg-white p-5">
            <PanelTitle
              icon={<Type size={16} />}
              title="Copy gerada"
              subtitle="Edite os textos e padronize a peça."
            />

            <div className="mt-5 space-y-4">
              <div>
                <FieldLabel>Título</FieldLabel>
                <textarea
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  className="min-h-[90px] w-full border border-[#ECE7DD] p-3 text-sm outline-none"
                />
              </div>

              <div>
                <FieldLabel>Subtítulo</FieldLabel>
                <textarea
                  value={subheadline}
                  onChange={(e) => setSubheadline(e.target.value)}
                  className="min-h-[110px] w-full border border-[#ECE7DD] p-3 text-sm outline-none"
                />
              </div>

              <div>
                <FieldLabel>CTA</FieldLabel>
                <input
                  value={cta}
                  onChange={(e) => setCta(e.target.value)}
                  className="h-11 w-full border border-[#ECE7DD] px-3 text-sm outline-none"
                />
              </div>

              <div>
                <FieldLabel>Hashtags</FieldLabel>
                <textarea
                  value={hashtags}
                  onChange={(e) => setHashtags(e.target.value)}
                  className="min-h-[90px] w-full border border-[#ECE7DD] p-3 text-sm outline-none"
                />
              </div>
            </div>
          </div>

          <div className="border border-[#F0ECE4] bg-white p-5">
            <PanelTitle
              icon={<ImageIcon size={16} />}
              title="Direção visual"
              subtitle="Prompt base para futura geração com IA."
            />

            <div className="mt-5 rounded-none border border-[#ECE7DD] bg-[#FCFAF6] p-4">
              <p className="text-sm leading-6 text-[#111111]">{visualSuggestion}</p>
            </div>

            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={handleCopyPrompt}
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 border border-[#ECE7DD] bg-white px-4 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#111111]"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copiado" : "Copiar prompt"}
              </button>

              <button
                type="button"
                onClick={handleExportPng}
                disabled={exporting}
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 bg-[#111111] px-4 text-[12px] font-semibold uppercase tracking-[0.14em] text-white disabled:opacity-60"
              >
                <Download size={14} />
                PNG
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}