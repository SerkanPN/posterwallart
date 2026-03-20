import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, Wand2, Image as ImageIcon, Sparkles, ShoppingBag, Maximize2, Palette, Type, Layout, Lock, Loader2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { InteractiveCanvas } from '../components/InteractiveCanvas';
import { supabase } from '../lib/supabase';
import { AuthModal } from '../components/AuthModal';

type SizeType = '8x10' | '11x14' | '16x20' | '18x24' | '20x30' | '24x36';
type FrameType = 'unframed' | 'black' | 'oak';

interface Product {
  id: string; title: string; basePrice: number; image: string; category: string; description: string; isGenerated?: boolean; slug?: string;
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

export function Home() {
  const { user, tokens, useToken, addToCart, setAuthModalOpen } = useStore();
  
  const [roomImage, setRoomImage] = useState<string | null>(null);
  const [refImage, setRefImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [selectedSize, setSelectedSize] = useState(SIZES[SIZES.length-1]);
  const [selectedStyle, setSelectedStyle] = useState('Minimalist');
  const [selectedTheme, setSelectedTheme] = useState('Abstract');
  const [includeText, setIncludeText] = useState(false);
  const [selectedFrame, setSelectedFrame] = useState<FrameType>('unframed');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [analysisData, setAnalysisData] = useState<any>(null);

  const onDropRoom = useCallback((acceptedFiles: File[]) => {
    if (!user) { setAuthModalOpen(true); return; }
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setRoomImage(base64);
        analyzeRoom(base64);
      };
      reader.readAsDataURL(file);
    }
  }, [user, setAuthModalOpen]);

