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

const MOCK_RECOMMENDATIONS: Product[] = [
  { id: 'rec1', title: 'Dark Side of the Moon - Prism', basePrice: 45, image: 'https://picsum.photos/seed/cyberpunk/800/1200', category: 'Cyberpunk', description: 'The room has a strong music theme with the wall decal, the guitar, and the chalkboard wall...' },
  { id: 'rec2', title: 'Pulp Fiction - The Dance', basePrice: 35, image: 'https://picsum.photos/seed/minimalist/800/1200', category: 'Minimalist', description: 'The room\'s black, white, and yellow color scheme, along with its somewhat retro/eclectic...' },
  { id: 'rec3', title: 'Electric Stripe Symphony', basePrice: 55, image: 'https://picsum.photos/seed/renaissance/800/1200', category: 'Renaissance', description: 'A custom poster featuring a minimalist, stylized yellow electric guitar against a stark black and...' },
];

const SIZE_MULTIPLIERS = { '12x18': 1, '18x24': 1.5, '24x36': 2.2 };
const FRAME_PRICES = { 'unframed': 0, 'black': 20, 'oak': 25 };
const FRAME_COLORS = { 'unframed': null, 'black': '#18181b', 'oak': '#8b5a2b' };

export function Home() {
  const { user, useToken, addToCart } = useStore();
  const [roomImage, setRoomImage] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Analiz ve Perspektif State'leri
  const [naturalPPI, setNaturalPPI] = useState<number>(15);
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

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'image/*': [] }, maxFiles: 1 });

  const analyzeRoom = async (base64Image: string) => {
    setIsAnalyzing(true);
    setRecommendations(MOCK_RECOMMENDATIONS);
    if (!selectedProduct) setSelectedProduct(MOCK_RECOMMENDATIONS[0]);

    try {
      // SDK BAŞLATMA BURADA DÜZELTİLDİ
      const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY || "");
      const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-image-preview" });

      const prompt = "Analyze this room. 1. Estimate PPI (scale) for the back wall. 2. Perspective: estimate 'rotateY' (-20 to 20 deg) and 'skewY' (-10 to 10) for a poster to sit flat on that wall. Return ONLY JSON: { \"pixelsPerInch\": number, \"rotateY\": number, \"skewY\": number }";

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Image.split(',')[1],
            mimeType: "image/jpeg"
          }
        }
      ]);
      
      const response = await result.response;
      const data = JSON.parse(response.text().replace(/```json/g, '').replace(/```/g, ''));
      
      if (data.pixelsPerInch) setNaturalPPI(data.pixelsPerInch);
      setPerspective({ rotateY: data.rotateY || 0, skewY: data.skewY || 0 });

    } catch (e) {
      console.error("Analysis failed:", e);
      setNaturalPPI(15);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCreateForMe = async () => {
    if (!user) {
      alert('Sign up to Create');
      return;
    }
    if (useToken()) {
      setIsGenerating(true);
      try {
        const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY || "");
        const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-image-preview" });
        const prompt = `Art poster. Style: ${selectedStyle || 'Abstract'}. Colors: ${selectedColor || 'various'}. High-end decor.`;
        
        const result = await model.generateContent(prompt);
        const response = await result.response;

        // Görsel verisi kontrolü
        const parts = response.candidates?.[0]?.content?.parts;
        const imgPart = parts?.find(p => p.inlineData);

        if (imgPart?.inlineData) {
          const newArt = `data:image/png;base64,${imgPart.inlineData.data}`;
          const newProduct: Product = {
            id: `gen_${Date.now()}`,
            title: 'AI Generated Art',
            basePrice: 65,
            image: newArt,
            category: selectedStyle || 'Abstract',
            description: `Generated for your space.`,
            isGenerated: true
          };
          setRecommendations([newProduct, ...recommendations]);
          setSelectedProduct(newProduct);
        }
      } catch (error) {
        console.error('Generation failed:', error);
      } finally {
        setIsGenerating(false);
      }
    }
  };

  const getPhysicalDimensions = () => {
    const [w, h] = selectedSize.split('x').map(Number);
    return orientation === 'portrait' ? { w, h } : { w: h, h: w };
  };

  const calculatePrice = (product: Product) => {
    const sizeMultiplier = SIZE_MULTIPLIERS[selectedSize as keyof typeof SIZE_MULTIPLIERS];
    const framePrice = FRAME_PRICES[selectedFrame as keyof typeof FRAME_PRICES];
    return (product.basePrice * sizeMultiplier) + framePrice;
  };

  const { w: physicalWidth, h: physicalHeight } = getPhysicalDimensions();

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-zinc-950 text-zinc-50 overflow-hidden">
      <div className="flex-1 p-6 flex flex-col relative">
        <div className="flex-1 relative rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800">
          {isAnalyzing ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-zinc-500 bg-zinc-950/80 z-20 backdrop-blur-sm">
              <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
              <p className="font-mono text-sm uppercase animate-pulse">Analyzing Space...</p>
            </div>
          ) : roomImage ? (
            <InteractiveCanvas 
              backgroundImage={roomImage} 
              mountedArt={selectedProduct?.image || null} 
              physicalWidth={physicalWidth}
              physicalHeight={physicalHeight}
              naturalPixelsPerInch={naturalPPI}
              frameColor={FRAME_COLORS[selectedFrame as keyof typeof FRAME_COLORS]}
              perspective={perspective}
            />
          ) : (
            <div {...getRootProps()} className={`absolute inset-0 flex flex-col items-center justify-center cursor-pointer transition-all ${isDragActive ? 'bg-indigo-500/10' : 'hover:bg-zinc-800/50'}`}>
              <input {...getInputProps()} />
              <ImageIcon className="w-16 h-16 opacity-50 mb-4" />
              <p className="font-mono text-sm uppercase text-zinc-400">Upload room photo</p>
            </div>
          )}
        </div>
      </div>

      <div className="w-[450px] border-l border-zinc-800 bg-zinc-950 flex flex-col h-full overflow-y-auto">
        <div className="p-6 border-b border-zinc-800 sticky top-0 bg-zinc-950/90 backdrop-blur-md z-10 flex flex-col">
          <button
            onClick={handleCreateForMe}
            disabled={isGenerating || isAnalyzing || !roomImage}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white text-base font-bold uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {isGenerating ? <><Sparkles className="w-5 h-5 animate-spin" /> Designing...</> : <><Sparkles className="w-5 h-5" /> Make Me Feel Special</>}
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold tracking-tight">Top Matches</h2>
          </div>
          {recommendations.map((product) => (
            <div 
              key={product.id}
              className={`rounded-xl border transition-all overflow-hidden ${selectedProduct?.id === product.id ? 'border-indigo-500 bg-zinc-900/50' : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700 cursor-pointer'}`}
              onClick={() => setSelectedProduct(product)}
            >
              <div className="p-4 flex gap-4">
                <div className="w-24 h-24 rounded-lg overflow-hidden border border-zinc-800 flex-shrink-0 bg-zinc-900">
                  <img src={product.image} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm truncate">{product.title}</h3>
                  <p className="text-xs text-zinc-200 mt-1">${calculatePrice(product).toFixed(2)}</p>
                  <p className="text-xs text-zinc-500 mt-2 line-clamp-2">{product.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
