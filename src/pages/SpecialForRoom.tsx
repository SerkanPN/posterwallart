import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Lock, Loader2, Download, Sparkles, Image as ImageIcon, Info, History, RotateCcw, ChevronRight } from 'lucide-react';
import { useStore } from '../store/useStore';
import { InteractiveCanvas } from '../components/InteractiveCanvas';
import { AuthModal } from '../components/AuthModal';

type FrameType = 'unframed' | 'black' | 'oak';

interface Product {
  id: string; 
  title: string; 
  basePrice: number; 
  image: string; 
  category: string; 
  description: string; 
  isGenerated?: boolean; 
  slug?: string; 
  thumbnail?: string; 
  cost?: number;
}

const PRESET_ROOMS = [
  { url: 'https://images.unsplash.com/photo-1616489953149-755e156cc09a?q=80&w=2070', ppi: 8, rotateY: 0, skewY: 0, style: 'Modern', theme: 'Minimalist' },
  { url: 'https://images.unsplash.com/photo-1615876234886-fd9a39faa97f?q=80&w=1932', ppi: 7, rotateY: 2, skewY: 0, style: 'Scandinavian', theme: 'Nature' },
  { url: 'https://images.unsplash.com/photo-1616137422495-1e9e46e2aa77?q=80&w=1932', ppi: 9, rotateY: -1, skewY: 0, style: 'Industrial', theme: 'Architecture' },
  { url: 'https://images.unsplash.com/photo-1634713590161-19305662114e?q=80&w=2070', ppi: 8, rotateY: 0, skewY: 0, style: 'Boho Chic', theme: 'Botanical' },
  { url: 'https://images.unsplash.com/photo-1617103996702-96ff29b1c467?q=80&w=2032', ppi: 6, rotateY: 3, skewY: 0, style: 'Art Deco', theme: 'Abstract' }
];

const FIXED_MODEL = { 
  id: 'runware:101@1', 
  params: { steps: 28, CFGScale: 1, scheduler: "FlowMatchEuler" }, 
  supportsLora: true 
};

const FIXED_LORA = { model: "civitai:126208@137927", weight: 0.8 };

const SIZES = [
  { label: '8x10"',  price: 22, value: '8x10'  },
  { label: '11x14"', price: 24, value: '11x14' },
  { label: '16x20"', price: 26, value: '16x20' },
  { label: '18x24"', price: 26, value: '18x24' },
  { label: '20x30"', price: 39, value: '20x30' },
  { label: '24x36"', price: 49, value: '24x36' },
];

const STYLES = ['Default', 'Minimalist', 'Bauhaus', 'Cyberpunk', 'Renaissance', 'Mid-Century Modern', 'Japandi', 'Industrial', 'Boho Chic', 'Art Deco', 'Nordic', 'Line Art', 'Watercolor'];
const THEMES = ['Default', 'Nature', 'Music', 'Movie', 'Abstract', 'Cityscape', 'Space', 'Botanical', 'Architecture'];
const FRAME_COLORS = { 'unframed': null, 'black': '#18181b', 'oak': '#8b5a2b' };

const getGCD = (a: number, b: number): number => (b === 0 ? a : getGCD(b, a % b));
const calculateAspectRatio = (sizeValue: string, orientation: 'portrait' | 'landscape') => {
  const [w, h] = sizeValue.split('x').map(Number);
  const common = getGCD(w, h);
  return orientation === 'portrait' ? `${w / common}:${h / common}` : `${h / common}:${w / common}`;
};

const getRunwareDims = (sizeStr: string, orientation: 'portrait' | 'landscape') => {
  const [w, h] = sizeStr.split('x').map(Number);
  const rw = orientation === 'portrait' ? w : h;
  const rh = orientation === 'portrait' ? h : w;
  const MAX = 1024;
  const snap = (v: number) => Math.floor(v / 64) * 64;
  if (rw >= rh) return { w: MAX, h: snap((rh / rw) * MAX) };
  return { w: snap((rw / rh) * MAX), h: MAX };
};

