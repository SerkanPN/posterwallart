import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, Wand2, Image as ImageIcon, Sparkles, ShoppingBag, Maximize2, Palette, Type, Layout, Lock, Loader2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabase';
import { InteractiveCanvas } from '../components/InteractiveCanvas';
import { AuthModal } from '../components/AuthModal';

type SizeType = '8x10' | '11x14' | '16x20' | '18x24' | '20x30' | '24x36';
type FrameType = 'unframed' | 'black' | 'oak';

interface Product {
  id: string; title: string; basePrice: number; image: string; category: string; description: string; isGenerated?: boolean; slug?: string; thumbnail?: string;
}

const SIZES = [
  { label: '8x10"', price: 22, value: '8x10' },
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

const base64ToUint8Array = (base64Data: string) => {
  const parts = base64Data.split(';base64,');
  const base64String = parts[1];
  const binaryString = atob(base64String);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

const createThumbnail = (base64: string, maxWidth = 400): Promise<string> => {
  return new Promise((resolve) => {
    console.log("[LOG] Creating thumbnail...");
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      } else {
        resolve(base64);
      }
      img.src = '';
    };
    img.src = base64;
  });
};

export function Home() {
  const { user, tokens, setTokens, addToCart, setAuthModalOpen, useToken } = useStore();
  
  const [roomImage, setRoomImage] = useState<string | null>(null);
  const [refImage, setRefImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
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
    console.log("[LOG] Room image drop detected.");
    if (!user) {
      console.warn("[LOG] User not logged in, opening AuthModal.");
      setAuthModalOpen(true);
      return;
    }
    const file = acceptedFiles[0];
    if (file) {
      console.log("[LOG] File received:", file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setRoomImage(base64);
        console.log("[LOG] Room image base64 generated, starting analysis...");
        analyzeRoom(base64);
      };
      reader.readAsDataURL(file);
    }
  }, [user, setAuthModalOpen]);

  const onDropRef = useCallback((acceptedFiles: File[]) => {
    console.log("[LOG] Reference image drop detected.");
    const file = acceptedFiles[0];
    if (file) {
      console.log("[LOG] Reference file received:", file.name);
      const reader = new FileReader();
      reader.onload = (e) => setRefImage(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  }, []);

  const roomDrop = useDropzone({ onDrop: onDropRoom, accept: { 'image/*': [] }, maxFiles: 1 });
  const refDrop = useDropzone({ onDrop: onDropRef, accept: { 'image/*': [] }, maxFiles: 1 });

  const analyzeRoom = async (base64Image: string) => {
    console.log("[LOG] Initiating Gemini Room Analysis...");
    setIsAnalyzing(true);
    setAnalysisData(null);
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [
            { text: "Analyze room for scale. Return PPI (5-10) and perspective. Return ONLY JSON: { \"ppi\": number, \"rotateY\": number, \"skewY\": number, \"detectedStyle\": \"string\" }" },
            { inlineData: { mimeType: "image/jpeg", data: base64Image.split(',')[1] } }
          ]}]
        })
      });
      if (response.ok) {
        const res = await response.json();
        const rawText = res.candidates[0].content.parts[0].text;
        console.log("[LOG] Gemini Raw Response:", rawText);
        const data = JSON.parse(rawText.replace(/```json/g, '').replace(/```/g, '').trim());
        setAnalysisData(data);
        console.log("[LOG] Analysis data parsed successfully:", data);
      } else {
        console.error("[ERROR] Gemini Analysis API returned status:", response.status);
      }
    } catch (e) {
      console.error("[ERROR] Room analysis failed:", e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCreateForMe = async () => {
    console.log("[LOG] 'Make Me Feel Special' triggered.");
    if (!user) {
      console.warn("[LOG] No user session found.");
      setAuthModalOpen(true);
      return;
    }

    console.log("[LOG] Current tokens in store:", tokens);
    if (tokens <= 0) {
      console.warn("[LOG] Insufficient tokens detected in client store.");
      alert("Insufficient tokens! Please refill your balance.");
      return;
    }

    if (isGenerating || isInterfaceLocked) {
      console.warn("[LOG] Action blocked: Generating or Interface Locked.");
      return;
    }

    console.log("[LOG] Starting generation process...");
    setIsGenerating(true);
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    try {
      // 1. Get Supabase session token for API authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        alert("Session expired. Please log in again.");
        setAuthModalOpen(true);
        return;
      }
      const accessToken = session.access_token;
      console.log("[LOG] Supabase session token retrieved.");

      // 2. Generate image
      const dynamicAR = calculateAspectRatio(selectedSize.value, orientation);
      console.log(`[LOG] Selected Size: ${selectedSize.value}, Orientation: ${orientation}, Calculated Aspect Ratio: ${dynamicAR}`);

      const prompt = `You are a world-class master artist and elite visual designer specializing in premium wall art.
      CORE OBJECTIVE: Create a visually stunning, ultra-detailed, high-end wall art composition that fully utilizes the canvas with ZERO empty borders.
      STYLE: ${selectedStyle}, THEME: ${selectedTheme}, ORIENTATION: ${orientation}, ASPECT RATIO: ${dynamicAR}.
      TEXT: ${includeText ? 'Include minimal typography.' : 'NO text.'}
      RESOLUTION: 1024px.`;

      const contents: any = [{ parts: [{ text: prompt }] }];
      if (refImage) {
        console.log("[LOG] Including reference image in prompt.");
        contents[0].parts.push({ inlineData: { mimeType: "image/jpeg", data: refImage.split(',')[1] } });
      }

      console.log("[LOG] Requesting Image Generation from Gemini 3.1...");
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents })
      });

      if (!response.ok) throw new Error("Image generation API failed: " + response.status);

      const res = await response.json();
      const imgPart = res.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);

      if (imgPart?.inlineData) {
        console.log("[LOG] Image data received successfully.");
        let base64Image = `data:image/png;base64,${imgPart.inlineData.data}`;
        let thumbnailBase64 = await createThumbnail(base64Image);

        // 3. SEO metadata
        let aiMeta: any = {
          seo_title: `${selectedStyle} Masterpiece`,
          seo_description: "A beautiful AI-generated artwork.",
          alt_text: "AI poster",
          tags: ["art", selectedStyle.toLowerCase()]
        };

        console.log("[LOG] Fetching AI SEO Metadata...");
        try {
          const seoRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: `Generate SEO title, description, alt text, tags for ${selectedStyle} ${selectedTheme} poster. Return ONLY JSON with keys: seo_title, seo_description, alt_text, tags.` }] }]
            })
          });
          if (seoRes.ok) {
            const seoData = await seoRes.json();
            aiMeta = JSON.parse(seoData.candidates[0].content.parts[0].text.replace(/```json/g, '').replace(/```/g, '').trim());
            console.log("[LOG] SEO Meta generated:", aiMeta);
          }
        } catch (e) { console.warn("[LOG] SEO Meta generation skipped or failed."); }

        // 4. Deduct token via Supabase (useStore handles this)
        const tokenUsed = await useToken();
        if (!tokenUsed) {
          throw new Error("Failed to deduct token. Please try again.");
        }
        console.log("[LOG] Token deducted via Supabase.");

        // 5. Upload to API with Authorization header
        console.log("[LOG] Preparing Blobs for upload...");
        const mainBlob = new Blob([base64ToUint8Array(base64Image)], { type: 'image/png' });
        const thumbBlob = new Blob([base64ToUint8Array(thumbnailBase64)], { type: 'image/jpeg' });

        const formData = new FormData();
        formData.append('action', 'generate_and_save');
        formData.append('category', selectedStyle);
        formData.append('price', selectedSize.price.toString());
        formData.append('metadata', JSON.stringify(aiMeta));
        formData.append('mainImage', mainBlob, 'main.png');
        formData.append('thumbnail', thumbBlob, 'thumb.jpg');

        console.log("[LOG] Uploading to SECURE API: https://api.posterwallart.shop/api.php");
        const uploadRes = await fetch('https://api.posterwallart.shop/api.php', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
          body: formData,
        });

        const result = await uploadRes.json();
        console.log("[LOG] Server response received:", result);

        if (result.success) {
          console.log("[LOG] Product saved successfully. New Product ID:", result.product.id);
          setRecommendations(prev => [result.product, ...prev.slice(0, 2)]);
          setSelectedProduct(result.product);
        } else {
          console.error("[LOG] Server rejected the request:", result.error);
          throw new Error(result.error);
        }
      } else {
        throw new Error("Image data returned empty from API.");
      }
    } catch (e: any) {
      console.error("[ERROR] Generation flow caught an error:", e);
      alert(e.message || "An error occurred.");
    } finally {
      setIsGenerating(false);
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
                {refImage ? <img src={refImage} className="h-16 mx-auto rounded-lg shadow-xl" /> : <p className="text-[10px] text-zinc-600">Drop style reference here</p>}
              </div>
            </div>

            {recommendations.length > 0 && (
              <div className="pt-6 border-t border-zinc-800 space-y-4">
                <h3 className="text-sm font-bold uppercase italic tracking-tighter">AI Artist Selection</h3>
                {recommendations.map((p) => (
                  <div key={p.id} className={`p-4 border rounded-2xl cursor-pointer transition-all ${selectedProduct?.slug === p.slug ? 'border-emerald-500 bg-zinc-900' : 'border-zinc-800'}`} onClick={() => setSelectedProduct(p)}>
                    <div className="flex gap-4 items-center">
                      <img src={p.thumbnail || p.image} className="w-14 h-14 rounded-lg object-cover" />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold truncate uppercase italic">{p.title}</h4>
                        <button onClick={(e) => { e.stopPropagation(); addToCart({ ...p, price: p.basePrice, type: 'physical' }); }} className="text-[10px] text-emerald-500 font-bold mt-1 uppercase tracking-wider">Add to cart • ${p.basePrice}</button>
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
