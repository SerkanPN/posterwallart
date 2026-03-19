import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'motion/react';
import { Upload, ImageIcon, Sparkles, ShoppingBag } from 'lucide-react';
import { useStore } from '../store/useStore';
import { InteractiveCanvas } from '../components/InteractiveCanvas';
import { GoogleGenAI } from "@google/genai";

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
const FRAME_COLORS = { 'unframed': null, 'black': '#18181b', 'oak': '#8b5a2b' };

export function Home() {
  const { user, useToken, addToCart } = useStore();
  const [roomImage, setRoomImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [analysis, setAnalysis] = useState({
    ppi: 5,
    rotateY: 0,
    skewY: 0,
    suggestedStyle: '',
    suggestedColors: [] as string[],
    roomDescription: ''
  });

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
        analyzeRoomDeeply(base64);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps } = useDropzone({ onDrop, accept: { 'image/*': [] }, maxFiles: 1 });

  const analyzeRoomDeeply = async (base64Image: string) => {
    setIsAnalyzing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      // Nano Banana 2 (Gemini 3.1 Flash Image) kullanılıyor
      const model = ai.getGenerativeModel({ model: "gemini-3.1-flash-image-preview" });
      
      const prompt = `Analyze this room with pro-level visual intelligence. 
          1. Perspective: Identify the main wall. Calculate 'rotateY' (-20 to 20 deg) and 'skewY' (-10 to 10) for a poster to sit flat.
          2. Scale: Identify standard furniture to estimate realistic PPI (pixels-per-inch).
          3. Context: Identify interior style and dominant hex colors.
          Return ONLY JSON: 
          { "pixelsPerInch": number, "rotateY": number, "skewY": number, "suggestedStyle": "string", "suggestedColors": ["hex"], "roomDescription": "string" }`;

      const result = await model.generateContent([
        prompt,
        { inlineData: { data: base64Image.split(',')[1], mimeType: "image/jpeg" } }
      ]);
      
      const text = result.response.text().replace(/```json/g, '').replace(/```/g, '');
      const data = JSON.parse(text);

      setAnalysis({
        ppi: data.pixelsPerInch || 6,
        rotateY: data.rotateY || 0,
        skewY: data.skewY || 0,
        suggestedStyle: data.suggestedStyle,
        suggestedColors: data.suggestedColors,
        roomDescription: data.roomDescription
      });

      // İlk "Expert Pick" önerisi
      setRecommendations([{
        id: 'expert_1',
        title: `${data.suggestedStyle} Curated`,
        basePrice: 45,
        image: 'https://picsum.photos/seed/expert/800/1200',
        category: data.suggestedStyle,
        description: data.roomDescription
      }]);
    } catch (e) {
      console.error("Analysis Failed:", e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCreateForMe = async () => {
    if (!user || isGenerating) return;
    if (useToken()) {
      setIsGenerating(true);
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
        // Görsel üretimi için Nano Banana 2 modeli çağrılıyor
        const model = ai.getGenerativeModel({ model: "gemini-3.1-flash-image-preview" });
        
        const prompt = `Create a high-end masterpiece poster. Style: ${analysis.suggestedStyle}. Colors: ${analysis.suggestedColors.join(', ')}. Context: To be hung in a room described as: ${analysis.roomDescription}. Return a high-resolution artistic image.`;
        
        const result = await model.generateContent(prompt);
        
        // Gelen inlineData (base64) kontrolü
        const parts = result.response.candidates?.[0]?.content?.parts;
        const generatedImagePart = parts?.find(p => p.inlineData);

        if (generatedImagePart?.inlineData) {
          const newArt = `data:image/png;base64,${generatedImagePart.inlineData.data}`;
          const newProduct: Product = {
            id: `gen_${Date.now()}`,
            title: 'Your AI Masterpiece',
            basePrice: 65,
            image: newArt,
            category: analysis.suggestedStyle,
            description: 'Uniquely generated to match your space colors and style.',
            isGenerated: true
          };
          setRecommendations([newProduct, ...recommendations]);
          setSelectedProduct(newProduct);
        }
      } catch (error) {
        console.error("Generation failed:", error);
      } finally {
        setIsGenerating(false);
      }
    }
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
              <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="font-mono text-sm uppercase tracking-widest">NANO BANANA 2 ANALYZING...</p>
            </div>
          ) : roomImage ? (
            <InteractiveCanvas 
              backgroundImage={roomImage} 
              mountedArt={selectedProduct?.image || null} 
              physicalWidth={physicalWidth}
              physicalHeight={physicalHeight}
              naturalPixelsPerInch={analysis.ppi}
              frameColor={FRAME_COLORS[selectedFrame]}
              perspective={{ rotateY: analysis.rotateY, skewY: analysis.skewY }}
            />
          ) : (
            <div {...getRootProps()} className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-800/50 transition-all m-4 border-2 border-dashed border-zinc-800 rounded-xl">
              <input {...getInputProps()} />
              <div className="w-20 h-20 bg-zinc-800 rounded-3xl flex items-center justify-center mb-6">
                <Upload className="w-10 h-10 text-zinc-400" />
              </div>
              <p className="font-bold text-lg">Drop room photo here</p>
            </div>
          )}
        </div>
      </div>

      <div className="w-[450px] border-l border-zinc-800 bg-zinc-950 flex flex-col h-full overflow-y-auto p-6">
        <button
          onClick={handleCreateForMe}
          disabled={isGenerating || isAnalyzing || !roomImage}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase rounded-xl transition-all shadow-[0_0_30px_rgba(99,102,241,0.3)] mb-8 disabled:opacity-30"
        >
          {isGenerating ? 'GENERATING ART...' : 'MAKE ME FEEL SPECIAL'}
        </button>

        <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Sparkles className="w-5 h-5 text-indigo-400" /> Top Matches</h2>
        <div className="space-y-4">
          {recommendations.map((product) => (
            <div 
              key={product.id}
              className={`rounded-3xl border p-5 cursor-pointer transition-all duration-300 ${selectedProduct?.id === product.id ? 'border-indigo-500 bg-zinc-900 shadow-xl' : 'border-zinc-800 hover:border-zinc-700'}`}
              onClick={() => setSelectedProduct(product)}
            >
              <div className="flex gap-4">
                <div className="w-24 h-24 rounded-xl overflow-hidden border border-zinc-800 flex-shrink-0 shadow-inner">
                  <img src={product.image} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base truncate">{product.title}</h3>
                  <p className="text-xs text-zinc-500 line-clamp-2 mt-1">{product.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
