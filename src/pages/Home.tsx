import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Lock, Loader2, Download, Sparkles, Layers, Info } from 'lucide-react';
import { useStore } from '../store/useStore';
import { InteractiveCanvas } from '../components/InteractiveCanvas';
import { AuthModal } from '../components/AuthModal';

type FrameType = 'unframed' | 'black' | 'oak';

interface Product {
  id: string; title: string; basePrice: number; image: string; category: string; description: string; isGenerated?: boolean; slug?: string; thumbnail?: string; cost?: number;
}

const MODELS = [
  { id: 'runware:101@1', name: 'FLUX.1 Dev', group: 'FLUX', supportsLora: true, params: { steps: 28, CFGScale: 1 } },
  { id: 'runware:100@1', name: 'FLUX.1 Schnell', group: 'FLUX', supportsLora: true, params: { steps: 4, CFGScale: 1 } },
  { id: 'ideogram:V_3@1', name: 'Ideogram 3.0', group: 'Ideogram', supportsLora: false, params: {} },
  { id: 'ideogram:V_2A@1', name: 'Ideogram 2a', group: 'Ideogram', supportsLora: false, params: {} },
  { id: 'recraft:v4@0', name: 'Recraft V4', group: 'Recraft', supportsLora: false, params: {} },
  { id: 'civitai:618692@699279', name: 'Juggernaut XL', group: 'SDXL', supportsLora: true, params: { steps: 30, CFGScale: 7 } },
];

const SIZES = [
  { label: '8x10"',  price: 22, value: '8x10'  },
  { label: '11x14"', price: 24, value: '11x14' },
  { label: '16x20"', price: 26, value: '16x20' },
  { label: '18x24"', price: 26, value: '18x24' },
  { label: '20x30"', price: 39, value: '20x30' },
  { label: '24x36"', price: 49, value: '24x36' },
];

const STYLES = [
  'Minimalist', 'Bauhaus', 'Cyberpunk', 'Renaissance', 'Mid-Century Modern',
  'Japandi', 'Industrial', 'Boho Chic', 'Art Deco', 'Vaporwave',
  'Surrealism', 'Pop Art', 'Abstract Expressionism', 'Impressionism', 'Nordic',
  'Street Art', 'Futurism', 'Vintage Poster', 'Line Art', 'Watercolor'
];

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
    console.log("[LOG] Thumbnail creation started");
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

