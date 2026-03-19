import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'motion/react';
import { Upload, Wand2, Image as ImageIcon, Sparkles, Palette, ShoppingBag, Maximize2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { InteractiveCanvas } from '../components/InteractiveCanvas';
import { GoogleGenAI, Type } from "@google/genai";

const STYLES = ['Minimalist', 'Cyberpunk', 'Renaissance', 'Abstract', 'Synthwave', 'Bohemian'];
const COLORS = ['#18181b', '#f4f4f5', '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

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

const SIZE_MULTIPLIERS = { '12x18': 1, '18x24': 1.5, '24x36': 2.2 };
const FRAME_PRICES = { 'unframed': 0, 'black': 20, 'oak': 25 };
const FRAME_COLORS = { 'unframed': null, 'black': '#18181b', 'oak': '#8b5a2b' };

const MOCK_RECOMMENDATIONS: Product[] = [
  { id: 'rec1', title: 'Dark Side of the Moon - Prism', basePrice: 45, image: 'https://picsum.photos/seed/cyberpunk/800/1200', category: 'Cyberpunk', description: 'The room has a strong music theme with the wall decal, the guitar, and the chalkboard wall...' },
  { id: 'rec2', title: 'Pulp Fiction - The Dance', basePrice: 35, image: 'https://picsum.photos/seed/minimalist/800/1200', category: 'Minimalist', description: 'The room\'s black, white, and yellow color scheme, along with its somewhat retro/eclectic...' },
  { id: 'rec3', title: 'Electric Stripe Symphony', basePrice: 55, image: 'https://picsum.photos/seed/renaissance/800/1200', category: 'Renaissance', description: 'A custom poster featuring a minimalist, stylized yellow electric guitar against a stark black and...' },
];

export function Home() {
  const { user, useToken, addToCart } = useStore();
  const [roomImage, setRoomImage] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Analiz ve Perspektif State'leri
  const [naturalPPI, setNaturalPPI] = useState<number>(6); // BAŞLANGIÇ DEĞERİ KÜÇÜK OLSUN
  const [perspective, setPerspective] = useState({ rotateY: 0, skewY: 0 });

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

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'image/*': [] }, maxFiles: 1 } as any);

  const analyzeRoom = async (base64Image: string) => {
    setIsAnalyzing(true);
    setRecommendations(MOCK_RECOMMENDATIONS);
    if (!selectedProduct) setSelectedProduct(MOCK_RECOMMENDATIONS[0]);

    try {
      // VITE VE VERCEL İÇİN EN GARANTİ API KEY ERİŞİMİ
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
      
      if (!apiKey) throw new Error("API_KEY_MISSING_OR_UNREADABLE");

      const genAI = new GoogleGenAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // STABİL MODEL

      const prompt = "Act as an interior architect. Analyze the room. 1. Estimate PPI (scale) for the wall (range 4-10). 2. Perspective: estimate 'rotateY' (-20 to 20) and 'skewY' (-10 to 10) for a poster. Return ONLY JSON: { \"pixelsPerInch\": number, \"rotateY\": number, \"skewY\": number }";

      const result = await model.generateContent([
        prompt,
        { inlineData: { data: base64Image.split(',')[1], mimeType: "image/jpeg" } }
      ]);
      
      const response = await result.response;
      const data = JSON.parse(response.text().replace(/```json/g, '').replace(/```/g, ''));
      
      if (data.pixelsPerInch) setNaturalPPI(data.pixelsPerInch);
      setPerspective({ rotateY: data.rotateY || 0, skewY: data.skewY || 0 });

    } catch (e) {
      console.error("ANALIZ PATTII:", e);
      // Hata durumunda posterin odayı kaplamasını önle
      setNaturalPPI(6);
      setPerspective({ rotateY: 0, skewY: 0 });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCreateForMe = async () => {
    if (!user || isGenerating) return;
    if (useToken()) {
      setIsGenerating(true);
      try {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("API_KEY_MISSING");

        const genAI = new GoogleGenAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "imagen-3" }); 
        const prompt = `Highly detailed artistic poster for ${selectedStyle || 'Abstract'} space, colors ${selectedColor || 'various'}.Pinterest-worthy.`;
        const result = await model.generateContent(prompt);
        // ... (Imagen-3 base64 işlemi buraya gelecek, şimdilik mock devam)
        alert('Görsel üretim modeli Imagen-3 API yetkisi gereklidir. Şimdilik analiz verileriyle devam ediliyor.');
      } catch (error) {
        console.error('Generation failed:', error);
      } finally {
        setIsGenerating(false);
      }
    }
  };

  const calculatePrice = (product: Product) => {
    const sizeMultiplier = SIZE_MULTIPLIERS[selectedSize];
    const framePrice = FRAME_PRICES[selectedFrame];
    return (product.basePrice * sizeMultiplier) + framePrice;
  };

  const [pw, ph] = selectedSize.split('x').map(Number);
  const physicalWidth = orientation === 'portrait' ? pw : ph;
  const physicalHeight = orientation === 'portrait' ? ph : pw;

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-zinc-950 text-zinc-50 overflow-hidden font-sans">
      <div className="flex-1 p-6 flex flex-col relative">
        <div className="flex-1 relative rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-2xl">
          {isAnalyzing ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-zinc-500 bg-zinc-950/80 z-20 backdrop-blur-sm">
              <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="font-mono text-xs uppercase animate-pulse">Analyzing Space...</p>
            </div>
          ) : roomImage ? (
            <InteractiveCanvas 
              backgroundImage={roomImage} 
              mountedArt={selectedProduct?.image || null} 
              physicalWidth={physicalWidth}
              physicalHeight={physicalHeight}
              naturalPixelsPerInch={naturalPPI}
              frameColor={(FRAME_COLORS as any)[selectedFrame]}
              perspective={perspective}
            />
          ) : (
            <div {...getRootProps()} className={`absolute inset-0 flex flex-col items-center justify-center cursor-pointer transition-all ${isDragActive ? 'bg-indigo-500/10' : 'hover:bg-zinc-800/50'}`}>
              <input {...getInputProps()} />
              <ImageIcon className="w-12 h-12 opacity-20 mb-4" />
              <p className="font-mono text-xs uppercase text-zinc-400 opacity-40">Upload Room Image</p>
            </div>
          )}
        </div>
      </div>

      <div className="w-[450px] border-l border-zinc-800 bg-zinc-950 flex flex-col p-6 overflow-y-auto">
        <button onClick={handleCreateForMe} disabled={isGenerating || isAnalyzing || !roomImage} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold uppercase rounded-xl mb-10 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_30px_rgba(16,185,129,0.3)] border border-emerald-400/30">
          {isGenerating ? <><Sparkles className="w-5 h-5 animate-spin" /> Designing...</> : <><Sparkles className="w-5 h-5" /> MAKE ME FEEL SPECIAL</>}
        </button>
        <h2 className="text-lg font-bold mb-6 flex items-center gap-2"><Sparkles className="w-5 h-5 text-indigo-400" /> Top Matches</h2>
        <div className="space-y-4">
          {recommendations.map((product) => {
            const isSelected = selectedProduct?.id === product.id;
            return (
              <div key={product.id} className={`rounded-xl border transition-all ${isSelected ? 'border-indigo-500 bg-zinc-900/50 shadow-xl' : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700 cursor-pointer'}`} onClick={() => setSelectedProduct(product)}>
                <div className="p-4 flex gap-4">
                  <img src={product.image} className="w-16 h-16 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm truncate">{product.title}</h3>
                    <p className="text-xs font-medium text-zinc-200">${calculatePrice(product).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
