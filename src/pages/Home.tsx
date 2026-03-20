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
  const { user, tokens, useToken, addToCart } = useStore();
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
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const onDropRoom = useCallback((acceptedFiles: File[]) => {
    if (!user) { setIsAuthModalOpen(true); return; }
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
  }, [user]);

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
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [
            { text: "Analyze room for scale. Return PPI (5-10) and perspective. Return ONLY JSON: { \"ppi\": number, \"rotateY\": number, \"skewY\": number, \"detectedStyle\": \"string\" }" },
            { inlineData: { mimeType: "image/jpeg", data: base64Image.split(',')[1] } }
          ]}]
        })
      });
      const res = await response.json();
      const data = JSON.parse(res.candidates[0].content.parts[0].text.replace(/```json/g, '').replace(/```/g, '').trim());
      setAnalysisData(data);
    } catch (e) { console.error(e); } finally { setIsAnalyzing(false); }
  };

  const handleCreateForMe = async () => {
    if (!user) { setIsAuthModalOpen(true); return; }
    if (tokens <= 0) { alert("Insufficient tokens!"); return; }
    if (!analysisData || isGenerating) return;

    setIsGenerating(true);
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    try {
      await useToken();
      const prompt = `Act as a world-class 4K abstract painter. Style: ${selectedStyle}, Theme: ${selectedTheme}.`;
      const contents: any = [{ parts: [{ text: prompt }] }];
      if (refImage) contents[0].parts.push({ inlineData: { mimeType: "image/jpeg", data: refImage.split(',')[1] } });

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents })
      });

      const res = await response.json();
      const imgPart = res.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);

      if (imgPart?.inlineData) {
        const base64Image = `data:image/png;base64,${imgPart.inlineData.data}`;
        let aiMeta = { title: "AI Masterpiece", description: "", alt_text: "", tags: [] };
        try {
          const seoRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: `Generate metadata for ${selectedStyle} ${selectedTheme} poster. Return JSON.` }] }] })
          });
          const seoData = await seoRes.json();
          aiMeta = JSON.parse(seoData.candidates[0].content.parts[0].text.replace(/```json/g, '').replace(/```/g, '').trim());
        } catch (e) {}

        const now = new Date();
        const slug = `${aiMeta.title}-${selectedStyle}-${Date.now()}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');

        const { data: newProduct } = await supabase.from('products').insert([{ creator_id: user.id, title: aiMeta.title, description: aiMeta.description, image_url: base64Image, category: selectedStyle, slug: slug, price: 49.00, stock: -1, is_private: false }]).select().single();

        const product = { id: newProduct?.id || Date.now().toString(), title: aiMeta.title, image: base64Image, basePrice: selectedSize.price, category: selectedStyle, description: aiMeta.description, isGenerated: true, slug: slug };
        setRecommendations([product, ...recommendations.slice(0, 2)]);
        setSelectedProduct(product);
      }
    } catch (e) { console.error(e); } finally { setIsGenerating(false); }
  };

  const [pw, ph] = selectedSize.value.split('x').map(Number);
  const physicalWidth = orientation === 'portrait' ? pw : ph;
  const physicalHeight = orientation === 'portrait' ? ph : pw;

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-zinc-950 text-zinc-50 overflow-hidden font-sans">
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <div className="flex-1 p-6 flex flex-col relative">
        <div className="flex-1 relative rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-2xl">
          {isAnalyzing ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-zinc-950/90 z-20 backdrop-blur-md">
              <Loader2 className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="font-mono text-[10px] uppercase tracking-widest text-emerald-500">Architectural Analysis...</p>
            </div>
          ) : roomImage && analysisData ? (
            <InteractiveCanvas backgroundImage={roomImage} mountedArt={selectedProduct?.image || null} physicalWidth={physicalWidth} physicalHeight={physicalHeight} naturalPixelsPerInch={analysisData.ppi} frameColor={(FRAME_COLORS as any)[selectedFrame]} perspective={{ rotateY: analysisData.rotateY, skewY: analysisData.skewY }} />
          ) : (
            <div {...roomDrop.getRootProps()} className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-800/50 border-2 border-dashed border-zinc-800 m-8 rounded-3xl transition-all group">
              <input {...roomDrop.getInputProps()} />
              {!user && <Lock className="w-8 h-8 text-zinc-600 mb-2 group-hover:text-white" />}
              <Upload className="w-12 h-12 opacity-20 mb-4 group-hover:opacity-40" />
              <p className="font-mono text-xs uppercase opacity-30 tracking-widest px-12 text-center group-hover:opacity-60">{user ? "Step 1: Upload Room Image" : "Please login to proceed"}</p>
            </div>
          )}
        </div>
      </div>
      <div className="w-[480px] border-l border-zinc-800 bg-zinc-950 flex flex-col h-full overflow-y-auto p-6 space-y-8 pb-24">
        <button onClick={handleCreateForMe} disabled={isGenerating || !roomImage} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold uppercase rounded-xl transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)] disabled:opacity-20">
          {isGenerating ? 'DESIGNING...' : 'MAKE ME FEEL SPECIAL'}
        </button>
        <div className="grid grid-cols-2 gap-2">
          <select value={selectedTheme} onChange={(e)=>setSelectedTheme(e.target.value)} className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-xs outline-none">{THEMES.map(t => <option key={t} value={t}>{t}</option>)}</select>
          <select value={selectedStyle} onChange={(e)=>setSelectedStyle(e.target.value)} className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-xs outline-none">{STYLES.map(s => <option key={s} value={s}>{s}</option>)}</select>
        </div>
        <div className="grid grid-cols-3 gap-2">{SIZES.map(s => <button key={s.value} onClick={()=>setSelectedSize(s)} className={`p-3 rounded-xl border text-[10px] font-bold transition-all ${selectedSize.value === s.value ? 'bg-zinc-100 text-zinc-900 border-zinc-100' : 'bg-zinc-900 text-zinc-400 border-zinc-800'}`}>{s.label}<br/><span className="opacity-50">${s.price}</span></button>)}</div>
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
  );
}
