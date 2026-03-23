import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Lock, Loader2, Download, Sparkles, Image as ImageIcon, Info } from 'lucide-react';
import { useStore } from '../store/useStore';
import { InteractiveCanvas } from '../components/InteractiveCanvas';
import { AuthModal } from '../components/AuthModal';

type FrameType = 'unframed' | 'black' | 'oak';

interface Product {
  id: string; title: string; basePrice: number; image: string; category: string; description: string; isGenerated?: boolean; slug?: string; thumbnail?: string; cost?: number;
}

const FIXED_MODEL = { id: 'runware:101@1', params: { steps: 28, CFGScale: 1 }, supportsLora: true };
const FIXED_LORA = { model: "civitai:126208@137927", weight: 0.8 };

const SIZES = [
  { label: '8x10"',  price: 22, value: '8x10'  },
  { label: '11x14"', price: 24, value: '11x14' },
  { label: '16x20"', price: 26, value: '16x20' },
  { label: '18x24"', price: 26, value: '18x24' },
  { label: '20x30"', price: 39, value: '20x30' },
  { label: '24x36"', price: 49, value: '24x36' },
];

const STYLES = ['Minimalist', 'Bauhaus', 'Cyberpunk', 'Renaissance', 'Mid-Century Modern', 'Japandi', 'Industrial', 'Boho Chic', 'Art Deco', 'Nordic', 'Line Art', 'Watercolor'];
const THEMES = ['Nature', 'Music', 'Movie', 'Abstract', 'Cityscape', 'Space', 'Botanical', 'Architecture'];
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
    console.log("[LOG] Internal thumbnail process started");
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
  const [selectedStyle, setSelectedStyle] = useState('Minimalist');
  const [selectedTheme, setSelectedTheme] = useState('Abstract');
  const [includeText, setIncludeText] = useState(false);
  const [selectedFrame, setSelectedFrame] = useState<FrameType>('black');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [analysisData, setAnalysisData] = useState<any>(null);

  const isInterfaceLocked = !analysisData || isAnalyzing;

  const onDropRoom = useCallback((acceptedFiles: File[]) => {
    console.log("[LOG] New room detected");
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
    console.log("[LOG] New reference detected");
    const file = acceptedFiles[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => setRefImage(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const roomDrop = useDropzone({ onDrop: onDropRoom, accept: { 'image/*': [] }, maxFiles: 1 });
  const refDrop = useDropzone({ onDrop: onDropRef, accept: { 'image/*': [] }, maxFiles: 1 });

  const analyzeRoom = async (base64Image: string) => {
    console.log("[LOG] Processing architectural analysis...");
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
              { text: 'Analyze this room. Return ONLY JSON: { "ppi": number, "rotateY": number, "skewY": number, "detectedStyle": "string" }' },
              { inlineData: { mimeType: "image/jpeg", data: base64Image.split(',')[1] } }
            ]}]
          }
        })
      });
      const res = await response.json();
      const rawText = res.candidates[0].content.parts[0].text;
      const data = JSON.parse(rawText.replace(/```json/g, '').replace(/```/g, '').trim());
      setAnalysisData(data);
      console.log("[LOG] Analysis success:", data);
    } catch (e) {
      console.error("[ERROR] Analysis crash, using default scale", e);
      setAnalysisData({ ppi: 7, rotateY: 0, skewY: 0, detectedStyle: 'Modern' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCreateForMe = async () => {
    console.log("[LOG] Starting special production...");
    if (!user) { setAuthModalOpen(true); return; }
    if (tokens <= 0) { alert("Insufficient tokens!"); return; }
    if (isGenerating || isInterfaceLocked || !accessToken) return;

    setIsGenerating(true);
    try {
      const dynamicAR = calculateAspectRatio(selectedSize.value, orientation);
      const prompt = `Exclusive room-matched wall art. Style: ${selectedStyle}, Theme: ${selectedTheme}, Orientation: ${orientation}, Aspect Ratio: ${dynamicAR}. ${includeText ? 'Minimal typography.' : 'No text.'} Elite visual.`;
      
      let finalBase64 = "";
      let taskCost = 0;

      console.log("[LOG] Requesting Gemini Engine...");
      try {
        const geminiRes = await fetch(`/api/gemini`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            endpoint: 'gemini-3.1-flash-image-preview:generateContent',
            payload: { contents: [{ parts: [{ text: prompt }] }] }
          })
        });
        const gData = await geminiRes.json();
        const b64 = gData.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData?.data;
        if (!b64) throw new Error("Gemini error");
        finalBase64 = `data:image/png;base64,${b64}`;
        console.log("[LOG] Gemini success");
      } catch (geminiErr) {
        console.warn("[LOG] Gemini fail, using Fallback Flux...");
        const dims = getRunwareDims(selectedSize.value, orientation);
        const task: any = {
          taskType: "imageInference",
          taskUUID: crypto.randomUUID(),
          model: FIXED_MODEL.id,
          positivePrompt: prompt,
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
        finalBase64 = rwData.data?.[0]?.imageURL;
        taskCost = rwData.data?.[0]?.cost || 0;
        console.log("[LOG] Fallback success. Cost:", taskCost);
      }

      if (!finalBase64) throw new Error("Critical engine failure");

      const thumbBase64 = await createThumbnail(finalBase64);
      
      console.log("[LOG] Auto-generating metadata...");
      let aiMeta = { seo_title: `${selectedStyle} Custom Art`, seo_description: "Unique piece.", alt_text: "AI Art", tags: [] };
      try {
        const seoRes = await fetch(`/api/gemini`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            endpoint: 'gemini-flash-latest:generateContent',
            payload: { contents: [{ parts: [{ text: `Generate JSON SEO for ${selectedStyle} ${selectedTheme} poster. Keys: seo_title, seo_description, alt_text, tags. ONLY JSON.` }] }] }
          })
        });
        const seoData = await seoRes.json();
        const cleanJson = seoData.candidates[0].content.parts[0].text.replace(/```json/g, '').replace(/```/g, '').trim();
        aiMeta = JSON.parse(cleanJson);
      } catch (e) { console.error("[LOG] SEO skipped"); }

      const tokenUsed = useToken();
      if (!tokenUsed) throw new Error("Token failure");

      console.log("[LOG] Syncing with database...");
      const formData = new FormData();
      formData.append('action', 'generate_and_save');
      formData.append('category', selectedStyle);
      formData.append('price', selectedSize.price.toString());
      formData.append('metadata', JSON.stringify(aiMeta));
      formData.append('mainImage', new Blob([base64ToUint8Array(finalBase64)], { type: 'image/png' }), 'm.png');
      formData.append('thumbnail', new Blob([base64ToUint8Array(thumbBase64)], { type: 'image/jpeg' }), 't.jpg');

      const uploadRes = await fetch('https://api.posterwallart.shop/api.php', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` },
        body: formData,
      });

      const result = await uploadRes.json();
      if (result.success) {
        const productWithMeta = { ...result.product, cost: taskCost };
        setRecommendations(p => [productWithMeta, ...p.slice(0, 2)]);
        setSelectedProduct(productWithMeta);
        console.log("[LOG] Production finished");
      }
    } catch (e: any) {
      console.error("[ERROR] Workflow failed:", e);
      alert(e.message || "An error occurred");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpscaleAndDownload = async (product: Product) => {
    console.log("[LOG] HD Upscale sequence initiated");
    setIsUpscalingId(product.id);
    try {
      const response = await fetch('/api/upscale', {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: product.image })
      });
      const data = await response.json();
      const upscaledUrl = data.upscaledUrl;
      const upscaleCost = data.cost || 0;
      if (!upscaledUrl) throw new Error("Upscale server error");
      
      console.log(`[LOG] Upscale success. Cost: $${upscaleCost}. Transferring...`);
      const link = document.createElement('a');
      link.href = upscaledUrl;
      link.download = `${product.title}_UltraHD.png`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e: any) {
      console.error("[ERROR] Upscale failed:", e);
      alert("Download error");
    } finally {
      setIsUpscalingId(null);
    }
  };

  const [pw, ph] = selectedSize.value.split('x').map(Number);
  const physicalWidth = orientation === 'portrait' ? pw : ph;
  const physicalHeight = orientation === 'portrait' ? ph : pw;

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-zinc-950 text-zinc-50 overflow-hidden font-sans">
      <AuthModal />

      <div className={`w-[400px] border-r border-zinc-800 bg-zinc-950 flex flex-col h-full overflow-y-auto transition-all ${isInterfaceLocked ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
        <div className="p-8 space-y-8 pb-24">
          <div>
            <h1 className="text-2xl font-black italic tracking-tighter text-emerald-500 uppercase">SPECIAL FOR YOUR ROOM</h1>
            <p className="text-[10px] text-zinc-500 font-bold tracking-widest mt-1 uppercase">AI Powered Architectural Studio</p>
          </div>

          <div className="space-y-2">
            <button
              onClick={handleCreateForMe}
              disabled={isGenerating || !roomImage || (user && tokens <= 0) || isInterfaceLocked}
              className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase rounded-2xl transition-all shadow-[0_0_40px_rgba(16,185,129,0.2)] disabled:opacity-20"
            >
              {isGenerating ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'MAKE ME FEEL SPECIAL'}
            </button>
            {user && (
              <p className="text-center text-[10px] text-zinc-600 font-mono uppercase tracking-tighter">
                Available Credits: <span className={tokens > 0 ? "text-emerald-500" : "text-red-500"}>{tokens}</span>
              </p>
            )}
          </div>

          <div className="space-y-6">
            <div className="space-y-4">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Aesthetic Tone</label>
              <div className="grid grid-cols-1 gap-2">
                <select value={selectedTheme} onChange={(e) => setSelectedTheme(e.target.value)} className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl text-xs outline-none focus:border-emerald-500">
                  {THEMES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <select value={selectedStyle} onChange={(e) => setSelectedStyle(e.target.value)} className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl text-xs outline-none focus:border-emerald-500">
                  {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Print Size</label>
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
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Orientation</label>
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
              <span className="text-xs font-medium">Inject Typography?</span>
              <button onClick={() => setIncludeText(!includeText)} className={`w-10 h-5 rounded-full transition-all ${includeText ? 'bg-emerald-600' : 'bg-zinc-700'} relative`}>
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${includeText ? 'right-1' : 'left-1'}`} />
              </button>
            </div>
          </div>

          {recommendations.length > 0 && (
            <div className="pt-6 border-t border-zinc-800 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-emerald-500" /> Recent Creations
              </h3>
              {recommendations.map((p) => (
                <div key={p.id} className={`p-4 border rounded-2xl cursor-pointer transition-all ${selectedProduct?.id === p.id ? 'border-emerald-500 bg-zinc-900' : 'border-zinc-800 hover:bg-zinc-900/50'}`} onClick={() => setSelectedProduct(p)}>
                  <div className="flex gap-4 items-center">
                    <img src={p.thumbnail || p.image} className="w-16 h-16 rounded-xl object-cover" alt={p.title} />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[10px] font-black truncate uppercase italic mb-2">{p.title}</h4>
                      <div className="flex flex-col gap-2">
                        <button onClick={(e) => { e.stopPropagation(); addToCart({ ...p, price: p.basePrice, type: 'physical' }); }} className="text-left text-[9px] text-emerald-500 font-black uppercase tracking-widest">🛒 Add to cart • ${p.basePrice}</button>
                        <button onClick={(e) => { e.stopPropagation(); handleUpscaleAndDownload(p); }} disabled={isUpscalingId === p.id} className="text-left text-[9px] text-zinc-400 hover:text-white font-black uppercase tracking-widest flex items-center gap-1">
                          {isUpscalingId === p.id ? <Loader2 className="w-2 h-2 animate-spin" /> : <Download className="w-2 h-2" />}
                          {isUpscalingId === p.id ? 'Processing...' : 'HD Download'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 p-8 flex flex-col gap-8 relative overflow-hidden">
        <div className="flex gap-6 h-48">
          <div {...roomDrop.getRootProps()} className="flex-1 border-2 border-dashed border-zinc-800 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-900/50 transition-all group relative overflow-hidden">
            <input {...roomDrop.getInputProps()} />
            {roomImage ? (
              <img src={roomImage} className="absolute inset-0 w-full h-full object-cover opacity-30" alt="Room" />
            ) : null}
            <div className="relative z-10 flex flex-col items-center">
              <Upload className="w-8 h-8 text-zinc-600 mb-2 group-hover:text-emerald-500 transition-colors" />
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">1. Upload Room Image</p>
            </div>
          </div>

          <div {...refDrop.getRootProps()} className="flex-1 border-2 border-dashed border-zinc-800 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-900/50 transition-all group relative overflow-hidden">
            <input {...refDrop.getInputProps()} />
            {refImage ? (
              <img src={refImage} className="absolute inset-0 w-full h-full object-cover opacity-30" alt="Ref" />
            ) : null}
            <div className="relative z-10 flex flex-col items-center">
              <ImageIcon className="w-8 h-8 text-zinc-600 mb-2 group-hover:text-emerald-500 transition-colors" />
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">2. Style Reference (Optional)</p>
            </div>
          </div>
        </div>

        <div className="flex-1 relative rounded-[40px] overflow-hidden bg-zinc-900 border border-zinc-800 shadow-[0_0_100px_rgba(0,0,0,0.5)]">
          {isAnalyzing ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-zinc-950/95 z-30 backdrop-blur-xl">
              <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin shadow-[0_0_30px_rgba(16,185,129,0.3)]" />
              <p className="font-black text-[10px] uppercase tracking-[0.4em] text-emerald-500 animate-pulse">Architectural Mapping...</p>
            </div>
          ) : roomImage ? (
            <InteractiveCanvas
              backgroundImage={roomImage}
              mountedArt={selectedProduct?.thumbnail || selectedProduct?.image || null}
              physicalWidth={physicalWidth}
              physicalHeight={physicalHeight}
              naturalPixelsPerInch={analysisData?.ppi || 6}
              frameColor={(FRAME_COLORS as any)[selectedFrame]}
              perspective={{ rotateY: analysisData?.rotateY || 0, skewY: analysisData?.skewY || 0 }}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-800">
              <Sparkles className="w-20 h-20 mb-4 opacity-5" />
              <p className="font-black text-xs uppercase tracking-[0.5em] opacity-10">Studio View Idle</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
