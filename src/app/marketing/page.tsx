"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import {
  Wand2, Download, Sparkles, LayoutTemplate, 
  Trash2, Maximize2, Share2, MousePointer2, 
  Upload, Type, ImageIcon, Palette, Focus
} from "lucide-react";
import { toPng } from "html-to-image";

// --- TIPOS ---
type MarketingGoal = "INSTAGRAM_POST" | "STORY";
type LayerType = "text" | "image" | "logo" | "cta";

interface Layer {
  id: string;
  type: LayerType;
  x: number; // Percentagem (0-100)
  y: number; // Percentagem (0-100)
  
  // Propriedades de Texto
  text?: string;
  fontSize?: number;
  italic?: boolean;

  // Propriedades de Imagem
  src?: string | null;
  scale?: number; // Percentagem (50-250)
}

export default function MarketingStudioPage() {
  const [goal, setGoal] = useState<MarketingGoal>("INSTAGRAM_POST");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");

  // ESTADO DE CAMADAS UNIFICADO (Totalmente Arrastável)
  const [layers, setLayers] = useState<Layer[]>([
    { id: "logo", type: "logo", x: 50, y: 12, text: "HARMONIE CLINIC", fontSize: 10 },
    { id: "headline", type: "text", x: 50, y: 45, text: "Beleza Estratégica", fontSize: 32, italic: true },
    { id: "subheadline", type: "text", x: 50, y: 55, text: "Realçando sua naturalidade.", fontSize: 13 },
    { id: "cta", type: "cta", x: 50, y: 85, text: "AGENDE SUA AVALIAÇÃO", fontSize: 9 },
    // Camadas de Imagem Livres (iniciam sem foto)
    { id: "img1", type: "image", x: 25, y: 50, scale: 100, src: null },
    { id: "img2", type: "image", x: 75, y: 50, scale: 100, src: null },
  ]);

  const artboardRef = useRef<HTMLDivElement>(null);

  // --- LÓGICA DE MOVIMENTAÇÃO (PERCENTAGEM PARA EXPORTAÇÃO) ---
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingId || !artboardRef.current) return;
    const rect = artboardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setLayers(prev => prev.map(layer => 
      layer.id === draggingId 
        ? { ...layer, x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) }
        : layer
    ));
  };

  const updateLayer = (id: string, data: Partial<Layer>) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, ...data } : l));
  };

  const handleExport = async () => {
    if (!artboardRef.current) return;
    setSelectedId(null); // Remove seleção para exportar limpo
    try {
      const dataUrl = await toPng(artboardRef.current, { pixelRatio: 3, cacheBust: true });
      const link = document.createElement("a");
      link.download = `harmonie-marketing-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) { console.error(err); }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      updateLayer(id, { src: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  // Memo para pegar o elemento selecionado para o painel de propriedades
  const selectedLayer = useMemo(() => {
    return layers.find(l => l.id === selectedId) || null;
  }, [layers, selectedId]);

  return (
    <div className="flex h-screen bg-[#F0F0F0] overflow-hidden font-sans antialiased text-[#1A1A1A]"
         onMouseMove={handleMouseMove}
         onMouseUp={() => setDraggingId(null)}>
      
      {/* 1. SIDEBAR DE CONTROLE (HARMONIE STYLE) */}
      <aside className="w-[360px] bg-white border-r border-[#EEECE7] flex flex-col z-20 shadow-xl">
        <div className="p-8 border-b border-[#FAF8F3]">
          <p className="text-[10px] font-bold tracking-[0.4em] text-[#C5A059] uppercase italic">Creative Studio</p>
          <h1 className="text-3xl font-serif mt-1italic">Marketing IA</h1>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-10 scrollbar-thin">
          {/* Gerador de Imagem */}
          <section>
            <HeaderField icon={<Sparkles size={14} className="text-[#C5A059]" />} label="AI Visual Engine" />
            <textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Descreva a estética da imagem... (Ex: Luxo minimalista, luz dourada, tons pastéis)"
              className="w-full p-4 bg-[#FAF8F3] border border-[#E9DEC9] text-[12px] outline-none min-h-[110px] focus:border-[#C5A059] transition-colors resize-none italic"
            />
            <button className="w-full mt-4 bg-[#1A1A1A] text-white py-4 text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-[#C5A059] transition-all flex items-center justify-center gap-2 group shadow-md">
              <Wand2 size={14} className="group-hover:animate-pulse" /> Gerar Arte com IA
            </button>
          </section>

          {/* Configuração de Tela */}
          <section className="space-y-4">
            <HeaderField icon={<LayoutTemplate size={14} />} label="Proporção da Arte" />
            <div className="grid grid-cols-2 gap-3">
              <FormatBtn active={goal === 'INSTAGRAM_POST'} label="FEED (1:1)" onClick={() => setGoal("INSTAGRAM_POST")} />
              <FormatBtn active={goal === 'STORY'} label="STORY (9:16)" onClick={() => setGoal("STORY")} />
            </div>
          </section>

          {/* PROPRIEDADES CONTEXTUAIS (SÓ APARECE SE ALGO FOR SELECIONADO) */}
          {selectedLayer && (
             <section className="pt-8 border-t border-[#FAF8F3] space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                <HeaderField icon={<Palette size={14} />} label="Propriedades do Elemento" />
                
                {selectedLayer.type === 'image' && (
                  <div className="space-y-4">
                     <div className="space-y-2">
                        <label className="text-[9px] font-bold uppercase text-gray-400">Escala da Foto</label>
                        <div className="flex items-center gap-4">
                           <input type="range" min="50" max="250" value={selectedLayer.scale} onChange={(e) => updateLayer(selectedLayer.id, { scale: Number(e.target.value) })} className="w-full accent-[#C5A059] h-1" />
                           <span className="text-xs font-mono text-[#C5A059]">{selectedLayer.scale}%</span>
                        </div>
                     </div>
                     <button onClick={() => updateLayer(selectedLayer.id, { src: null })} className="w-full flex items-center justify-center gap-2 py-3 border border-red-200 text-red-500 text-[9px] font-bold uppercase tracking-widest hover:bg-red-50 rounded-sm">
                        <Trash2 size={14}/> Remover Mídia
                     </button>
                  </div>
                )}

                {selectedLayer.text !== undefined && (
                   <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase text-gray-400">Conteúdo do Texto</label>
                      <input type="text" value={selectedLayer.text} onChange={(e) => updateLayer(selectedLayer.id, { text: e.target.value })} className="w-full border-b border-[#EEE] py-2 text-sm outline-none focus:border-[#C5A059]" />
                   </div>
                )}
             </section>
          )}
        </div>

        <div className="p-8 border-t border-[#FAF8F3]">
          <button onClick={handleExport} className="w-full bg-[#C5A059] text-white py-4 text-[11px] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:brightness-110 transition-all shadow-lg">
            <Download size={15} /> Exportar Ficha de Marketing
          </button>
        </div>
      </aside>

      {/* ÁREA CENTRAL: WORKSPACE (MESA DE LUZ SOFISTICADA) */}
      <main className="flex-1 relative flex flex-col items-center justify-center p-12 bg-[#EAEAEA] bg-[radial-gradient(#C5A059_0.5px,transparent_0.5px)] [background-size:24px_24px] [background-opacity:0.05]"
            onClick={() => setSelectedId(null)}>
        
        {/* ARTBOARD (O CANVAS) */}
        <div 
          ref={artboardRef}
          className="relative bg-black shadow-[0_40px_100px_rgba(0,0,0,0.2)] overflow-hidden transition-all duration-500 ease-in-out border border-white/5"
          style={{
            width: goal === "STORY" ? "360px" : "480px",
            height: goal === "STORY" ? "640px" : "480px",
          }}
        >
          {/* GRADIENTE DE LUXO (DE FUNDO) */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50 pointer-events-none z-10" />

          {/* RENDERIZANDO CAMADAS */}
          {layers.map((layer) => {
            const isSelected = selectedId === layer.id;
            
            // --- RENDER IMAGEM ---
            if (layer.type === 'image') {
              return (
                <div key={layer.id}
                     className={`absolute cursor-move overflow-hidden transition-all duration-300 flex items-center justify-center ${isSelected ? 'ring-2 ring-[#C5A059] z-20 shadow-2xl' : 'hover:ring-1 hover:ring-white/10 z-0'}`}
                     style={{ 
                       left: `${layer.x}%`, top: `${layer.y}%`, 
                       transform: 'translate(-50%, -50%)',
                       width: '45%', height: '80%' // Tamanho base livre
                     }}
                     onMouseDown={(e) => { e.stopPropagation(); setDraggingId(layer.id); setSelectedId(layer.id); }}>
                  
                  {layer.src ? (
                    <img src={layer.src} className="w-full h-full object-cover origin-center transition-transform" style={{ transform: `scale(${layer.scale / 100})` }} />
                  ) : (
                    <label className="flex flex-col items-center justify-center h-full w-full cursor-pointer hover:bg-white/5 transition-colors border-2 border-dashed border-white/10 text-center p-4">
                      <Upload size={18} className="text-white/10 mb-2" />
                      <span className="text-[7px] text-white/20 font-bold uppercase tracking-widest leading-relaxed">Add Media</span>
                      <input type="file" className="hidden" onChange={(e) => handleImageUpload(e, layer.id)} />
                    </label>
                  )}
                  {isSelected && <SelectionHandles />}
                </div>
              );
            }

            // --- RENDER TEXTO ---
            return (
              <div key={layer.id}
                   className={`absolute cursor-move select-none p-3 group transition-all duration-300 ${isSelected ? 'ring-1 ring-[#C5A059] bg-black/20' : 'hover:ring-1 hover:ring-white/10'}`}
                   style={{ 
                     left: `${layer.x}%`, top: `${layer.y}%`, 
                     transform: 'translate(-50%, -50%)',
                     zIndex: 30, textAlign: 'center'
                   }}
                   onMouseDown={(e) => { e.stopPropagation(); setDraggingId(layer.id); setSelectedId(layer.id); }}>
                
                {isSelected && <SelectionHandles />}
                
                <div 
                  contentEditable suppressContentEditableWarning
                  onInput={(e) => updateLayer(layer.id, { text: e.currentTarget.textContent || "" })}
                  className="outline-none whitespace-nowrap"
                  style={{
                    fontFamily: layer.italic ? 'Georgia, serif' : 'sans-serif',
                    fontSize: `${layer.fontSize}px`,
                    color: layer.type === 'cta' ? '#C5A059' : 'white',
                    fontWeight: layer.type === 'logo' || layer.type === 'cta' ? '600' : 'normal',
                    letterSpacing: layer.type === 'logo' || layer.type === 'cta' ? '0.4em' : 'normal',
                    textTransform: layer.type === 'logo' || layer.type === 'cta' ? 'uppercase' : 'none',
                    fontStyle: layer.italic ? 'italic' : 'normal',
                    border: layer.type === 'cta' ? '1px solid #C5A059' : 'none',
                    padding: layer.type === 'cta' ? '10px 20px' : '0',
                  }}
                >
                  {layer.text}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* INSTRUÇÃO PREMIUM */}
        <div className="mt-12 flex items-center gap-3 text-[10px] text-[#96A4C1] uppercase tracking-[0.3em] font-bold opacity-70">
           <MousePointer2 size={12} /> Clique nos elementos para editar • Arraste para compor
        </div>
      </main>
    </div>
  );
}

// --- SUB-COMPONENTES AUXILIARES ---

function HeaderField({ icon, label }: any) {
  return (
    <div className="flex items-center gap-2 mb-4 text-[#96A4C1]">
      {icon}
      <h3 className="text-[10px] font-bold uppercase tracking-[0.2em]">{label}</h3>
    </div>
  );
}

function FormatBtn({ active, label, onClick }: any) {
  return (
    <button onClick={onClick} className={`py-3 text-[10px] font-black uppercase tracking-widest border transition-all rounded-sm ${active ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]' : 'bg-white text-[#96A4C1] border-[#EEE] hover:border-[#C5A059]'}`}>
      {label}
    </button>
  );
}

function SelectionHandles() {
  const handleStyle = "absolute w-2 h-2 bg-[#C5A059] z-30";
  return (
    <>
      <div className={`${handleStyle} -top-1 -left-1`} />
      <div className={`${handleStyle} -top-1 -right-1`} />
      <div className={`${handleStyle} -bottom-1 -left-1`} />
      <div className={`${handleStyle} -bottom-1 -right-1`} />
    </>
  );
}