export function Home() {
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
  const [selectedModel, setSelectedModel] = useState(MODELS[0]);
  const [loras, setLoras] = useState<any[]>([]);
  const [selectedLora, setSelectedLora] = useState("");
  const [loraWeight, setLoraWeight] = useState(0.8);

  const isInterfaceLocked = !analysisData || isAnalyzing;

  useEffect(() => {
    const fetchLoras = async () => {
      try {
        console.log("[LOG] Fetching style loras...");
        const res = await fetch('https://civitai.com/api/v1/models?username=TangBohu&types=LORA&limit=100');
        const data = await res.json();
        const filtered = data.items.filter((m: any) => 
          m.name.toLowerCase().includes('style of') && 
          m.modelVersions?.[0]?.baseModel?.toLowerCase().includes('flux')
        );
        setLoras(filtered);
        console.log("[LOG] Loras loaded:", filtered.length);
      } catch (e) {
        console.error("[ERROR] Lora fetch failed:", e);
      }
    };
    fetchLoras();
  }, []);

  const onDropRoom = useCallback((acceptedFiles: File[]) => {
    console.log("[LOG] Room file dropped");
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
    console.log("[LOG] Reference file dropped");
    const file = acceptedFiles[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => setRefImage(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const roomDrop = useDropzone({ onDrop: onDropRoom, accept: { 'image/*': [] }, maxFiles: 1 });
  const refDrop = useDropzone({ onDrop: onDropRef, accept: { 'image/*': [] }, maxFiles: 1 });

  const analyzeRoom = async (base64Image: string) => {
    console.log("[LOG] Analyzing room...");
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
              { text: 'Analyze room scale and perspective. Return ONLY JSON: { "ppi": number, "rotateY": number, "skewY": number, "detectedStyle": "string" }' },
              { inlineData: { mimeType: "image/jpeg", data: base64Image.split(',')[1] } }
            ]}]
          }
        })
      });
      if (!response.ok) throw new Error("Analysis API failed");
      const res = await response.json();
      const rawText = res.candidates[0].content.parts[0].text;
      const data = JSON.parse(rawText.replace(/```json/g, '').replace(/```/g, '').trim());
      setAnalysisData(data);
      console.log("[LOG] Analysis successful:", data);
    } catch (e) {
      console.error("[ERROR] Analysis failed, using defaults:", e);
      setAnalysisData({ ppi: 7, rotateY: 0, skewY: 0, detectedStyle: 'Modern' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCreateForMe = async () => {
    console.log("[LOG] Generation triggered");
    if (!user) { setAuthModalOpen(true); return; }
    if (tokens <= 0) { alert("Insufficient tokens!"); return; }
    if (isGenerating || isInterfaceLocked || !accessToken) return;

    setIsGenerating(true);
    try {
      const dynamicAR = calculateAspectRatio(selectedSize.value, orientation);
      const prompt = `Style: ${selectedStyle}, Theme: ${selectedTheme}, Orientation: ${orientation}, Aspect Ratio: ${dynamicAR}. ${includeText ? 'Include typography.' : 'No text.'} Premium wall art.`;
      
      let finalBase64 = "";
      let taskCost = 0;

      console.log("[LOG] Attempting primary engine: Gemini");
      try {
        const geminiRes = await fetch(`/api/gemini`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            endpoint: 'gemini-3.1-flash-image-preview:generateContent',
            payload: { contents: [{ parts: [{ text: prompt }] }] }
          })
        });
        if (!geminiRes.ok) throw new Error("Gemini failed");
        const gData = await geminiRes.json();
        const b64 = gData.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData?.data;
        if (!b64) throw new Error("Gemini empty data");
        finalBase64 = `data:image/png;base64,${b64}`;
        console.log("[LOG] Gemini success");
      } catch (geminiErr) {
        console.warn("[LOG] Gemini failed, falling back to Runware Flux...");
        const dims = getRunwareDims(selectedSize.value, orientation);
        const task: any = {
          taskType: "imageInference",
          taskUUID: crypto.randomUUID(),
          model: selectedModel.id,
          positivePrompt: prompt,
          width: dims.w, height: dims.h,
          numberResults: 1, outputType: "dataURI", outputFormat: "PNG",
          ...selectedModel.params
        };

        if (selectedLora && selectedModel.supportsLora) {
          task.lora = [{ model: selectedLora, weight: loraWeight }];
          console.log("[LOG] Applying LoRA:", selectedLora);
        }

        const rwRes = await fetch(`/api/runware`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify([task])
        });
        const rwData = await rwRes.json();
        if (rwData?.errors) throw new Error(rwData.errors[0].message);
        finalBase64 = rwData.data?.[0]?.imageURL;
        taskCost = rwData.data?.[0]?.cost || 0;
        console.log("[LOG] Runware fallback success. Cost:", taskCost);
      }

      if (!finalBase64) throw new Error("All engines failed");

      const thumbBase64 = await createThumbnail(finalBase64);
      
      console.log("[LOG] Generating SEO data...");
      let aiMeta = { seo_title: `${selectedStyle} Masterpiece`, seo_description: "Unique wall art.", alt_text: "AI Art", tags: [] };
      try {
        const seoRes = await fetch(`/api/gemini`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            endpoint: 'gemini-flash-latest:generateContent',
            payload: { contents: [{ parts: [{ text: `Generate JSON SEO metadata for ${selectedStyle} ${selectedTheme} poster. Use keys: seo_title, seo_description, alt_text, tags. Return ONLY JSON.` }] }] }
          })
        });
        const seoData = await seoRes.json();
        const rawJson = seoData.candidates[0].content.parts[0].text.replace(/```json/g, '').replace(/```/g, '').trim();
        aiMeta = JSON.parse(rawJson);
        console.log("[LOG] SEO generated successfully");
      } catch (e) {
        console.error("[ERROR] SEO generation failed:", e);
      }

      const tokenUsed = useToken();
      if (!tokenUsed) throw new Error("Token consumption failed");

      console.log("[LOG] Saving product to server...");
      const formData = new FormData();
      formData.append('action', 'generate_and_save');
      formData.append('category', selectedStyle);
      formData.append('price', selectedSize.price.toString());
      formData.append('metadata', JSON.stringify(aiMeta));
      formData.append('mainImage', new Blob([base64ToUint8Array(finalBase64)], { type: 'image/png' }), 'image.png');
      formData.append('thumbnail', new Blob([base64ToUint8Array(thumbBase64)], { type: 'image/jpeg' }), 'thumb.jpg');

      const uploadRes = await fetch('https://api.posterwallart.shop/api.php', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` },
        body: formData,
      });

      const result = await uploadRes.json();
      if (result.success) {
        const productWithCost = { ...result.product, cost: taskCost };
        setRecommendations(p => [productWithCost, ...p.slice(0, 2)]);
        setSelectedProduct(productWithCost);
        console.log("[LOG] Product saved and displayed");
      } else {
        throw new Error(result.error);
      }
    } catch (e: any) {
      console.error("[ERROR] Production flow failed:", e);
      alert(e.message || "An error occurred");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpscaleAndDownload = async (product: Product) => {
    console.log("[LOG] On-demand upscale starting for:", product.id);
    setIsUpscalingId(product.id);
    try {
      const response = await fetch('/api/runware', {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([{
          taskType: 'upscale',
          taskUUID: crypto.randomUUID(),
          inputImage: product.image,
          model: 'runware:501@1',
          upscaleFactor: 2,
          outputType: 'URL',
          outputFormat: 'PNG'
        }])
      });
      if (!response.ok) throw new Error("Upscale API failed");
      const data = await response.json();
      const upscaledUrl = data.data?.[0]?.imageURL;
      const upscaleCost = data.data?.[0]?.cost || 0;
      if (!upscaledUrl) throw new Error("No URL returned from upscale");
      
      console.log(`[LOG] Upscale success. Cost: $${upscaleCost}. Downloading...`);
      const link = document.createElement('a');
      link.href = upscaledUrl;
      link.download = `${product.title}_HighRes.png`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e: any) {
      console.error("[ERROR] Upscale failed:", e);
      alert("Upscale failed: " + e.message);
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

      <div className="flex-1 p-6 flex flex-col relative">
        <div className="flex-1 relative rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-2xl">
          {isAnalyzing ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-zinc-950/90 z-20 backdrop-blur-md">
              <Loader2 className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="font-mono text-[10px] uppercase tracking-widest text-emerald-500">Architectural Analysis...</p>
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
            <div {...roomDrop.getRootProps()} className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-800/50 border-2 border-dashed border-zinc-800 m-8 rounded-3xl transition-all group">
              <input {...roomDrop.getInputProps()} />
              {!user && <Lock className="w-8 h-8 text-zinc-600 mb-2 group-hover:text-white" />}
              <Upload className="w-12 h-12 opacity-20 mb-4 group-hover:opacity-40" />
              <p className="font-mono text-xs uppercase opacity-30 tracking-widest px-12 text-center group-hover:opacity-60">
                {user ? "Step 1: Upload Room Image" : "Please login to proceed"}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className={`w-[480px] border-l border-zinc-800 bg-zinc-950 flex flex-col h-full overflow-y-auto transition-opacity duration-300 ${isInterfaceLocked ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="p-6 space-y-8 pb-24">
          <div className="space-y-2">
            <button
              onClick={handleCreateForMe}
              disabled={isGenerating || !roomImage || (user && tokens <= 0) || isInterfaceLocked}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold uppercase rounded-xl transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)] disabled:opacity-20"
            >
              {isGenerating ? 'DESIGNING...' : 'MAKE ME FEEL SPECIAL'}
            </button>
            {user && (
              <p className="text-center text-[10px] text-zinc-500 font-mono uppercase tracking-tighter">
                Available Tokens: <span className={tokens > 0 ? "text-emerald-500" : "text-red-500"}>{tokens}</span>
              </p>
            )}
          </div>

          <div className="space-y-6">
            <div className="space-y-4">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block">Model & Advanced Settings</label>
              <div className="space-y-3">
                <select value={selectedModel.id} onChange={(e) => setSelectedModel(MODELS.find(m => m.id === e.target.value) || MODELS[0])} className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-xs outline-none">
                  {MODELS.map(m => <option key={m.id} value={m.id}>{m.name} ({m.group})</option>)}
                </select>
                
                {selectedModel.supportsLora && (
                  <div className="flex gap-2">
                    <select value={selectedLora} onChange={(e) => setSelectedLora(e.target.value)} className="flex-1 bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-xs outline-none">
                      <option value="">Select LoRA Style (Optional)</option>
                      {loras.map(l => <option key={l.id} value={`civitai:${l.id}@${l.modelVersions[0].id}`}>{l.name}</option>)}
                    </select>
                    <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 rounded-xl">
                      <Layers className="w-3 h-3 text-zinc-500" />
                      <input type="number" value={loraWeight} onChange={(e) => setLoraWeight(parseFloat(e.target.value))} step="0.1" className="w-12 bg-transparent text-xs outline-none" title="Lora Weight" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block">Category & Theme</label>
              <div className="grid grid-cols-2 gap-2">
                <select value={selectedTheme} onChange={(e) => setSelectedTheme(e.target.value)} className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-xs outline-none">
                  {THEMES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <select value={selectedStyle} onChange={(e) => setSelectedStyle(e.target.value)} className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-xs outline-none">
                  {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block">Dimensions</label>
              <div className="grid grid-cols-3 gap-2">
                {SIZES.map(s => (
                  <button key={s.value} onClick={() => setSelectedSize(s)} className={`p-3 rounded-xl border text-[10px] font-bold transition-all ${selectedSize.value === s.value ? 'bg-zinc-100 text-zinc-900 border-zinc-100' : 'bg-zinc-900 text-zinc-400 border-zinc-800'}`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block">Orientation</label>
                <div className="flex gap-2">
                  {(['portrait', 'landscape'] as const).map(o => (
                    <button key={o} onClick={() => setOrientation(o)} className={`flex-1 py-2 text-[10px] font-bold rounded-lg border capitalize ${orientation === o ? 'bg-zinc-800 text-white border-zinc-700' : 'bg-zinc-950 text-zinc-500 border-zinc-800'}`}>{o}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block">Frame</label>
                <div className="flex gap-2">
                  {(['unframed', 'black', 'oak'] as FrameType[]).map(f => (
                    <button key={f} onClick={() => setSelectedFrame(f)} className={`flex-1 py-2 rounded-lg border flex items-center justify-center ${selectedFrame === f ? 'bg-zinc-800 border-zinc-600' : 'bg-zinc-950 border-zinc-800'}`}>
                      <div className="w-3 h-3 rounded-full border border-zinc-700" style={{ backgroundColor: FRAME_COLORS[f] || '#fff' }}></div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-zinc-900 rounded-2xl border border-zinc-800">
              <span className="text-xs font-medium">Include Poster Text?</span>
              <button onClick={() => setIncludeText(!includeText)} className={`w-10 h-5 rounded-full transition-all ${includeText ? 'bg-emerald-600' : 'bg-zinc-700'} relative`}>
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${includeText ? 'right-1' : 'left-1'}`} />
              </button>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block">Style Reference (Optional)</label>
              <div {...refDrop.getRootProps()} className="border-2 border-dashed border-zinc-800 rounded-2xl p-4 hover:bg-zinc-900 cursor-pointer text-center">
                <input {...refDrop.getInputProps()} />
                {refImage ? <img src={refImage} className="h-16 mx-auto rounded-lg shadow-xl" alt="ref" /> : <p className="text-[10px] text-zinc-600">Drop style reference here</p>}
              </div>
            </div>

            {recommendations.length > 0 && (
              <div className="pt-6 border-t border-zinc-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase italic tracking-tighter flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-500" />
                    AI Artist Selection
                  </h3>
                  <div className="flex items-center gap-1 px-2 py-1 bg-zinc-900 border border-zinc-800 rounded-md">
                    <Info className="w-3 h-3 text-zinc-500" />
                    <span className="text-[8px] text-zinc-500 uppercase tracking-tighter">HD Upscale costs approx. $0.005</span>
                  </div>
                </div>
                {recommendations.map((p) => (
                  <div key={p.id} className={`p-4 border rounded-2xl cursor-pointer transition-all ${selectedProduct?.slug === p.slug ? 'border-emerald-500 bg-zinc-900' : 'border-zinc-800'}`} onClick={() => setSelectedProduct(p)}>
                    <div className="flex gap-4 items-center">
                      <img src={p.thumbnail || p.image} className="w-16 h-16 rounded-lg object-cover" alt={p.title} />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold truncate uppercase italic leading-tight mb-1">{p.title}</h4>
                        <div className="flex flex-col gap-2">
                          <button onClick={(e) => { e.stopPropagation(); addToCart({ ...p, price: p.basePrice, type: 'physical' }); }} className="text-left text-[10px] text-emerald-500 font-bold uppercase tracking-wider hover:text-emerald-400 transition-colors">
                            🛒 Add to cart • ${p.basePrice}
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleUpscaleAndDownload(p); }}
                            disabled={isUpscalingId === p.id}
                            className="text-left text-[10px] text-zinc-400 hover:text-white font-bold uppercase tracking-wider flex items-center gap-1 transition-colors disabled:opacity-50"
                          >
                            {isUpscalingId === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                            {isUpscalingId === p.id ? 'Processing...' : `High-Res Download ${p.cost ? `(Est: $${p.cost.toFixed(4)})` : ''}`}
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
      </div>
    </div>
  );
}
