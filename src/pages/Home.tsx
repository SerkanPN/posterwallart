import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, Wand2, Image as ImageIcon, Sparkles, ShoppingBag, Maximize2, Palette, Type, Layout } from 'lucide-react';
import { useStore } from '../store/useStore';
import { InteractiveCanvas } from '../components/InteractiveCanvas';

// VERİ SETLERİ
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
  const { user, addToCart } = useStore();
  const [roomImage, setRoomImage] = useState<string | null>(null);
  const [refImage, setRefImage] = useState<string | null>(null); // Örnek poster
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // KULLANICI SEÇİMLERİ (UI)
  const [selectedSize, setSelectedSize] = useState(SIZES[SIZES.length-1]); // Varsayılan 24x36
  const [selectedStyle, setSelectedStyle] = useState('Minimalist');
  const [selectedTheme, setSelectedTheme] = useState('Abstract');
  const [includeText, setIncludeText] = useState(false);
  const [selectedFrame, setSelectedFrame] = useState('unframed');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  const [analysisData, setAnalysisData] = useState<any>(null);

  // ODA FOTOĞRAFI YÜKLEME
  const onDropRoom = useCallback((acceptedFiles: File[]) => {
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
  }, []);

  // ÖRNEK POSTER YÜKLEME
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
            { text: "Analyze room objects for scale. Return PPI for the focal wall (range 4-10) and perspective (rotateY -15 to 15). Detect style and mood. Return ONLY JSON: { \"ppi\": number, \"rotateY\": number, \"skewY\": number, \"detectedStyle\": \"string\" }" },
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
    if (!analysisData || isGenerating) return;
    setIsGenerating(true);
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    try {
      const prompt = `Act as a professional poster designer.
      OBJECTIVE: Create a ${orientation} artwork.
      USER PREFERENCES: Style: ${selectedStyle}, Theme: ${selectedTheme}, metin: ${includeText ? 'Add aesthetic minimal typography' : 'Strictly NO text'}.
      COMPOSITION: Leave a 'safe area' (padding) around the main elements so it fits any aspect ratio.
      ${refImage ? 'INSPIRED BY: User provided an example image, match its vibe and composition style.' : ''}
      OUTPUT: High-end, Pinterest-worthy digital art file only.`;

      const contents = [{ parts: [{ text: prompt }] }];
      if (refImage) contents[0].parts.push({ inlineData: { mimeType: "image/jpeg", data: refImage.split(',')[1] } } as any);

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents })
      });

      const res = await response.json();
      const imgPart = res.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);

      if (imgPart?.inlineData) {
        const newArt = `data:image/png;base64,${imgPart.inlineData.data}`;
        const product = { id: Date.now().toString(), title: `Custom ${selectedTheme}`, image: newArt, basePrice: selectedSize.price, description: `${selectedStyle} masterpiece.` };
        setRecommendations([product, ...recommendations]);
        setSelectedProduct(product);
      }
    } catch (e) { console.error(e); } finally { setIsGenerating(false); }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-zinc-950 text-zinc-50 overflow-hidden font-sans">
      {/* SOL: CANVAS ALANI */}
      <div className="flex-1 p-6 flex flex-col relative">
        <div className="flex-1 relative rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-2xl">
          {isAnalyzing ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-zinc-950/90 z-20 backdrop-blur-md">
              <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="font-mono text-[10px] uppercase tracking-widest">Architectural Analysis...</p>
            </div>
          ) : roomImage && analysisData ? (
            <InteractiveCanvas 
              backgroundImage={roomImage} 
              mountedArt={selectedProduct?.image || null} 
              physicalWidth={orientation === 'portrait' ? Number(selectedSize.value.split('x')[0]) : Number(selectedSize.value.split('x')[1])}
              physicalHeight={orientation === 'portrait' ? Number(selectedSize.value.split('x')[1]) : Number(selectedSize.value.split('x')[0])}
              naturalPixelsPerInch={analysisData.ppi}
              frameColor={(FRAME_COLORS as any)[selectedFrame]}
              perspective={{ rotateY: analysisData.rotateY, skewY: analysisData.skewY }}
            />
          ) : (
            <div {...roomDrop.getRootProps()} className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-800/50 border-2 border-dashed border-zinc-800 m-8 rounded-3xl transition-all">
              <input {...roomDrop.getInputProps()} />
              <Upload className="w-12 h-12 opacity-20 mb-4" />
              <p className="font-mono text-xs uppercase opacity-30 tracking-widest px-12 text-center">Step 1: Upload Room Image</p>
            </div>
          )}
        </div>
      </div>

      {/* SAĞ: KONTROL PANELİ */}
      <div className="w-[480px] border-l border-zinc-800 bg-zinc-950 flex flex-col h-full overflow-y-auto custom-scrollbar">
        <div className="p-6 space-y-8">
          <div className="flex flex-col gap-4">
            <button 
              onClick={handleCreateForMe}
              disabled={isGenerating || !roomImage}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold uppercase rounded-xl transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)] disabled:opacity-20"
            >
              {isGenerating ? 'DESIGNING...' : 'MAKE ME FEEL SPECIAL'}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 pb-20">
            {/* STİL & TEMA SEÇİMİ */}
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500"><Layout className="w-3 h-3"/> Category & Theme</label>
              <div className="grid grid-cols-2 gap-2">
                <select value={selectedTheme} onChange={(e)=>setSelectedTheme(e.target.value)} className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-xs outline-none">
                  {THEMES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <select value={selectedStyle} onChange={(e)=>setSelectedStyle(e.target.value)} className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-xs outline-none">
                  {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* BOYUT SEÇİMİ */}
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500"><Maximize2 className="w-3 h-3"/> Choose Dimensions</label>
              <div className="grid grid-cols-3 gap-2">
                {SIZES.map(s => (
                  <button key={s.value} onClick={()=>setSelectedSize(s)} className={`p-3 rounded-xl border text-[10px] font-bold transition-all ${selectedSize.value === s.value ? 'bg-zinc-100 text-zinc-900 border-zinc-100' : 'bg-zinc-900 text-zinc-400 border-zinc-800'}`}>
                    {s.label}<br/><span className="opacity-50">${s.price}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* TYPOGRAPHY CONTROL */}
            <div className="flex items-center justify-between p-4 bg-zinc-900 rounded-2xl border border-zinc-800">
              <div className="flex items-center gap-3">
                <Type className="w-4 h-4 text-zinc-400" />
                <span className="text-xs font-medium">Include Poster Text?</span>
              </div>
              <button onClick={()=>setIncludeText(!includeText)} className={`w-10 h-5 rounded-full transition-all ${includeText ? 'bg-emerald-600' : 'bg-zinc-700'} relative`}>
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${includeText ? 'right-1' : 'left-1'}`} />
              </button>
            </div>

            {/* REFERANS GÖRSEL YÜKLEME */}
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500"><ImageIcon className="w-3 h-3"/> Reference (Optional)</label>
              <div {...refDrop.getRootProps()} className="border-2 border-dashed border-zinc-800 rounded-2xl p-4 hover:bg-zinc-900 cursor-pointer transition-all text-center">
                <input {...refDrop.getInputProps()} />
                {refImage ? <img src={refImage} className="h-20 mx-auto rounded-lg shadow-xl" /> : <p className="text-[10px] text-zinc-600">Drop an image to match its style</p>}
              </div>
            </div>

            {/* ÖNERİLER (ANALİZDEN SONRA) */}
            {recommendations.length > 0 && (
              <div className="pt-6 border-t border-zinc-800 space-y-4">
                <h3 className="text-sm font-bold flex items-center gap-2"><Sparkles className="w-4 h-4 text-indigo-400"/> AI Artist Selection</h3>
                {recommendations.map((p) => (
                  <div key={p.id} className={`p-4 border rounded-2xl cursor-pointer transition-all ${selectedProduct?.id === p.id ? 'border-emerald-500 bg-zinc-900' : 'border-zinc-800'}`} onClick={()=>setSelectedProduct(p)}>
                    <div className="flex gap-4 items-center">
                      <img src={p.image} className="w-16 h-16 rounded-xl object-cover border border-zinc-800" />
                      <div>
                        <h4 className="text-xs font-bold">{p.title}</h4>
                        <p className="text-[10px] text-zinc-500 mt-1">${(p.basePrice).toFixed(2)} - Free Shipping</p>
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
