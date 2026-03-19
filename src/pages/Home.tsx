import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'motion/react';
import { Upload, Wand2, Image as ImageIcon, Sparkles, ShoppingBag, Maximize2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { InteractiveCanvas } from '../components/InteractiveCanvas';

type SizeType = '12x18' | '18x24' | '24x36';
type FrameType = 'unframed' | 'black' | 'oak';

interface Product {
  id: string;
  title: string;
  basePrice: number;
  image: string;
  category: string;
  description: string;
  isGenerated?: boolean;
}

// Sağ paneldeki orijinal 3 poster önerisi
const MOCK_RECOMMENDATIONS: Product[] = [
  { id: 'rec1', title: 'Dark Side of the Moon - Prism', basePrice: 45, image: 'https://picsum.photos/seed/cyberpunk/800/1200', category: 'Cyberpunk', description: 'The room has a strong music theme with the wall decal...' },
  { id: 'rec2', title: 'Pulp Fiction - The Dance', basePrice: 35, image: 'https://picsum.photos/seed/minimalist/800/1200', category: 'Minimalist', description: 'The room\'s black, white, and yellow color scheme...' },
  { id: 'rec3', title: 'Electric Stripe Symphony', basePrice: 55, image: 'https://picsum.photos/seed/renaissance/800/1200', category: 'Renaissance', description: 'A custom poster featuring a minimalist electric guitar...' },
];

const SIZE_MULTIPLIERS = { '12x18': 1, '18x24': 1.5, '24x36': 2.2 };
const FRAME_PRICES = { 'unframed': 0, 'black': 20, 'oak': 25 };
const FRAME_COLORS = { 'unframed': null, 'black': '#18181b', 'oak': '#8b5a2b' };

export function Home() {
  const { user, useToken, addToCart } = useStore();
  const [roomImage, setRoomImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState<Product[]>(MOCK_RECOMMENDATIONS);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [analysisData, setAnalysisData] = useState<{ ppi: number; rotateY: number; skewY: number; style: string; colors: string[]; mood: string; } | null>(null);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<SizeType>('24x36');
  const [selectedFrame, setSelectedFrame] = useState<FrameType>('unframed');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  const onDrop = useCallback((acceptedFiles: File[]) => {
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

  const { getRootProps, getInputProps } = useDropzone({ onDrop, accept: { 'image/*': [] }, maxFiles: 1 } as any);

  const analyzeRoom = async (base64Image: string) => {
    setIsAnalyzing(true);
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: "Analyze room. Return ONLY JSON: { \"pixelsPerInch\": number, \"rotateY\": number, \"skewY\": number, \"style\": \"string\", \"colors\": [\"hex\"], \"mood\": \"string\" }" },
              { inlineData: { mimeType: "image/jpeg", data: base64Image.split(',')[1] } }
            ]
          }]
        })
      });

      const result = await response.json();
      const data = JSON.parse(result.candidates[0].content.parts[0].text.replace(/```json/g, '').replace(/```/g, '').trim());

      setAnalysisData({ ppi: data.pixelsPerInch || 6, rotateY: data.rotateY || 0, skewY: data.skewY || 0, style: data.style, colors: data.colors, mood: data.mood });
    } catch (e) {
      console.error("Analiz hatası:", e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCreateForMe = async () => {
    if (!roomImage || !analysisData || isGenerating) return;
    setIsGenerating(true);
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    try {
      const prompt = `You are a world-class AI artist. Context: Style ${analysisData.style}, Mood ${analysisData.mood}, Colors ${analysisData.colors.join(', ')}.
      GENERATE ONLY THE POSTER ARTWORK ITSELF. 
      - DO NOT include walls, rooms, frames, or furniture. 
      - The output must be a flat image file of the art only. 
      - Style: modern, aesthetic, Pinterest-worthy, Instagrammable.`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });

      const result = await response.json();
      const imgPart = result.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);

      if (imgPart?.inlineData) {
        const newArt = `data:image/png;base64,${imgPart.inlineData.data}`;
        const newProduct: Product = {
          id: `gen_${Date.now()}`,
          title: 'Custom AI Masterpiece',
          basePrice: 65,
          image: newArt,
          category: analysisData.style,
          description: `Custom designed for your ${analysisData.mood} space.`,
          isGenerated: true
        };
        // Mevcut önerilerin en başına AI ürününü ekle
        setRecommendations([newProduct, ...MOCK_RECOMMENDATIONS]);
        setSelectedProduct(newProduct);
      }
    } catch (error) {
      console.error('Üretim hatası:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const calculatePrice = (product: Product) => {
    return (product.basePrice * SIZE_MULTIPLIERS[selectedSize]) + FRAME_PRICES[selectedFrame];
  };

  const [pw, ph] = selectedSize.split('x').map(Number);
  const physicalWidth = orientation === 'portrait' ? pw : ph;
  const physicalHeight = orientation === 'portrait' ? ph : pw;

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-zinc-950 text-zinc-50 overflow-hidden font-sans">
      {/* Canvas Bölgesi */}
      <div className="flex-1 p-6 flex flex-col relative">
        <div className="flex-1 relative rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-2xl">
          {isAnalyzing ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-zinc-950/90 z-20 backdrop-blur-md">
              <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="font-mono text-[10px] uppercase tracking-widest opacity-50">ANALYZING SPACE SCALE...</p>
            </div>
          ) : roomImage && analysisData ? (
            <InteractiveCanvas 
              backgroundImage={roomImage} 
              mountedArt={selectedProduct?.image || null} 
              physicalWidth={physicalWidth}
              physicalHeight={physicalHeight}
              naturalPixelsPerInch={analysisData.ppi}
              frameColor={(FRAME_COLORS as any)[selectedFrame]}
              perspective={analysisData}
            />
          ) : (
            <div {...getRootProps()} className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-800/50 transition-all border-2 border-dashed border-zinc-800 m-8 rounded-3xl">
              <input {...getInputProps()} />
              <ImageIcon className="w-12 h-12 opacity-20 mb-4" />
              <p className="font-mono text-xs uppercase opacity-30 tracking-widest text-center px-12 text-zinc-400">Upload a room photo to begin</p>
            </div>
          )}
        </div>
      </div>

      {/* Sağ Panel */}
      <div className="w-[450px] border-l border-zinc-800 bg-zinc-950 flex flex-col h-full overflow-y-auto">
        <div className="p-6 border-b border-zinc-800 sticky top-0 bg-zinc-950/90 backdrop-blur-md z-10">
          <button 
            onClick={handleCreateForMe}
            disabled={isGenerating || isAnalyzing || !roomImage}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white text-base font-bold uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(16,185,129,0.3)] disabled:opacity-30"
          >
            {isGenerating ? <><Sparkles className="w-5 h-5 animate-spin" /> WEAVING MAGIC...</> : <><Sparkles className="w-5 h-5" /> MAKE ME FEEL SPECIAL</>}
          </button>
          <p className="text-center text-emerald-500/60 text-[10px] mt-3 font-medium tracking-wide uppercase">A unique design crafted exclusively for your space.</p>
        </div>

        <div className="p-6 space-y-4">
          <h2 className="text-lg font-bold tracking-tight flex items-center gap-2 mb-4"><Sparkles className="w-5 h-5 text-indigo-400" /> Top Matches</h2>
          
          {recommendations.map((product) => {
            const isSelected = selectedProduct?.id === product.id;
            return (
              <div key={product.id} className={`rounded-xl border transition-all overflow-hidden ${isSelected ? 'border-indigo-500 bg-zinc-900/50' : 'border-zinc-800 hover:border-zinc-700 cursor-pointer'}`} onClick={() => setSelectedProduct(product)}>
                <div className="p-4 flex gap-4">
                  <img src={product.image} className="w-20 h-20 rounded-lg object-cover border border-zinc-800" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm truncate">{product.title}</h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-zinc-400">
                      <span className="flex items-center gap-1"><Maximize2 className="w-3 h-3" /> {selectedSize}"</span>
                      <span className="font-medium text-zinc-200">${calculatePrice(product).toFixed(2)}</span>
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-2 line-clamp-2 leading-relaxed italic">{product.description}</p>
                  </div>
                </div>

                {isSelected && (
                  <div className="px-4 pb-4 pt-2 border-t border-zinc-800/50 space-y-4 bg-zinc-900/30">
                    {/* Size Seçimi */}
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2 block">Size</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['12x18', '18x24', '24x36'] as SizeType[]).map(size => (
                          <button key={size} onClick={(e) => { e.stopPropagation(); setSelectedSize(size); }} className={`py-2 text-[10px] font-bold rounded-lg border transition-all ${selectedSize === size ? 'bg-zinc-100 text-zinc-900 border-zinc-100' : 'bg-zinc-950 text-zinc-500 border-zinc-800'}`}>{size}"</button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Orientation & Frame */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2 block">Orientation</label>
                        <div className="flex gap-2">
                          {(['portrait', 'landscape'] as const).map(o => (
                            <button key={o} onClick={(e) => { e.stopPropagation(); setOrientation(o); }} className={`flex-1 py-2 text-[10px] font-bold rounded-lg border capitalize transition-all ${orientation === o ? 'bg-zinc-800 text-white border-zinc-700' : 'bg-zinc-950 text-zinc-500 border-zinc-800'}`}>{o}</button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2 block">Frame</label>
                        <div className="flex gap-2">
                          {(['unframed', 'black', 'oak'] as FrameType[]).map(f => (
                            <button key={f} onClick={(e) => { e.stopPropagation(); setSelectedFrame(f); }} className={`flex-1 py-2 rounded-lg border flex items-center justify-center transition-all ${selectedFrame === f ? 'bg-zinc-800 border-zinc-600' : 'bg-zinc-950 border-zinc-800'}`}>
                              <div className="w-3 h-3 rounded-full border border-zinc-700" style={{ backgroundColor: FRAME_COLORS[f] || '#fff' }}></div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button className="w-full py-3 bg-zinc-100 hover:bg-white text-zinc-900 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 mt-2">
                      <ShoppingBag className="w-4 h-4" /> Buy Now - ${calculatePrice(product).toFixed(2)}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