  const onDropRef = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setRefImage(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  }, []);

  const roomDrop = useDropzone({ onDrop: onDropRoom, accept: { 'image/*': [] }, maxFiles: 1 });
  const refDrop = useDropzone({ onDrop: onDropRef, accept: { 'image/*': [] }, maxFiles: 1 });

  const analyzeRoom = async (base64Image: string) => {
    setIsAnalyzing(true);
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
        const data = JSON.parse(res.candidates[0].content.parts[0].text.replace(/```json/g, '').replace(/```/g, '').trim());
        setAnalysisData(data);
      }
    } catch (e) { console.error("Room analysis failed:", e); } finally { setIsAnalyzing(false); }
  };

  const handleCreateForMe = async () => {
    if (!user) { setAuthModalOpen(true); return; }
    if (tokens <= 0) { alert("Insufficient tokens! Please refill your balance."); return; }
    if (!analysisData || isGenerating) return;

    setIsGenerating(true);
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    try {
      await useToken();

      const ar = orientation === 'portrait' ? '9:16 portrait' : '16:9 landscape';
      const prompt = `Act as a world-class 4K abstract painter. 
      OBJECTIVE: Create a high-end, aesthetic, modern digital painting that EXACTLY fits a ${ar} aspect ratio. 
      MANDATORY: Fill the entire frame. No borders.
      USER PREFERENCES: Style: ${selectedStyle}, Theme: ${selectedTheme}, Text: ${includeText ? 'Add minimal typography' : 'Strictly NO text'}.
      Resolution: 4K.
      ${refImage ? 'INSPIRED BY: Match color vibe of reference image.' : ''}`;

      const contents: any = [{ parts: [{ text: prompt }] }];
      if (refImage) contents[0].parts.push({ inlineData: { mimeType: "image/jpeg", data: refImage.split(',')[1] } });

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents })
      });

      if (!response.ok) throw new Error("Image generation failed");

      const res = await response.json();
      const imgPart = res.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);

      if (imgPart?.inlineData) {
        const base64Image = `data:image/png;base64,${imgPart.inlineData.data}`;
        
        // --- HIZLI EKRAN GÜNCELLEMESİ (UX İYİLEŞTİRMESİ) ---
        const tempId = `temp-${Date.now()}`;
        const tempProduct = { 
          id: tempId, 
          title: "Crafting details...", 
          image: base64Image, 
          basePrice: selectedSize.price, 
          category: selectedStyle,
          description: "AI is writing the story...",
          isGenerated: true,
          slug: tempId
        };

        // Görseli hemen ekrana bas ve spinner'ı durdur
        setRecommendations(prev => [tempProduct, ...prev.slice(0, 2)]);
        setSelectedProduct(tempProduct);
        setIsGenerating(false);

        // --- ARKA PLANDA SEO ÜRETİMİ VE VERİTABANI KAYDI ---
        (async () => {
          let aiMeta = { 
            title: `${selectedStyle} Masterpiece`, 
            description: "A beautiful AI-generated artwork.", 
            alt_text: "AI poster", 
            tags: ["art", selectedStyle.toLowerCase()] 
          };

          try {
            const seoRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: `Create a professional SEO title, a 2-sentence description, alt text, and tags for a ${selectedStyle} poster with theme ${selectedTheme}. Return ONLY valid JSON: { "title": "...", "description": "...", "alt_text": "...", "tags": ["..."] }` }] }]
              })
            });
            
            if (seoRes.ok) {
              const seoData = await seoRes.json();
              if (seoData.candidates && seoData.candidates[0]) {
                 aiMeta = JSON.parse(seoData.candidates[0].content.parts[0].text.replace(/```json/g, '').replace(/```/g, '').trim());
              }
            }
          } catch (e) { console.error("SEO Gen failed, using defaults", e); }

          const now = new Date();
          const dateStr = now.toISOString().split('T')[0];
          const hourStr = now.getHours().toString().padStart(2, '0');
          const slugBase = `${aiMeta.title} ${selectedStyle} Poster Wall Art ${dateStr} ${hourStr}`;
          const slug = slugBase.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

          const { data: newProduct, error: supabaseError } = await supabase
            .from('products')
            .insert([{
              creator_id: user.id,
              title: aiMeta.title,
              description: aiMeta.description,
              alt_text: aiMeta.alt_text,
              tags: aiMeta.tags,
              image_url: base64Image,
              category: selectedStyle,
              slug: slug,
              price: 49.00,
              stock: -1,
              is_private: false
            }])
            .select().single();

          if (supabaseError) {
             console.error("Supabase Insert Error:", supabaseError);
          } else if (newProduct) {
             // Veritabanı kaydı bittiğinde, geçici ürünü gerçek bilgilerle sessizce güncelle
             const finalProduct = { 
                id: newProduct.id, 
                title: aiMeta.title, 
                image: base64Image, 
                basePrice: selectedSize.price, 
                category: selectedStyle,
                description: aiMeta.description,
                isGenerated: true,
                slug: slug
             };
             
             setRecommendations(prev => prev.map(p => p.id === tempId ? finalProduct : p));
             setSelectedProduct(current => current?.id === tempId ? finalProduct : current);
          }
        })(); // Asenkron fonksiyon bitti
      } else {
        setIsGenerating(false); // Görsel verisi gelmezse de spinner'ı kapat
      }
    } catch (e) { 
      console.error(e); 
      alert("Failed to generate image. Please check your API token or try again.");
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
          ) : roomImage && analysisData ? (
            <InteractiveCanvas 
              backgroundImage={roomImage} 
              mountedArt={selectedProduct?.image || null} 
              physicalWidth={physicalWidth}
              physicalHeight={physicalHeight}
              naturalPixelsPerInch={analysisData.ppi}
              frameColor={(FRAME_COLORS as any)[selectedFrame]}
              perspective={{ rotateY: analysisData.rotateY, skewY: analysisData.skewY }}
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

      <div className="w-[480px] border-l border-zinc-800 bg-zinc-950 flex flex-col h-full overflow-y-auto">
        <div className="p-6 space-y-8 pb-24">
          <div className="space-y-2">
            <button 
              onClick={handleCreateForMe}
              disabled={isGenerating || !roomImage || (user && tokens <= 0)}
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
                <select value={selectedTheme} onChange={(e)=>setSelectedTheme(e.target.value)} className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-xs outline-none">
                  {THEMES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <select value={selectedStyle} onChange={(e)=>setSelectedStyle(e.target.value)} className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-xs outline-none">
                  {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block">Dimensions</label>
              <div className="grid grid-cols-3 gap-2">
                {SIZES.map(s => (
                  <button key={s.value} onClick={()=>setSelectedSize(s)} className={`p-3 rounded-xl border text-[10px] font-bold transition-all ${selectedSize.value === s.value ? 'bg-zinc-100 text-zinc-900 border-zinc-100' : 'bg-zinc-900 text-zinc-400 border-zinc-800'}`}>
                    {s.label}<br/><span className="opacity-50">${s.price}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block">Orientation</label>
                <div className="flex gap-2">
                  {(['portrait', 'landscape'] as const).map(o => (
                    <button key={o} onClick={()=>setOrientation(o)} className={`flex-1 py-2 text-[10px] font-bold rounded-lg border capitalize ${orientation === o ? 'bg-zinc-800 text-white border-zinc-700' : 'bg-zinc-950 text-zinc-500 border-zinc-800'}`}>{o}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block">Frame</label>
                <div className="flex gap-2">
                  {(['unframed', 'black', 'oak'] as FrameType[]).map(f => (
                    <button key={f} onClick={()=>setSelectedFrame(f)} className={`flex-1 py-2 rounded-lg border flex items-center justify-center ${selectedFrame === f ? 'bg-zinc-800 border-zinc-600' : 'bg-zinc-950 border-zinc-800'}`}>
                      <div className="w-3 h-3 rounded-full border border-zinc-700" style={{ backgroundColor: FRAME_COLORS[f] || '#fff' }}></div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-zinc-900 rounded-2xl border border-zinc-800">
              <span className="text-xs font-medium">Include Poster Text?</span>
              <button onClick={()=>setIncludeText(!includeText)} className={`w-10 h-5 rounded-full transition-all ${includeText ? 'bg-emerald-600' : 'bg-zinc-700'} relative`}>
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
                  <div key={p.id} className={`p-4 border rounded-2xl cursor-pointer transition-all ${selectedProduct?.slug === p.slug ? 'border-emerald-500 bg-zinc-900' : 'border-zinc-800'}`} onClick={()=>setSelectedProduct(p)}>
                    <div className="flex gap-4 items-center">
                      <img src={p.image} className="w-14 h-14 rounded-lg object-cover" />
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
