import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'motion/react';
import { Upload, Wand2, Image as ImageIcon, Sparkles, ShoppingBag } from 'lucide-react';
import { useStore } from '../store/useStore';
import { InteractiveCanvas } from '../components/InteractiveCanvas';
import { GoogleGenAI } from "@google/genai";

const MOCK_RECOMMENDATIONS = [
  { id: 'rec1', title: 'Dark Side of the Moon - Prism', basePrice: 45, image: 'https://picsum.photos/seed/cyberpunk/800/1200', category: 'Cyberpunk', description: 'Music theme match...' },
  { id: 'rec2', title: 'Pulp Fiction - The Dance', basePrice: 35, image: 'https://picsum.photos/seed/minimalist/800/1200', category: 'Minimalist', description: 'Retro vibe match...' },
];

const FRAME_PRICES = { 'unframed': 0, 'black': 20, 'oak': 25 };
const FRAME_COLORS = { 'unframed': null, 'black': '#18181b', 'oak': '#8b5a2b' };

export function Home() {
  const { user, useToken } = useStore();
  const [roomImage, setRoomImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  
  // Analiz ve Perspektif State'leri
  const [naturalPPI, setNaturalPPI] = useState<number>(6); // Başlangıçta küçük
  const [perspective, setPerspective] = useState({ rotateY: 0, skewY: 0 });

  const [selectedProduct, setSelectedProduct] = useState<any>(null); // Başlangıçta null (Boş Çerçeve)
  const [selectedSize, setSelectedSize] = useState('24x36');
  const [selectedFrame, setSelectedFrame] = useState('unframed');
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

  const { getRootProps, getInputProps } = useDropzone({ onDrop, accept: { 'image/*': [] }, maxFiles: 1 });

  const analyzeRoom = async (base64Image: string) => {
    setIsAnalyzing(true);
    setRecommendations(MOCK_RECOMMENDATIONS);
    
    // VITE ve VERCEL İÇİN ÇİFT KONTROLLÜ API KEY ERİŞİMİ
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

    try {
      if (!apiKey) throw new Error("API Key Missing");
      
      const genAI = new GoogleGenAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = "Estimate PPI for the focal wall (4-10 range). Calculate 'rotateY' (-15 to 15) and 'skewY' (-5 to 5). Return ONLY JSON: { \"pixelsPerInch\": number, \"rotateY\": number, \"skewY\": number }";

      const result = await model.generateContent([
        prompt,
        { inlineData: { data: base64Image.split(',')[1], mimeType: "image/jpeg" } }
      ]);
      
      const data = JSON.parse((await result.response).text().replace(/```json/g, '').replace(/```/g, ''));
      
      setNaturalPPI(data.pixelsPerInch || 6);
      setPerspective({ rotateY: data.rotateY || 0, skewY: data.skewY || 0 });
    } catch (e) {
      console.error("Analysis Pattı:", e);
      // Hata durumunda posterin odayı kaplamasını önle
      setNaturalPPI(6);
      setPerspective({ rotateY: 0, skewY: 0 });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const calculatePrice = (product: any) => {
    const framePrice = FRAME_PRICES[selectedFrame as keyof typeof FRAME_PRICES];
    return (product.basePrice * 2.2) + framePrice; // 24x36 varsayımı
  };

  const [pw, ph] = selectedSize.split('x').map(Number);
  const physicalWidth = orientation === 'portrait' ? pw : ph;
  const physicalHeight = orientation === 'portrait' ? ph : pw;

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-zinc-950 text-zinc-50 overflow-hidden">
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
            <div {...getRootProps()} className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-800/50 transition-all border-2 border-dashed border-zinc-800 m-8 rounded-3xl">
              <input {...getInputProps()} />
              <ImageIcon className="w-10 h-10 mb-4 opacity-10" />
              <p className="font-mono text-[10px] uppercase tracking-widest opacity-30">Upload Room Image</p>
            </div>
          )}
        </div>
      </div>

      <div className="w-[450px] border-l border-zinc-800 bg-zinc-950 flex flex-col p-6 overflow-y-auto">
        <button className="w-full py-4 bg-emerald-600 text-white font-bold uppercase rounded-xl mb-10 text-xs tracking-widest">MAKE ME FEEL SPECIAL</button>
        <h2 className="text-xs font-black uppercase tracking-widest mb-6 opacity-40">Top Matches</h2>
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
