import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'motion/react';
import { Upload, ImageIcon, Sparkles, ShoppingBag } from 'lucide-react';
import { useStore } from '../store/useStore';
import { InteractiveCanvas } from '../components/InteractiveCanvas';

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
  { id: 'rec1', title: 'Dark Side of the Moon', basePrice: 45, image: 'https://picsum.photos/seed/cyberpunk/800/1200', category: 'Cyberpunk', description: 'Strong music theme match.' },
  { id: 'rec2', title: 'Pulp Fiction', basePrice: 35, image: 'https://picsum.photos/seed/minimalist/800/1200', category: 'Minimalist', description: 'Retro vibe match.' },
];

const FRAME_COLORS = { 'unframed': null, 'black': '#18181b', 'oak': '#8b5a2b' };

export function Home() {
  const { user, useToken } = useStore();
  const [roomImage, setRoomImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Analiz ve Perspektif State'leri
  const [naturalPPI, setNaturalPPI] = useState<number>(6); // Başlangıçta odayı kaplamaması için küçük
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

  // SDK YERİNE REST API VE VITE_ PREFIX İLE KESİN ÇÖZÜM
  const analyzeRoom = async (base64Image: string) => {
    setIsAnalyzing(true);
    setRecommendations(MOCK_RECOMMENDATIONS);
    if (!selectedProduct) setSelectedProduct(MOCK_RECOMMENDATIONS[0]);

    // Vercel panelindeki isme sabitledik
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY; 

    try {
      if (!apiKey) throw new Error("API KEY MISSING");

      // Nano Banana 2 modeli için REST çağrısı
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: "Analyze room image. Estimate PPI for the focal wall (range 4-10). Calculate 'rotateY' (-20 to 20 deg) and 'skewY' (-10 to 10) so a poster is perfectly flat on that wall. Return ONLY JSON: { \"pixelsPerInch\": number, \"rotateY\": number, \"skewY\": number }" },
              { inlineData: { mimeType: "image/jpeg", data: base64Image.split(',')[1] } }
            ]
          }]
        })
      });

      const result = await response.json();
      const text = result.candidates[0].content.parts[0].text;
      const data = JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());
      
      setNaturalPPI(data.pixelsPerInch || 6); // Analiz patlarsa odayı kaplamasın
      setPerspective({ rotateY: data.rotateY || 0, skewY: data.skewY || 0 });

    } catch (e) {
      console.error("ANALIZ PATLADI (Falling back):", e);
      setNaturalPPI(6); // Hata durumunda odayı kaplamayan güvenli ölçek
      setPerspective({ rotateY: 0, skewY: 0 });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const calculatePrice = (product: Product) => {
    return (product.basePrice * 2.2) + 20; // 24x36 varsayımı
  };

  const [pw, ph] = selectedSize.split('x').map(Number);
  const physicalWidth = orientation === 'portrait' ? pw : ph;
  const physicalHeight = orientation === 'portrait' ? ph : pw;

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-zinc-950 text-zinc-50 overflow-hidden font-sans">
      {/* Canvas Bölgesi */}
      <div className="flex-1 p-6 flex flex-col relative">
        <div className="flex-1 relative rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800">
          {isAnalyzing ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-zinc-950/80 z-20 backdrop-blur-sm">
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
              <p className="font-mono text-xs uppercase tracking-widest text-zinc-400">Upload room photo</p>
            </div>
          )}
        </div>
      </div>

      {/* Sağ Panel */}
      <div className="w-[450px] border-l border-zinc-800 bg-zinc-950 flex flex-col p-6 overflow-y-auto">
        <button className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold uppercase rounded-xl mb-10 text-xs tracking-widest">MAKE ME FEEL SPECIAL</button>
        <h2 className="text-sm font-black uppercase tracking-widest mb-6 opacity-40">Top Matches</h2>
        <div className="space-y-4">
          {recommendations.map((product) => (
            <div 
              key={product.id} 
              className={`p-4 border rounded-2xl cursor-pointer transition-all ${selectedProduct?.id === product.id ? 'border-indigo-500 bg-zinc-900 shadow-xl' : 'border-zinc-800 hover:border-zinc-700'}`}
              onClick={() => setSelectedProduct(product)}
            >
              <div className="flex gap-4 items-center">
                <img src={product.image} className="w-14 h-14 rounded-xl object-cover" />
                <h3 className="font-bold text-xs">{product.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
