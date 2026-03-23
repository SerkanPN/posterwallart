import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Lock, Loader2, Download, Sparkles, Image as ImageIcon, History } from 'lucide-react';
import { useStore } from '../store/useStore';
import { InteractiveCanvas } from '../components/InteractiveCanvas';
import { AuthModal } from '../components/AuthModal';

type FrameType = 'unframed' | 'black' | 'oak';

interface Product {
  id: string; title: string; basePrice: number; image: string; category: string; description: string; isGenerated?: boolean; slug?: string; thumbnail?: string; cost?: number;
}

const DEFAULT_ROOMS = [
  "https://images.unsplash.com/photo-1616489953149-8356952814b1?q=80&w=1500&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=1500&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?q=80&w=1500&auto=format&fit=crop"
];

const FIXED_MODEL = { id: 'runware:101@1', params: { steps: 28, CFGScale: 1, scheduler: "FlowMatchEuler" }, supportsLora: true };
const FIXED_LORA = { model: "civitai:126208@137927", weight: 0.8 };

const SIZES = [
  { label: '8x10"',  price: 24, value: '8x10'  },
  { label: '11x14"', price: 28, value: '11x14' },
  { label: '16x20"', price: 32, value: '16x20' },
  { label: '18x24"', price: 36, value: '18x24' },
  { label: '20x30"', price: 40, value: '20x30' },
  { label: '24x36"', price: 44, value: '24x36' },
];

