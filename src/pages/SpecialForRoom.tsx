import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Lock, Loader2, Download, Sparkles, Image as ImageIcon, History, ShoppingCart, X, Check } from 'lucide-react';
import { useStore } from '../store/useStore';
import { InteractiveCanvas } from '../components/InteractiveCanvas';
import { AuthModal } from '../components/AuthModal';

// --- TYPES ---
interface Product {
  id: string; title: string; basePrice: number; image: string; category: string; description: string; isGenerated?: boolean; slug?: string; thumbnail?: string; cost?: number;
}
interface ConfigItem { id: string; label: string; price?: number; width?: number; height?: number; color?: string | null; }

// --- CONSTANTS ---
const FIXED_DEFAULT_ROOM = "https://images.unsplash.com/photo-1614359833859-457335928af0?q=80&w=1500&auto=format&fit=crop";
const FIXED_MODEL = { id: 'runware:101@1', params: { steps: 28, CFGScale: 1, scheduler: "FlowMatchEuler" }, supportsLora: true };
const FIXED_LORA = { model: "civitai:126208@137927", weight: 0.8 };

export function SpecialForRoom() {
  const { user, tokens, addToCart, setAuthModalOpen, useToken, accessToken, setCartOpen } = useStore();
  
  // --- CONFIG STATES (NO HARDCODED LISTS) ---
  const [configStyles, setConfigStyles] = useState<ConfigItem[]>([]);
  const [configThemes, setConfigThemes] = useState<ConfigItem[]>([]);
  const [configSizes, setConfigSizes] = useState<ConfigItem[]>([]);
  const [configOrientations, setConfigOrientations] = useState<ConfigItem[]>([]);
  const [configFrames, setConfigFrames] = useState<ConfigItem[]>([]);
  const [isConfigLoading, setIsConfigLoading] = useState(true);

  // --- UI STATES ---
  const [roomImage, setRoomImage] = useState<string | null>(null);
  const [refImage, setRefImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUpscalingId, setIsUpscalingId] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [analysisData, setAnalysisData] = useState<any>(null);

  // --- SELECTION STATES ---
  const [selectedStyle, setSelectedStyle] = useState('Default');
  const [selectedTheme, setSelectedTheme] = useState('Default');
  const [selectedSizeId, setSelectedSizeId] = useState('');
  const [selectedOrientationId, setSelectedOrientationId] = useState('');
  const [selectedFrameId, setSelectedFrameId] = useState('');
  const [includeText, setIncludeText] = useState(false);

  // --- MODAL STATES ---
  const [modalProduct, setModalProduct] = useState<Product | null>(null);
  const [modalSizeId, setModalSizeId] = useState('');

  // Critical: Interface stays locked until analysis is done OR configs are missing
  const isInterfaceLocked = isConfigLoading || isAnalyzing || !analysisData;

  // --- 1. FETCH CONFIG FROM PUBLIC/CONFIG/*.JSON ---
  useEffect(() => {
    const loadConfigs = async () => {
      console.log("[LOG] System: Syncing configuration from JSON storage...");
      try {
        const [s, t, sz, o, f] = await Promise.all([
          fetch('/config/styles.json').then(r => r.json()),
          fetch('/config/themes.json').then(r => r.json()),
          fetch('/config/sizes.json').then(r => r.json()),
          fetch('/config/orientations.json').then(r => r.json()),
          fetch('/config/frames.json').then(r => r.json())
        ]);
        setConfigStyles(s);
        setConfigThemes(t);
        setConfigSizes(sz);
        setConfigOrientations(o);
        setConfigFrames(f);
        
        // Dynamic Default Assignments
        if (sz.length > 0) { setSelectedSizeId(sz[3]?.id || sz[0].id); setModalSizeId(sz[3]?.id || sz[0].id); }
        if (o.length > 0) setSelectedOrientationId(o[0].id);
        if (f.length > 0) setSelectedFrameId(f[1]?.id || f[0].id);
        
        console.log("[LOG] System: Configuration sync complete");
      } catch (error) {
        console.error("[ERROR] System: Critical JSON fetch failure. Dropdowns will be empty.", error);
      } finally {
        setIsConfigLoading(false);
      }
    };
    loadConfigs();
  }, []);

  // --- 2. INITIALIZE ROOM ---
  useEffect(() => {
    if (!roomImage) {
      console.log("[LOG] UI: Waiting for user input, using default record studio base");
      setRoomImage(FIXED_DEFAULT_ROOM);
      setAnalysisData({ ppi: 15.0, rotateY: 0, skewY: 0, detectedStyle: 'Warm Minimalist', suggestedTheme: 'Aesthetic', suggestedSubject: 'vintage vibes' });
    }
  }, [roomImage]);

  // --- HELPERS ---
  const calculateAspectRatio = (sizeId: string, orientationId: string) => {
    const size = configSizes.find(s => s.id === sizeId);
    if (!size || !size.width || !size.height) return "3:4";
    const common = (a: number, b: number): number => (b === 0 ? a : common(b, a % b));
    const gcd = common(size.width, size.height);
    return orientationId === 'portrait' ? `${size.width / gcd}:${size.height / gcd}` : `${size.height / gcd}:${size.width / gcd}`;
  };

  const base64ToUint8Array = (base64Data: string) => {
    const parts = base64Data.split(';base64,');
    const binaryString = atob(parts[1]);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes;
  };

  // --- ACTION HANDLERS ---
  const onDropRoom = useCallback((acceptedFiles: File[]) => {
    if (!user) { setAuthModalOpen(true); return; }
    const file = acceptedFiles[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setRoomImage(base64);
      analyzeRoom(base64);
    };
    reader.readAsDataURL(file);
    console.log("[LOG] UI: New room image processing...");
  }, [user, setAuthModalOpen]);

  const onDropRef = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    const reader = new FileReader();
    reader.onload = (e) => setRefImage(e.target?.result as string);
    reader.readAsDataURL(file);
    console.log("[LOG] UI: Style reference anchor set");
  }, []);

  const roomDrop = useDropzone({ onDrop: onDropRoom, accept: { 'image/*': [] }, maxFiles: 1 });
  const refDrop = useDropzone({ onDrop: onDropRef, accept: { 'image/*': [] }, maxFiles: 1 });

  const analyzeRoom = async (base64Image: string) => {
    setIsAnalyzing(true);
    try {
      const response = await fetch(`/api/gemini`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: 'gemini-flash-latest:generateContent',
          payload: {
            contents: [{ parts: [
              { text: 'Analyze room scale and 3D perspective. Return ONLY JSON: { "ppi": number, "rotateY": number, "skewY": number, "detectedStyle": "string", "suggestedTheme": "string", "suggestedSubject": "string" }' },
              { inlineData: { mimeType: "image/jpeg", data: base64Image.split(',')[1] } }
            ]}]
          }
        })
      });
      const res = await response.json();
      const data = JSON.parse(res.candidates[0].content.parts[0].text.replace(/```json/g, '').replace(/```/g, '').trim());
      setAnalysisData(data);
      console.log("[LOG] API: Architectural metadata verified");
    } catch (error) {
      console.error("[ERROR] API: Analysis crash, using default matrix");
      setAnalysisData({ ppi: 12, rotateY: 0, skewY: 0, detectedStyle: 'Modern', suggestedTheme: 'Abstract', suggestedSubject: 'piece' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCreateForMe = async () => {
    if (!user || tokens <= 0 || isGenerating || !accessToken) {
      if (!user) setAuthModalOpen(true);
      return;
    }
    setIsGenerating(true);
    console.log("[LOG] Process: Production flow started");

    try {
      const sizeObj = configSizes.find(s => s.id === selectedSizeId);
      const dynamicAR = calculateAspectRatio(selectedSizeId, selectedOrientationId);
      const style = selectedStyle === 'Default' ? (analysisData?.detectedStyle || "Modern") : selectedStyle;
      const theme = selectedTheme === 'Default' ? (analysisData?.suggestedTheme || "Abstract") : selectedTheme;
      const subject = analysisData?.suggestedSubject || "artwork";

      let prompt = `You are a world-class master artist and elite visual designer specializing in premium wall art. CORE OBJECTIVE: Create a visually stunning, ultra-detailed, high-end wall art composition that fully utilizes the canvas with ZERO empty borders. STYLE: ${style}, THEME: ${theme}, SUBJECT: ${subject}, ORIENTATION: ${selectedOrientationId}, ASPECT RATIO: ${dynamicAR}. ${includeText ? 'Include minimal typography.' : 'NO text.'} RESOLUTION: 1024px.`;
      
      if (refImage) {
        prompt = `You are a master artist. Using the provided reference image as both your thematic subject and visual style guide, create an ORIGINAL masterpiece. Reimagine the core subject and brushwork of the reference into a fresh composition. Maintain color palette. ORIENTATION: ${selectedOrientationId}, ASPECT RATIO: ${dynamicAR}. High-end elite art. ${includeText ? 'Subtle typography.' : 'NO text.'}`;
      }

      let finalBase64 = "";
      try {
        const gemRes = await fetch(`/api/gemini`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: 'gemini-3.1-flash-image-preview:generateContent', payload: { contents: [{ parts: [{ text: prompt }] }] } })
        });
        const gData = await gemRes.json();
        const b64 = gData.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData?.data;
        if (!b64) throw new Error("API Null response");
        finalBase64 = `data:image/png;base64,${b64}`;
        console.log("[LOG] API: Genesis successful");
      } catch (e) {
        console.warn("[LOG] API: Fallback cluster engaged - Runware");
        const rwRes = await fetch(`/api/runware`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify([{ taskType: "imageInference", taskUUID: crypto.randomUUID(), model: FIXED_MODEL.id, positivePrompt: prompt, width: 1024, height: 1024, numberResults: 1, outputType: "dataURI", outputFormat: "PNG", ...FIXED_MODEL.params, lora: [FIXED_LORA] }])
        });
        const rwData = await rwRes.json();
        finalBase64 = rwData.data?.[0]?.imageURL;
      }

      if (!finalBase64) throw new Error("All image clusters failed");

      // Creating temporary thumbnail
      const thumbB64 = await new Promise<string>((resolve) => {
        const img = new Image(); img.src = finalBase64;
        img.onload = () => {
          const c = document.createElement('canvas'); c.width = 400; c.height = 400;
          c.getContext('2d')?.drawImage(img, 0, 0, 400, 400);
          resolve(c.toDataURL('image/jpeg', 0.8));
        };
      });

      useToken();

      const formData = new FormData();
      formData.append('action', 'generate_and_save');
      formData.append('category', style);
      formData.append('price', (sizeObj?.price || 22).toString());
      formData.append('metadata', JSON.stringify({ seo_title: `Custom ${style} Art` }));
      formData.append('mainImage', new Blob([base64ToUint8Array(finalBase64)], { type: 'image/png' }), 'm.png');
      formData.append('thumbnail', new Blob([base64ToUint8Array(thumbB64)], { type: 'image/jpeg' }), 't.jpg');

      const uploadRes = await fetch('https://api.posterwallart.shop/api.php', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` },
        body: formData,
      });

      const result = await uploadRes.json();
      if (result.success) {
        setRecommendations(p => [result.product, ...p.slice(0, 5)]);
        setSelectedProduct(result.product);
        console.log("[LOG] System: Masterpiece live");
      }
    } catch (error: any) {
      console.error("[ERROR] Production failed:", error);
      alert("Execution error: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFinalAddToCart = () => {
    if (!modalProduct) return;
    const sizeObj = configSizes.find(s => s.id === modalSizeId);
    if (!sizeObj) return;
    addToCart({ ...modalProduct, price: sizeObj.price, type: 'physical', selectedSize: sizeObj.label });
    setModalProduct(null);
    setCartOpen(true);
  };

  const handleUpscaleAndDownload = async (product: Product) => {
    setIsUpscalingId(product.id);
    try {
      const response = await fetch('/api/upscale', {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: product.image })
      });
      const data = await response.json();
      const link = document.createElement('a'); link.href = data.upscaledUrl; link.download = `HD_${product.id}.png`; link.target = '_blank'; document.body.appendChild(link); link.click(); document.body.removeChild(link);
    } catch (error) {
      alert("Download failed");
    } finally {
      setIsUpscalingId(null);
    }
  };

  const currentSizeObj = configSizes.find(s => s.id === selectedSizeId);
  const frameColor = configFrames.find(f => f.id === selectedFrameId)?.color || null;

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-zinc-950 text-zinc-50 overflow-hidden font-sans">
      <AuthModal />

      {/* POPUP MODAL */}
      {modalProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-xl" onClick={() => setModalProduct(null)} />
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-[40px] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row shadow-2xl animate-in zoom-in-95 duration-300">
            <button onClick={() => setModalProduct(null)} className="absolute top-6 right-6 z-10 p-2 bg-zinc-950 rounded-full border border-zinc-800 hover:bg-zinc-800 transition-all"><X className="w-5 h-5" /></button>
            <div className="flex-1 bg-zinc-950 flex items-center justify-center p-8"><img src={modalProduct.image} className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border border-zinc-800" alt="P" /></div>
            <div className="w-full md:w-[380px] p-10 flex flex-col justify-between border-l border-zinc-800">
              <div className="space-y-8">
                <div><p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500 mb-2">Master Creation</p><h2 className="text-3xl font-black italic tracking-tighter uppercase leading-none">{modalProduct.title}</h2></div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Choose Format</label>
                  <select value={modalSizeId} onChange={(e) => setModalSizeId(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-2xl text-xs font-bold outline-none">
                    {configSizes.map(s => <option key={s.id} value={s.id}>{s.label} — ${s.price}</option>)}
                  </select>
                </div>
              </div>
              <button onClick={handleFinalAddToCart} className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase rounded-2xl transition-all shadow-[0_0_30px_rgba(16,185,129,0.2)] flex items-center justify-center gap-3 mt-8"><ShoppingCart className="w-5 h-5" /> ADD TO CART</button>
            </div>
          </div>
        </div>
      )}

      {/* LEFT: CONTROLS */}
      <div className={`w-[320px] border-r border-zinc-800 bg-zinc-950 flex flex-col h-full overflow-y-auto transition-all ${isInterfaceLocked ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
        <div className="p-6 space-y-8 pb-24">
          <div><h1 className="text-xl font-black italic tracking-tighter text-emerald-500 uppercase leading-none">SPECIAL FOR<br/>YOUR ROOM</h1><p className="text-[9px] text-zinc-500 font-bold tracking-widest mt-2 uppercase opacity-50">Studio AI v8.5</p></div>
          <button onClick={handleCreateForMe} disabled={isGenerating || (user && tokens <= 0) || isInterfaceLocked} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase rounded-2xl transition-all shadow-[0_0_40px_rgba(16,185,129,0.15)] disabled:opacity-20 flex items-center justify-center gap-2">{isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-4 h-4" /> MAKE ME SPECIAL</>}</button>
          
          <div className="space-y-6">
            <div className="space-y-4">
              <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Visual Tuning</label>
              <div className="space-y-2">
                <select value={selectedStyle} disabled={!!refImage} onChange={(e) => setSelectedStyle(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-[11px] font-bold outline-none focus:border-emerald-500 transition-colors">
                  <option value="Default">Style: Auto Detect</option>
                  {configStyles.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
                <select value={selectedTheme} disabled={!!refImage} onChange={(e) => setSelectedTheme(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-[11px] font-bold outline-none focus:border-emerald-500 transition-colors">
                  <option value="Default">Theme: Auto Suggest</option>
                  {configThemes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-4">
              <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Physical Format</label>
              <div className="space-y-2">
                <select value={selectedSizeId} onChange={(e) => setSelectedSizeId(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-[11px] font-bold outline-none focus:border-emerald-500 transition-colors">
                  {configSizes.map(s => <option key={s.id} value={s.id}>{s.label} • ${s.price}</option>)}
                </select>
                <select value={selectedOrientationId} onChange={(e) => setSelectedOrientationId(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-[11px] font-bold outline-none focus:border-emerald-500 transition-colors">
                  {configOrientations.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                </select>
                <select value={selectedFrameId} onChange={(e) => setSelectedFrameId(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-[11px] font-bold outline-none focus:border-emerald-500 transition-colors">
                  {configFrames.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-zinc-900 rounded-xl border border-zinc-800">
              <span className="text-[10px] font-bold uppercase text-zinc-400">Typography?</span>
              <button onClick={() => setIncludeText(!includeText)} className={`w-8 h-4 rounded-full transition-all ${includeText ? 'bg-emerald-600' : 'bg-zinc-700'} relative`}><div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${includeText ? 'right-0.5' : 'left-0.5'}`} /></button>
            </div>
          </div>
        </div>
      </div>

      {/* CENTER: STUDIO VIEW */}
      <div className="flex-1 p-6 flex flex-col gap-6 relative overflow-hidden bg-zinc-950">
        <div className="flex gap-4 h-32">
          <div {...roomDrop.getRootProps()} className="flex-1 border-2 border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-900/50 transition-all group relative overflow-hidden bg-zinc-900/10">
            <input {...roomDrop.getInputProps()} />
            {roomImage && roomImage.startsWith('data') ? <img src={roomImage} className="absolute inset-0 w-full h-full object-cover opacity-30" alt="R" /> : null}
            <Upload className="w-6 h-6 text-zinc-600 mb-1 relative z-10 group-hover:text-emerald-500" />
            <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500 relative z-10">1. UPLOAD YOUR ROOM</p>
          </div>
          <div {...refDrop.getRootProps()} className="flex-1 border-2 border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-900/50 transition-all group relative overflow-hidden bg-zinc-900/10">
            <input {...refDrop.getInputProps()} />
            {refImage ? <div className="absolute inset-0"><img src={refImage} className="w-full h-full object-cover opacity-40" alt="Ref" /><button onClick={(e) => { e.stopPropagation(); setRefImage(null); }} className="absolute top-1 right-1 bg-red-500/80 p-1 rounded-md text-[7px] font-black uppercase">RESET</button></div> : null}
            <ImageIcon className="w-6 h-6 text-zinc-600 mb-1 group-hover:text-blue-500 relative z-10" />
            <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500 relative z-10">2. UPLOAD REFERENCE</p>
          </div>
        </div>
        <div className="flex-1 relative rounded-[32px] overflow-hidden bg-zinc-900 border border-zinc-800 shadow-2xl shadow-black/50">
          {isAnalyzing ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-zinc-950/95 z-30 backdrop-blur-xl">
              <div className="w-12 h-12 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="font-black text-[9px] uppercase tracking-[0.3em] text-emerald-500">Architectural Mapping...</p>
            </div>
          ) : (
            <InteractiveCanvas
              backgroundImage={roomImage || ""}
              mountedArt={selectedProduct?.thumbnail || selectedProduct?.image || null}
              physicalWidth={selectedOrientationId === 'portrait' ? (currentSizeObj?.width || 18) : (currentSizeObj?.height || 24)}
              physicalHeight={selectedOrientationId === 'portrait' ? (currentSizeObj?.height || 24) : (currentSizeObj?.width || 18)}
              naturalPixelsPerInch={analysisData?.ppi || 15.0}
              frameColor={frameColor}
              perspective={{ rotateY: analysisData?.rotateY || 0, skewY: analysisData?.skewY || 0 }}
            />
          )}
        </div>
      </div>

      {/* RIGHT: RECENT HISTORY */}
      <div className="w-[280px] border-l border-zinc-800 bg-zinc-950 flex flex-col h-full">
        <div className="p-6 space-y-6 overflow-y-auto scrollbar-hide">
          <div className="flex items-center gap-2 border-b border-zinc-900 pb-4"><History className="w-4 h-4 text-zinc-600" /><h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">HISTORY</h2></div>
          <div className="space-y-4">
            {recommendations.length === 0 && <p className="text-[9px] text-zinc-700 italic text-center py-10 font-bold uppercase tracking-tighter">Ready for creation</p>}
            {recommendations.map((p) => (
              <div key={p.id} className={`p-2 border rounded-2xl cursor-pointer transition-all ${selectedProduct?.id === p.id ? 'border-emerald-500 bg-zinc-900 shadow-lg' : 'border-zinc-900 hover:bg-zinc-900/40'}`} onClick={() => setSelectedProduct(p)}>
                <img src={p.thumbnail || p.image} className="w-full aspect-square rounded-xl object-cover mb-2 border border-zinc-800 shadow-sm" alt="Res" />
                <div className="flex flex-col gap-1.5">
                  <button onClick={(e) => { e.stopPropagation(); setModalProduct(p); }} className="w-full py-2 bg-emerald-600/10 text-emerald-500 text-[8px] font-black uppercase rounded-lg hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center gap-2"><ShoppingCart className="w-3 h-3" /> ADD TO CART</button>
                  <button onClick={(e) => { e.stopPropagation(); handleUpscaleAndDownload(p); }} disabled={isUpscalingId === p.id} className="w-full py-1.5 text-zinc-500 text-[8px] font-black uppercase flex items-center justify-center gap-1 hover:text-zinc-200 transition-colors">
                    {isUpscalingId === p.id ? <Loader2 className="w-2 h-2 animate-spin" /> : <Download className="w-2 h-2" />}{isUpscalingId === p.id ? 'PROCESSING...' : 'HD DOWNLOAD'}
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