const base64ToUint8Array = (base64Data: string) => {
  const parts = base64Data.split(';base64,');
  const binaryString = atob(parts[1]);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
};

const createThumbnail = (base64: string, maxWidth = 400): Promise<string> => {
  return new Promise((resolve) => {
    console.log("[LOG] Thumbnail generator process started");
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      if (width > maxWidth) { height = Math.round((height * maxWidth) / width); width = maxWidth; }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) { ctx.drawImage(img, 0, 0, width, height); resolve(canvas.toDataURL('image/jpeg', 0.8)); }
      else resolve(base64);
      img.src = '';
    };
    img.src = base64;
  });
};

export function SpecialForRoom() {
  const { user, tokens, addToCart, setAuthModalOpen, useToken, accessToken } = useStore();
  
  const [roomImage, setRoomImage] = useState<string | null>(null);
  const [refImage, setRefImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUpscalingId, setIsUpscalingId] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState(SIZES[3]);
  const [selectedStyle, setSelectedStyle] = useState('Default');
  const [selectedTheme, setSelectedTheme] = useState('Default');
  const [includeText, setIncludeText] = useState(false);
  const [selectedFrame, setSelectedFrame] = useState<FrameType>('black');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [analysisData, setAnalysisData] = useState<any>(null);

  // DECLARE isInterfaceLocked to avoid ReferenceError
  const isInterfaceLocked = !analysisData || isAnalyzing;

  // Initialize with random room preset if no image exists
  useEffect(() => {
    if (!roomImage) {
      console.log("[LOG] No room image found, picking a studio preset...");
      const randomRoom = PRESET_ROOMS[Math.floor(Math.random() * PRESET_ROOMS.length)];
      setRoomImage(randomRoom.url);
      setAnalysisData({
        ppi: randomRoom.ppi,
        rotateY: randomRoom.rotateY,
        skewY: randomRoom.skewY,
        suggestedStyle: randomRoom.style,
        suggestedTheme: randomRoom.theme
      });
    }
  }, []);

  const onDropRoom = useCallback((acceptedFiles: File[]) => {
    console.log("[LOG] New room upload detected");
    if (!user) { setAuthModalOpen(true); return; }
    const file = acceptedFiles[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setRoomImage(base64);
      analyzeRoom(base64);
    };
    reader.readAsDataURL(file);
  }, [user, setAuthModalOpen]);

  const onDropRef = useCallback((acceptedFiles: File[]) => {
    console.log("[LOG] Style reference anchor provided");
    const file = acceptedFiles[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => setRefImage(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const roomDrop = useDropzone({ onDrop: onDropRoom, accept: { 'image/*': [] }, maxFiles: 1 });
  const refDrop = useDropzone({ onDrop: onDropRef, accept: { 'image/*': [] }, maxFiles: 1 });

  const analyzeRoom = async (base64Image: string) => {
    console.log("[LOG] Running architectural space analysis...");
    setIsAnalyzing(true);
    setAnalysisData(null);
    try {
      const response = await fetch(`/api/gemini`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: 'gemini-flash-latest:generateContent',
          payload: {
            contents: [{ parts: [
              { text: 'Analyze this room. Map wall scale and 3D perspective. Suggest a matching style and theme for wall art. Return ONLY JSON: { "ppi": number, "rotateY": number, "skewY": number, "detectedStyle": "string", "suggestedStyle": "string", "suggestedTheme": "string" }' },
              { inlineData: { mimeType: "image/jpeg", data: base64Image.split(',')[1] } }
            ]}]
          }
        })
      });
      if (!response.ok) throw new Error("Backend connection failed");
      const res = await response.json();
      const rawText = res.candidates[0].content.parts[0].text;
      const data = JSON.parse(rawText.replace(/```json/g, '').replace(/```/g, '').trim());
      setAnalysisData(data);
      console.log("[LOG] Environmental metadata received successfully:", data);
    } catch (e) {
      console.error("[ERROR] Analysis crash, using fallback mapping:", e);
      setAnalysisData({ ppi: 7, rotateY: 0, skewY: 0, suggestedStyle: 'Modern', suggestedTheme: 'Abstract' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCreateForMe = async () => {
    console.log("[LOG] Production cycle started");
    if (!user || tokens <= 0 || isGenerating || !accessToken || !analysisData) {
      if (!user) setAuthModalOpen(true);
      return;
    }

    setIsGenerating(true);
    try {
      const dynamicAR = calculateAspectRatio(selectedSize.value, orientation);
      
      // Select appropriate style/theme based on user selection or auto-pilot
      let finalStyle = selectedStyle === 'Default' ? analysisData.suggestedStyle : selectedStyle;
      let finalTheme = selectedTheme === 'Default' ? analysisData.suggestedTheme : selectedTheme;

      // Force style logic if reference anchor is present
      if (refImage) {
        finalStyle = "captured from provided visual anchor";
        finalTheme = "coherent with visual palette of reference";
      }

      const coreInstruction = `You are a world-class master artist and elite visual designer specializing in premium wall art. CORE OBJECTIVE: Create a visually stunning, ultra-detailed, high-end wall art composition that fully utilizes the canvas with ZERO empty borders. STYLE: ${finalStyle}, THEME: ${finalTheme}, ORIENTATION: ${orientation}, ASPECT RATIO: ${dynamicAR}. TEXT: ${includeText ? 'Include minimal typography.' : 'NO text.'} RESOLUTION: 1024px.`;
      
      let finalBase64 = "";
      let taskCost = 0;

      console.log("[LOG] Stage 1: Requesting Gemini Art Engine...");
      try {
        const geminiRes = await fetch(`/api/gemini`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            endpoint: 'gemini-3.1-flash-image-preview:generateContent',
            payload: { 
              contents: [{ 
                parts: [
                  { text: refImage ? `${coreInstruction} Replicate the strokes and essence of the reference image without direct content cloning.` : coreInstruction },
                  ...(refImage ? [{ inlineData: { mimeType: "image/jpeg", data: refImage.split(',')[1] } }] : [])
                ] 
              }] 
            }
          })
        });
        if (!geminiRes.ok) throw new Error("Engine offline");
        const gData = await geminiRes.json();
        const b64 = gData.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData?.data;
        if (!b64) throw new Error("Empty response stream");
        finalBase64 = `data:image/png;base64,${b64}`;
        console.log("[LOG] Gemini engine successfully deployed");
      } catch (geminiErr) {
        console.warn("[LOG] Gemini fail. Triggering Fallback: Runware FLUX...");
        const dims = getRunwareDims(selectedSize.value, orientation);
        const task: any = {
          taskType: "imageInference",
          taskUUID: crypto.randomUUID(),
          model: FIXED_MODEL.id,
          positivePrompt: coreInstruction,
          width: dims.w, height: dims.h,
          numberResults: 1, outputType: "dataURI", outputFormat: "PNG",
          ...FIXED_MODEL.params,
          lora: [FIXED_LORA]
        };

        const rwRes = await fetch(`/api/runware`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify([task])
        });
        const rwData = await rwRes.json();
        if (rwData?.errors) throw new Error(rwData.errors[0].message);
        finalBase64 = rwData.data?.[0]?.imageURL;
        taskCost = rwData.data?.[0]?.cost || 0;
        console.log("[LOG] Runware engine success. Operation Cost:", taskCost);
      }

      if (!finalBase64) throw new Error("All image clusters failed to respond");

      const thumbBase64 = await createThumbnail(finalBase64);
      
      console.log("[LOG] Processing SEO metadata packet...");
      let aiMeta = { seo_title: `${finalStyle} Exclusive Art`, seo_description: "Unique masterpiece.", alt_text: "AI Art", tags: [] };
      try {
        const seoRes = await fetch(`/api/gemini`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            endpoint: 'gemini-flash-latest:generateContent',
            payload: { contents: [{ parts: [{ text: `Generate JSON SEO for ${finalStyle} poster. ONLY JSON response.` }] }] }
          })
        });
        const seoData = await seoRes.json();
        const rawJson = seoData.candidates[0].content.parts[0].text.replace(/```json/g, '').replace(/```/g, '').trim();
        aiMeta = JSON.parse(rawJson);
      } catch (e) { console.error("[LOG] SEO packet skipped"); }

      const tokenUsed = useToken();
      if (!tokenUsed) throw new Error("Token logic failure");

      console.log("[LOG] Uploading asset to marketplace server...");
      const formData = new FormData();
      formData.append('action', 'generate_and_save');
      formData.append('category', finalStyle);
      formData.append('price', selectedSize.price.toString());
      formData.append('metadata', JSON.stringify(aiMeta));
      formData.append('mainImage', new Blob([base64ToUint8Array(finalBase64)], { type: 'image/png' }), 'main.png');
      formData.append('thumbnail', new Blob([base64ToUint8Array(thumbBase64)], { type: 'image/jpeg' }), 'thumb.jpg');

      const uploadRes = await fetch('https://api.posterwallart.shop/api.php', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` },
        body: formData,
      });

      const result = await uploadRes.json();
      if (result.success) {
        const finalP = { ...result.product, cost: taskCost };
        setRecommendations(p => [finalP, ...p.slice(0, 3)]);
        setSelectedProduct(finalP);
        console.log("[LOG] Special production sequence complete.");
      } else {
        throw new Error(result.error);
      }
    } catch (e: any) {
      console.error("[ERROR] Process halted:", e);
      alert(e.message || "Genesis execution error");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpscaleAndDownload = async (product: Product) => {
    console.log("[LOG] Requesting 2x HD Upscale for asset:", product.id);
    setIsUpscalingId(product.id);
    try {
      const response = await fetch('/api/upscale', {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: product.image })
      });
      const data = await response.json();
      if (!data.upscaledUrl) throw new Error("Upscale API rejected");
      
      console.log(`[LOG] High-Res success. Cost tracked. Commencing transfer...`);
      const link = document.createElement('a');
      link.href = data.upscaledUrl;
      link.download = `${product.title}.png`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error("[ERROR] HD Upscale rejected");
    } finally {
      setIsUpscalingId(null);
    }
  };

  const resetRoom = () => {
    const randomRoom = PRESET_ROOMS[Math.floor(Math.random() * PRESET_ROOMS.length)];
    setRoomImage(randomRoom.url);
    setAnalysisData({ 
      ppi: randomRoom.ppi, 
      rotateY: randomRoom.rotateY, 
      skewY: randomRoom.skewY, 
      suggestedStyle: randomRoom.style, 
      suggestedTheme: randomRoom.theme 
    });
    console.log("[LOG] Environment reset to random studio preset");
  };

  const [pw, ph] = selectedSize.value.split('x').map(Number);
  const physicalWidth = orientation === 'portrait' ? pw : ph;
  const physicalHeight = orientation === 'portrait' ? ph : pw;

  if (!analysisData) return (
    <div className="h-screen bg-zinc-950 flex items-center justify-center">
      <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-zinc-950 text-zinc-50 overflow-hidden font-sans">
      <AuthModal />

      {/* LEFT: CONTROLS (SOL PANEL) */}
      <div className={`w-[360px] border-r border-zinc-800 bg-zinc-950 flex flex-col h-full overflow-y-auto transition-all ${isInterfaceLocked ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
        <div className="p-8 space-y-8 pb-24">
          <div>
            <h1 className="text-xl font-black italic tracking-tighter text-emerald-500 uppercase">Special For Room</h1>
            <p className="text-[9px] text-zinc-500 font-bold tracking-widest mt-1 uppercase">AI Architectural Studio</p>
          </div>

          <div className="space-y-2">
            <button
              onClick={handleCreateForMe}
              disabled={isGenerating || !analysisData}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase rounded-xl transition-all shadow-[0_0_30px_rgba(16,185,129,0.15)] disabled:opacity-20"
            >
              {isGenerating ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'MAKE ME FEEL SPECIAL'}
            </button>
            {user && (
              <p className="text-center text-[10px] text-zinc-600 font-mono uppercase tracking-tighter">
                Credits: <span className={tokens > 0 ? "text-emerald-500" : "text-red-500"}>{tokens}</span>
              </p>
            )}
          </div>

          <div className="space-y-6">
            <div className="space-y-4">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 flex items-center justify-between">
                Style & Tone
                {!!refImage && <Sparkles className="w-3 h-3 text-emerald-500" />}
              </label>
              <div className="grid grid-cols-1 gap-2">
                <select 
                  value={selectedTheme} 
                  disabled={!!refImage}
                  onChange={(e) => setSelectedTheme(e.target.value)} 
                  className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl text-xs outline-none focus:border-emerald-500 disabled:opacity-20 transition-all"
                >
                  {THEMES.map(t => <option key={t} value={t}>{t === 'Default' && analysisData ? `Studio Suggestion (${analysisData.suggestedTheme})` : t}</option>)}
                </select>
                <select 
                  value={selectedStyle} 
                  disabled={!!refImage}
                  onChange={(e) => setSelectedStyle(e.target.value)} 
                  className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl text-xs outline-none focus:border-emerald-500 disabled:opacity-20 transition-all"
                >
                  {STYLES.map(s => <option key={s} value={s}>{s === 'Default' && analysisData ? `Studio Suggestion (${analysisData.suggestedStyle})` : s}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Dimensions</label>
              <div className="grid grid-cols-2 gap-2">
                {SIZES.map(s => (
                  <button key={s.value} onClick={() => setSelectedSize(s)} className={`p-3 rounded-xl border text-[10px] font-bold transition-all ${selectedSize.value === s.value ? 'bg-zinc-100 text-zinc-900 border-zinc-100' : 'bg-zinc-900 text-zinc-400 border-zinc-800'}`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Direction</label>
                <div className="flex gap-2">
                  {(['portrait', 'landscape'] as const).map(o => (
                    <button key={o} onClick={() => setOrientation(o)} className={`flex-1 py-3 text-[10px] font-bold rounded-xl border capitalize ${orientation === o ? 'bg-zinc-800 text-white border-zinc-700' : 'bg-zinc-950 text-zinc-500 border-zinc-800'}`}>{o}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Frame</label>
                <div className="flex gap-2">
                  {(['unframed', 'black', 'oak'] as FrameType[]).map(f => (
                    <button key={f} onClick={() => setSelectedFrame(f)} className={`flex-1 py-3 rounded-xl border flex items-center justify-center ${selectedFrame === f ? 'bg-zinc-800 border-zinc-600' : 'bg-zinc-950 border-zinc-800'}`}>
                      <div className="w-3 h-3 rounded-full border border-zinc-700" style={{ backgroundColor: FRAME_COLORS[f] || '#fff' }}></div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-zinc-900 rounded-2xl border border-zinc-800">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Typography?</span>
              <button onClick={() => setIncludeText(!includeText)} className={`w-8 h-4 rounded-full transition-all ${includeText ? 'bg-emerald-600' : 'bg-zinc-700'} relative`}>
                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${includeText ? 'right-0.5' : 'left-0.5'}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CENTER: VIEWPORT (ORTA ALAN) */}
      <div className="flex-1 p-8 flex flex-col gap-8 relative overflow-hidden">
        <div className="flex gap-6 h-40">
          <div {...roomDrop.getRootProps()} className="flex-1 border-2 border-dashed border-zinc-800 rounded-[32px] flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-900/50 transition-all group relative overflow-hidden">
            <input {...roomDrop.getInputProps()} />
            {roomImage ? <img src={roomImage} className="absolute inset-0 w-full h-full object-cover opacity-25" alt="Room" /> : null}
            <div className="relative z-10 flex flex-col items-center">
              <Upload className="w-6 h-6 text-zinc-600 mb-2 group-hover:text-emerald-500 transition-colors" />
              <p className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-500">1. Update Room</p>
            </div>
            <button onClick={(e) => { e.stopPropagation(); resetRoom(); }} className="absolute bottom-4 right-4 z-20 p-2 bg-zinc-950/50 rounded-lg hover:bg-zinc-900 shadow-xl">
              <RotateCcw className="w-3 h-3 text-zinc-400" />
            </button>
          </div>

          <div {...refDrop.getRootProps()} className="flex-1 border-2 border-dashed border-zinc-800 rounded-[32px] flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-900/50 transition-all group relative overflow-hidden">
            <input {...refDrop.getInputProps()} />
            {refImage ? <img src={refImage} className="absolute inset-0 w-full h-full object-cover opacity-25" alt="Ref" /> : null}
            <div className="relative z-10 flex flex-col items-center">
              <ImageIcon className="w-6 h-6 text-zinc-600 mb-2 group-hover:text-emerald-500 transition-colors" />
              <p className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-500">2. Style Anchor</p>
            </div>
            {refImage && <button onClick={(e) => { e.stopPropagation(); setRefImage(null); }} className="absolute bottom-4 right-4 z-20 px-3 py-1 bg-zinc-900/80 rounded-lg text-[8px] font-black uppercase text-zinc-400">Clear</button>}
          </div>
        </div>

        <div className="flex-1 relative rounded-[48px] overflow-hidden bg-zinc-900 border border-zinc-800 shadow-[0_0_120px_rgba(0,0,0,0.6)]">
          {isAnalyzing ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-zinc-950/95 z-30 backdrop-blur-xl">
              <Loader2 className="w-12 h-12 text-emerald-500 animate-spin shadow-[0_0_30px_rgba(16,185,129,0.3)]" />
              <p className="font-black text-[9px] uppercase tracking-[0.4em] text-emerald-500 animate-pulse">Syncing Space...</p>
            </div>
          ) : (
            <InteractiveCanvas
              backgroundImage={roomImage || ""}
              mountedArt={selectedProduct?.thumbnail || selectedProduct?.image || null}
              physicalWidth={physicalWidth}
              physicalHeight={physicalHeight}
              naturalPixelsPerInch={analysisData?.ppi || 6}
              frameColor={(FRAME_COLORS as any)[selectedFrame]}
              perspective={{ rotateY: analysisData?.rotateY || 0, skewY: analysisData?.skewY || 0 }}
            />
          )}
        </div>
      </div>

      {/* RIGHT: HISTORY (SAĞ PANEL) */}
      <div className="w-[300px] border-l border-zinc-800 bg-zinc-950 flex flex-col h-full overflow-y-auto">
        <div className="p-6 space-y-6">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
            <History className="w-3 h-3 text-emerald-500" /> Genesis Log
          </h3>
          <div className="space-y-4">
            {recommendations.length === 0 && (
              <div className="p-8 border border-zinc-900 rounded-3xl text-center">
                <p className="text-[9px] text-zinc-700 font-bold uppercase tracking-widest leading-loose">No creations yet</p>
              </div>
            )}
            {recommendations.map((p) => (
              <div key={p.id} className={`p-4 border rounded-3xl cursor-pointer transition-all ${selectedProduct?.id === p.id ? 'border-emerald-500 bg-zinc-900 shadow-2xl' : 'border-zinc-800 hover:bg-zinc-900/50'}`} onClick={() => setSelectedProduct(p)}>
                <img src={p.thumbnail || p.image} className="aspect-square w-full rounded-2xl object-cover mb-4 border border-zinc-800" alt={p.title} />
                <h4 className="text-[10px] font-black truncate uppercase italic text-zinc-300 mb-4">{p.title}</h4>
                <div className="flex flex-col gap-2">
                  <button onClick={(e) => { e.stopPropagation(); addToCart({ ...p, price: p.basePrice, type: 'physical' }); }} className="text-left text-[9px] text-emerald-500 font-black uppercase tracking-widest hover:text-emerald-400 transition-colors">🛒 Add to bag</button>
                  <button onClick={(e) => { e.stopPropagation(); handleUpscaleAndDownload(p); }} disabled={isUpscalingId === p.id} className="text-left text-[9px] text-zinc-400 hover:text-white font-black uppercase tracking-widest flex items-center gap-2 transition-colors">
                    {isUpscalingId === p.id ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Download className="w-2.5 h-2.5" />}
                    {isUpscalingId === p.id ? 'Refining...' : 'HD Export'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