const STYLES = ['Minimalist', 'Bauhaus', 'Cyberpunk', 'Renaissance', 'Mid-Century Modern', 'Japandi', 'Industrial', 'Boho Chic', 'Art Deco', 'Nordic', 'Line Art', 'Watercolor'];
const THEMES = ['Nature', 'Music', 'Movie', 'Abstract', 'Cityscape', 'Space', 'Botanical', 'Architecture'];
const FRAME_COLORS = { 'unframed': null, 'black': '#18181b', 'oak': '#8b5a2b' };

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
  const [selectedFrame, setSelectedFrame] = useState<FrameType>('black');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [includeText, setIncludeText] = useState(false);
  const [analysisData, setAnalysisData] = useState<any>(null);

  useEffect(() => {
    if (!roomImage) {
      const randomRoom = DEFAULT_ROOMS[Math.floor(Math.random() * DEFAULT_ROOMS.length)];
      console.log("[LOG] No image provided, using default studio environment");
      setRoomImage(randomRoom);
      setAnalysisData({ ppi: 7, rotateY: 0, skewY: 0, detectedStyle: 'Modern', suggestedTheme: 'Abstract', suggestedSubject: 'scandinavian art' });
    }
  }, [roomImage]);

  const onDropRoom = useCallback((acceptedFiles: File[]) => {
    console.log("[LOG] New environment upload triggered");
    if (!user) { setAuthModalOpen(true); return; }
    const file = acceptedFiles[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setRoomImage(base64);
      analyzeRoom(base64);
    };
    reader.readAsDataURL(file);
  }, [user, setAuthModalOpen]);

  const onDropRef = useCallback((acceptedFiles: File[]) => {
    console.log("[LOG] Reference style anchor received");
    const file = acceptedFiles[0];
    const reader = new FileReader();
    reader.onload = (e) => setRefImage(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const roomDrop = useDropzone({ onDrop: onDropRoom, accept: { 'image/*': [] }, maxFiles: 1 });
  const refDrop = useDropzone({ onDrop: onDropRef, accept: { 'image/*': [] }, maxFiles: 1 });

  const analyzeRoom = async (base64Image: string) => {
    console.log("[LOG] Starting architectural mapping process...");
    setIsAnalyzing(true);
    try {
      const response = await fetch(`/api/gemini`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: 'gemini-flash-latest:generateContent',
          payload: {
            contents: [{ parts: [
              { text: 'Analyze this room. Return ONLY JSON: { "ppi": number, "rotateY": number, "skewY": number, "detectedStyle": "string", "suggestedTheme": "string", "suggestedSubject": "string" }' },
              { inlineData: { mimeType: "image/jpeg", data: base64Image.split(',')[1] } }
            ]}]
          }
        })
      });
      const res = await response.json();
      const rawText = res.candidates[0].content.parts[0].text;
      const data = JSON.parse(rawText.replace(/```json/g, '').replace(/```/g, '').trim());
      setAnalysisData(data);
      console.log("[LOG] Analysis successful:", data);
    } catch (error) {
      console.error("[ERROR] Analysis cluster failed:", error);
      setAnalysisData({ ppi: 7, rotateY: 0, skewY: 0, detectedStyle: 'Modern', suggestedTheme: 'Abstract', suggestedSubject: 'minimalist art' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCreateForMe = async () => {
    console.log("[LOG] Production sequence initiated");
    if (!user || tokens <= 0 || isGenerating || !accessToken || !analysisData || isAnalyzing) return;

    setIsGenerating(true);
    try {
      const w = selectedSize.value.split('x').map(Number)[0];
      const h = selectedSize.value.split('x').map(Number)[1];
      const common = (a: number, b: number): number => (b === 0 ? a : common(b, a % b));
      const gcd = common(w, h);
      const dynamicAR = orientation === 'portrait' ? `${w / gcd}:${h / gcd}` : `${h / gcd}:${w / gcd}`;

      const style = selectedStyle === 'Default' ? (analysisData?.detectedStyle || "Modern") : selectedStyle;
      const theme = selectedTheme === 'Default' ? (analysisData?.suggestedTheme || "Abstract") : selectedTheme;
      const subject = analysisData?.suggestedSubject || "bespoke art";

      let promptDirectives = `You are a world-class master artist and elite visual designer specializing in premium wall art. CORE OBJECTIVE: Create a visually stunning, ultra-detailed, high-end wall art composition that fully utilizes the canvas with ZERO empty borders. STYLE: ${style}, THEME: ${theme}, SUBJECT: ${subject}, ORIENTATION: ${orientation}, ASPECT RATIO: ${dynamicAR}. ${includeText ? 'Include minimal typography.' : 'NO text.'} RESOLUTION: 1024px.`;
      
      if (refImage) {
        promptDirectives = `You are a master artist. Using the provided reference image as both your thematic subject and visual style guide, create an ORIGINAL and unique masterpiece. Reimagine the core subject and artistic brushwork of the reference into a fresh composition. Maintain the color palette and atmosphere but do not copy exactly. ORIENTATION: ${orientation}, ASPECT RATIO: ${dynamicAR}. High-end elite art. ${includeText ? 'Include subtle typography.' : 'NO text.'}`;
      }

      let finalBase64 = "";
      console.log("[LOG] Deploying Phase 1: Gemini Genesis...");

      try {
        const geminiRes = await fetch(`/api/gemini`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            endpoint: 'gemini-3.1-flash-image-preview:generateContent',
            payload: { contents: [{ parts: [{ text: promptDirectives }] }] }
          })
        });
        const gData = await geminiRes.json();
        const b64 = gData.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData?.data;
        if (!b64) throw new Error("Empty cluster");
        finalBase64 = `data:image/png;base64,${b64}`;
        console.log("[LOG] Gemini engine successful");
      } catch (geminiErr) {
        console.warn("[LOG] Fallback active: Running FLUX cluster...");
        const rwW = orientation === 'portrait' ? 1024 : Math.floor((w/h)*1024/64)*64;
        const rwH = orientation === 'portrait' ? Math.floor((h/w)*1024/64)*64 : 1024;

        const rwRes = await fetch(`/api/runware`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify([{
            taskType: "imageInference",
            taskUUID: crypto.randomUUID(),
            model: FIXED_MODEL.id,
            positivePrompt: promptDirectives,
            width: rwW, height: rwH,
            numberResults: 1, outputType: "dataURI", outputFormat: "PNG",
            ...FIXED_MODEL.params,
            lora: [FIXED_LORA]
          }])
        });
        const rwData = await rwRes.json();
        finalBase64 = rwData.data?.[0]?.imageURL;
        console.log("[LOG] Fallback production complete");
      }

      if (!finalBase64) throw new Error("Critical production failure");

      const thumbBase64 = await createThumbnail(finalBase64);
      
      console.log("[LOG] Synchronizing Metadata...");
      let aiMeta = { seo_title: `Custom ${style} Art`, seo_description: "Unique wall art.", alt_text: "AI Art", tags: [] };
      try {
        const seoRes = await fetch(`/api/gemini`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            endpoint: 'gemini-flash-latest:generateContent',
            payload: { contents: [{ parts: [{ text: `Generate JSON SEO for ${style} ${theme} art. Use keys: seo_title, seo_description, alt_text, tags. Return ONLY JSON.` }] }] }
          })
        });
        const rawJson = (await seoRes.json()).candidates[0].content.parts[0].text.replace(/```json/g, '').replace(/```/g, '').trim();
        aiMeta = JSON.parse(rawJson);
      } catch (e) { console.error("[LOG] SEO packet skipped"); }

      useToken();

      console.log("[LOG] Syncing with marketplace server...");
      const formData = new FormData();
      formData.append('action', 'generate_and_save');
      formData.append('category', style);
      formData.append('price', selectedSize.price.toString());
      formData.append('metadata', JSON.stringify(aiMeta));
      formData.append('mainImage', new Blob([atob(finalBase64.split(',')[1]).split('').map(c => c.charCodeAt(0))], { type: 'image/png' }), 'm.png');
      formData.append('thumbnail', new Blob([atob(thumbBase64.split(',')[1]).split('').map(c => c.charCodeAt(0))], { type: 'image/jpeg' }), 't.jpg');

      const uploadRes = await fetch('https://api.posterwallart.shop/api.php', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` },
        body: formData,
      });

      const result = await uploadRes.json();
      if (result.success) {
        setRecommendations(p => [result.product, ...p.slice(0, 5)]);
        setSelectedProduct(result.product);
        console.log("[LOG] Deployment complete.");
      }
    } catch (error: any) {
      console.error("[ERROR] Production flow failure:", error);
      alert("System Notice: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpscaleAndDownload = async (product: Product) => {
    console.log("[LOG] HD Lab: 2x Upscale request");
    setIsUpscalingId(product.id);
    try {
      const response = await fetch('/api/upscale', {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: product.image })
      });
      const data = await response.json();
      if (!data.upscaledUrl) throw new Error("Engine fault");
      const link = document.createElement('a');
      link.href = data.upscaledUrl;
      link.download = `HD_${product.title}.png`;
      link.target = '_blank';
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
    } catch (error) {
      console.error("[ERROR] HD Link failure:", error);
      alert("Download error");
    } finally {
      setIsUpscalingId(null);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-zinc-950 text-zinc-50 overflow-hidden font-sans">
      <AuthModal />

      {/* LEFT: CONTROLS */}
      <div className={`w-[340px] border-r border-zinc-800 bg-zinc-950 flex flex-col h-full overflow-y-auto transition-all ${(!analysisData || isAnalyzing) ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
        <div className="p-6 space-y-8 pb-24">
          <div>
            <h1 className="text-xl font-black italic tracking-tighter text-emerald-500 uppercase leading-none">SPECIAL FOR<br/>YOUR ROOM</h1>
            <p className="text-[9px] text-zinc-500 font-bold tracking-widest mt-2 uppercase opacity-50">AI Design Studio v3.8</p>
          </div>

          <div className="space-y-2">
            <button
              onClick={handleCreateForMe}
              disabled={isGenerating || (user && tokens <= 0) || (!analysisData || isAnalyzing)}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase rounded-2xl transition-all shadow-[0_0_40px_rgba(16,185,129,0.15)] disabled:opacity-20"
            >
              {isGenerating ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'GENERATE SPECIAL ART'}
            </button>
            {user && <p className="text-center text-[9px] text-zinc-600 uppercase font-black tracking-widest">Balance: <span className="text-emerald-500">{tokens}</span></p>}
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Visual Aesthetic</label>
              <div className="grid grid-cols-1 gap-2">
                <select 
                  value={selectedStyle} 
                  disabled={!!refImage}
                  onChange={(e) => setSelectedStyle(e.target.value)} 
                  className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-[11px] font-bold outline-none focus:border-emerald-500 disabled:opacity-20"
                >
                  <option value="Default">Style: Auto Detect</option>
                  {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select 
                  value={selectedTheme} 
                  disabled={!!refImage}
                  onChange={(e) => setSelectedTheme(e.target.value)} 
                  className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-[11px] font-bold outline-none focus:border-emerald-500 disabled:opacity-20"
                >
                  <option value="Default">Theme: AI Suggestion</option>
                  {THEMES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Dimensions</label>
              <div className="grid grid-cols-2 gap-2">
                {SIZES.map(s => (
                  <button key={s.value} onClick={() => setSelectedSize(s)} className={`py-2 rounded-xl border text-[9px] font-black transition-all ${selectedSize.value === s.value ? 'bg-zinc-100 text-zinc-900' : 'bg-zinc-900 text-zinc-500 border-zinc-800'}`}>{s.label}</button>
                ))}
              </div>
              <div className="flex gap-2">
                {(['portrait', 'landscape'] as const).map(o => (
                  <button key={o} onClick={() => setOrientation(o)} className={`flex-1 py-2 text-[9px] font-black rounded-xl border capitalize ${orientation === o ? 'bg-zinc-800 text-white' : 'bg-zinc-950 text-zinc-600 border-zinc-800'}`}>{o}</button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Finishing</label>
              <div className="flex gap-2">
                {(['unframed', 'black', 'oak'] as FrameType[]).map(f => (
                  <button key={f} onClick={() => setSelectedFrame(f)} className={`flex-1 py-2 rounded-xl border flex items-center justify-center ${selectedFrame === f ? 'bg-zinc-800 border-zinc-600' : 'bg-zinc-950 border-zinc-800'}`}>
                    <div className="w-2.5 h-2.5 rounded-full border border-zinc-700" style={{ backgroundColor: FRAME_COLORS[f] || '#fff' }}></div>
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between p-3 bg-zinc-900 rounded-xl border border-zinc-800">
                <span className="text-[10px] font-bold">Include Typography?</span>
                <button onClick={() => setIncludeText(!includeText)} className={`w-8 h-4 rounded-full transition-all ${includeText ? 'bg-emerald-600' : 'bg-zinc-700'} relative`}>
                  <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${includeText ? 'right-0.5' : 'left-0.5'}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CENTER: STUDIO */}
      <div className="flex-1 p-6 flex flex-col gap-6 relative overflow-hidden bg-zinc-950">
        <div className="flex gap-4 h-32">
          <div {...roomDrop.getRootProps()} className="flex-1 border-2 border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-900/50 transition-all group relative overflow-hidden bg-zinc-900/20">
            <input {...roomDrop.getInputProps()} />
            {roomImage && roomImage.startsWith('http') === false && (
              <img src={roomImage} className="absolute inset-0 w-full h-full object-cover opacity-30" alt="Room" />
            )}
            <div className="relative z-10 flex flex-col items-center">
              <Upload className="w-6 h-6 text-zinc-600 mb-1 group-hover:text-emerald-500" />
              <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500">1. ENVIRONMENT LINK</p>
            </div>
          </div>

          <div {...refDrop.getRootProps()} className="flex-1 border-2 border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-900/50 transition-all group relative overflow-hidden bg-zinc-900/20">
            <input {...refDrop.getInputProps()} />
            {refImage ? (
              <div className="absolute inset-0">
                <img src={refImage} className="w-full h-full object-cover opacity-40" alt="Ref" />
                <button onClick={(e) => { e.stopPropagation(); setRefImage(null); }} className="absolute top-1 right-1 bg-red-500/80 p-1 rounded-md text-[7px] font-black">RESET</button>
              </div>
            ) : null}
            <div className="relative z-10 flex flex-col items-center">
              <ImageIcon className="w-6 h-6 text-zinc-600 mb-1 group-hover:text-blue-500" />
              <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500">2. STYLE ANCHOR</p>
            </div>
          </div>
        </div>

        <div className="flex-1 relative rounded-[32px] overflow-hidden bg-zinc-900 border border-zinc-800 shadow-2xl">
          {isAnalyzing ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-zinc-950/90 z-30 backdrop-blur-xl">
              <div className="w-12 h-12 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="font-black text-[9px] uppercase tracking-[0.3em] text-emerald-500">MAPPING SPACE...</p>
            </div>
          ) : (
            <InteractiveCanvas
              backgroundImage={roomImage || ""}
              mountedArt={selectedProduct?.thumbnail || selectedProduct?.image || null}
              physicalWidth={orientation === 'portrait' ? selectedSize.value.split('x').map(Number)[0] : selectedSize.value.split('x').map(Number)[1]}
              physicalHeight={orientation === 'portrait' ? selectedSize.value.split('x').map(Number)[1] : selectedSize.value.split('x').map(Number)[0]}
              naturalPixelsPerInch={analysisData?.ppi || 7}
              frameColor={(FRAME_COLORS as any)[selectedFrame]}
              perspective={{ rotateY: analysisData?.rotateY || 0, skewY: analysisData?.skewY || 0 }}
            />
          )}
        </div>
      </div>

      {/* RIGHT: HISTORY */}
      <div className="w-[280px] border-l border-zinc-800 bg-zinc-950 flex flex-col h-full">
        <div className="p-6 space-y-6 overflow-y-auto scrollbar-hide">
          <div className="flex items-center gap-2 border-b border-zinc-900 pb-4">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">CREATION LOG</h2>
          </div>
          
          <div className="space-y-4">
            {recommendations.length === 0 && <p className="text-[9px] text-zinc-700 italic text-center py-10 font-bold uppercase tracking-tighter">Ready for Action</p>}
            {recommendations.map((p) => (
              <div key={p.id} className={`p-2 border rounded-2xl cursor-pointer transition-all ${selectedProduct?.id === p.id ? 'border-emerald-500 bg-zinc-900 shadow-lg' : 'border-zinc-900 hover:bg-zinc-900/40'}`} onClick={() => setSelectedProduct(p)}>
                <img src={p.thumbnail || p.image} className="w-full aspect-square rounded-xl object-cover mb-2 border border-zinc-800 shadow-sm" alt="Creation" />
                <div className="flex flex-col gap-1.5">
                  <button onClick={(e) => { e.stopPropagation(); addToCart({ ...p, price: p.basePrice, type: 'physical' }); }} className="w-full py-2 bg-emerald-600/10 text-emerald-500 text-[8px] font-black uppercase rounded-lg hover:bg-emerald-600 hover:text-white transition-all">Add to Bag</button>
                  <button onClick={(e) => { e.stopPropagation(); handleUpscaleAndDownload(p); }} disabled={isUpscalingId === p.id} className="w-full py-1.5 text-zinc-500 hover:text-zinc-200 text-[8px] font-black uppercase flex items-center justify-center gap-1">
                    {isUpscalingId === p.id ? <Loader2 className="w-2 h-2 animate-spin" /> : <Download className="w-2 h-2" />}
                    {isUpscalingId === p.id ? 'PROCESSING...' : 'HD DOWNLOAD'}
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
