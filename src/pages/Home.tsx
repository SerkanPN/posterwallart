import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'motion/react';
import { Upload, Wand2, Image as ImageIcon, Sparkles, ShoppingBag, Maximize2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { InteractiveCanvas } from '../components/InteractiveCanvas';

const MOCK_RECOMMENDATIONS = [
  { id: 'rec1', title: 'Dark Side of the Moon - Prism', basePrice: 45, image: 'https://picsum.photos/seed/cyberpunk/800/1200', category: 'Cyberpunk', description: 'AI recommended for your music theme.' },
  { id: 'rec2', title: 'Pulp Fiction - The Dance', basePrice: 35, image: 'https://picsum.photos/seed/minimalist/800/1200', category: 'Minimalist', description: 'Matches your room colors.' },
  { id: 'rec3', title: 'Electric Stripe Symphony', basePrice: 55, image: 'https://picsum.photos/seed/renaissance/800/1200', category: 'Renaissance', description: 'Stylized match for your space.' },
];

const SIZE_MULTIPLIERS = { '12x18': 1, '18x24': 1.5, '24x36': 2.2 };
const FRAME_PRICES = { 'unframed': 0, 'black': 20, 'oak': 25 };
const FRAME_COLORS = { 'unframed': null, 'black': '#18181b', 'oak': '#8b5a2b' };

export function Home() {
  const { user, useToken, addToCart } = useStore();
  const [roomImage, setRoomImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [analysisData, setAnalysisData] = useState<{
    ppi: number;
    rotateY: number;
    skewY: number;
    top: number;
    left: number;
  } | null>(null);

  const [selectedProduct, setSelectedProduct] = useState<any>(null);
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
    setAnalysisData(null);
    setRecommendations(MOCK_RECOMMENDATIONS);

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    const modelName = "gemini-3.1-flash-image-preview"; 

    try {
      if (!apiKey) throw new Error("API KEY MISSING");

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: "Analyze this room for wall art. 1. Find the main wall. 2. Estimate PPI (scale 3-6) for a realistic fit. 3. Estimate rotateY (-10 to 10) for perspective. 4. COORDINATES: Return 'top' and 'left' percentages (0-100) for the center of the wall. Return ONLY JSON: { \"pixelsPerInch\": number, \"rotateY\": number, \"skewY\": number, \"top\": number, \"left\": number }" },
              { inlineData: { mimeType: "image/jpeg", data: base64Image.split(',')[1] } }
            ]
          }]
        })
      });

      const result = await response.json();
      const textResponse = result.candidates[0].content.parts[0].text;
      const data = JSON.parse(textResponse.replace(/```json/g, '').replace(/```/g, '').trim());

      setAnalysisData({
        ppi: data.pixelsPerInch || 5,
        rotateY: data.rotateY || 0,
        skewY: data.skewY || 0,
        top: data.top || 40,
        left: data.left || 50
      });
    } catch (e) {
      console.error("Analysis Pattı:", e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const calculatePrice = (product: any) => {
    const sizeMultiplier = SIZE_MULTIPLIERS[selectedSize as keyof typeof SIZE_MULTIPLIERS];
    const framePrice = FRAME_PRICES[selectedFrame as keyof typeof FRAME_PRICES];
    return (product.basePrice * sizeMultiplier) + framePrice;
  };

  const [pw, ph] = selectedSize.split('x').map(Number);
  const physicalWidth = orientation === 'portrait' ? pw : ph;
  const physicalHeight = orientation === 'portrait' ? ph : pw;

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-zinc-950 text-zinc-50 overflow-hidden">
      <div className="flex-1 p-6 flex flex-col relative">
        <div className="flex-1 relative rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-2xl">
          {isAnalyzing ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-zinc-950/90 z-20 backdrop-blur-xl">
              <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="font-mono text-[10px] uppercase tracking-widest opacity-50">Nano Banana 2 Analyzing...</p>
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
            <div {...getRootProps()} className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-800/30 transition-all border-2 border-dashed border-zinc-800 m-8 rounded-3xl">
              <input {...getInputProps()} />
              <Upload className="w-10 h-10 mb-4 opacity-10" />
              <p className="font-mono text-[10px] uppercase tracking-widest opacity-30">Upload Room Image</p>
            </div>
          )}
        </div>
      </div>

      <div className="w-[400px] border-l border-zinc-800 bg-zinc-950 flex flex-col p-6 overflow-y-auto">
        <button className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold uppercase rounded-xl mb-10 text-xs tracking-widest transition-all">MAKE ME FEEL SPECIAL</button>
        <h2 className="text-xs font-black uppercase tracking-widest mb-6 opacity-40">Top Matches</h2>
        <div className="space-y-4">
          {recommendations.map((p) => (
            <div 
              key={p.id} 
              className={`p-4 border rounded-2xl cursor-pointer transition-all ${selectedProduct?.id === p.id ? 'border-emerald-500 bg-zinc-900 shadow-xl' : 'border-zinc-800'}`}
              onClick={() => setSelectedProduct(p)}
            >
              <div className="flex gap-4 items-center">
                <img src={p.image} className="w-14 h-14 rounded-xl object-cover" />
                <div>
                  <h3 className="font-bold text-xs">{p.title}</h3>
                  <p className="text-[10px] text-zinc-500 mt-1">${calculatePrice(p).toFixed(2)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
