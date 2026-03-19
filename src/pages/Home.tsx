import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'motion/react';
import { Upload, Wand2, Image as ImageIcon, Sparkles, Palette, ShoppingBag, Maximize2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { InteractiveCanvas } from '../components/InteractiveCanvas';
import { GoogleGenAI, Type } from "@google/genai";

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
    suggestedStyle: 'Modern',
    suggestedColors: ['#FFFFFF'],
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

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 1,
  } as any);

  const analyzeRoomDeeply = async (base64Image: string) => {
    setIsAnalyzing(true);
    console.log("Analiz başlatıldı...");
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-preview',
        contents: [
          {
            inlineData: {
              data: base64Image.split(',')[1],
              mimeType: base64Image.split(';')[0].split(':')[1]
            }
          },
          `Analyze this room photo. 
          1. PPI: Scale based on furniture (e.g., 5-10).
          2. Perspective: Estimate 'rotateY' (-15 to 15) and 'skewY' (-5 to 5) for the focal wall.
          3. Design: Style name, dominant Hex colors, and 1-sentence analysis.
          Output ONLY JSON: 
          { "pixelsPerInch": number, "rotateY": number, "skewY": number, "suggestedStyle": "string", "suggestedColors": ["hex"], "roomDescription": "string" }`
        ],
        config: { responseMimeType: "application/json" }
      });
      
      const data = JSON.parse(response.text);
      console.log("AI Verisi:", data);
      
      setAnalysis({
        ppi: data.pixelsPerInch || 5,
        rotateY: data.rotateY || 0,
        skewY: data.skewY || 0,
        suggestedStyle: data.suggestedStyle || 'Modern',
        suggestedColors: data.suggestedColors || ['#FFFFFF'],
        roomDescription: data.roomDescription || 'Ready for art.'
      });

      setRecommendations([{
        id: 'rec_ai',
        title: `${data.suggestedStyle} Expert Choice`,
        basePrice: 50,
        image: 'https://picsum.photos/seed/art_match/800/1200',
        category: data.suggestedStyle,
        description: data.roomDescription
      }]);
    } catch (e) {
      console.error("Analiz patladı:", e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCreateForMe = async () => {
    if (!user || isGenerating) return;
    if (useToken()) {
      setIsGenerating(true);
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const prompt = `Art for a ${analysis.suggestedStyle} room. Colors: ${analysis.suggestedColors.join(', ')}. Insight: ${analysis.roomDescription}. Create high-end gallery wall art.`;
        
        const response = await ai.models.generateContent({
          model: 'gemini-2.0-flash-exp',
          contents: { parts: [{ text: prompt }] },
          config: { imageConfig: { aspectRatio: orientation === 'portrait' ? "3:4" : "4:3" } }
        });

        let newArt = '';
        if (response.candidates?.[0]?.content?.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
              newArt = `data:image/png;base64,${part.inlineData.data}`;
              break;
            }
          }
        }

        if (newArt) {
          const newProduct: Product = {
            id: `gen_${Date.now()}`,
            title: 'Your AI Masterpiece',
            basePrice: 65,
            image: newArt,
            category: analysis.suggestedStyle,
            description: 'Intelligently crafted for your unique space.',
            isGenerated: true
          };
          setRecommendations([newProduct, ...recommendations]);
          setSelectedProduct(newProduct);
        }
      } catch (error) {
        console.error("Üretim hatası:", error);
      } finally {
        setIsGenerating(false);
      }
    }
  };

  const [pw, ph] = selectedSize.split('x').map(Number);
  const physicalWidth = orientation === 'portrait' ? pw : ph;
  const physicalHeight = orientation === 'portrait' ? ph : pw;

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-zinc-950 text-zinc-50 overflow-hidden font-sans">
      <div className="flex-1 p-6 flex flex-col relative">
        <div className="flex-1 relative rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-2xl">
          {isAnalyzing ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-zinc-950/90 z-20 backdrop-blur-xl">
              <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="font-mono text-sm uppercase tracking-[0.2em] animate-pulse">Deep Analyzing Room...</p>
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
            <div {...getRootProps()} className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-800/50 transition-all border-2 border-dashed border-zinc-800 m-4 rounded-xl">
              <input {...getInputProps()} />
              <div className="w-20 h-20 bg-zinc-800 rounded-3xl flex items-center justify-center mb-6">
                <Upload className="w-10 h-10 text-zinc-400" />
              </div>
              <p className="font-bold text-lg tracking-tight">Upload Your Room Photo</p>
              <p className="text-zinc-500 text-sm mt-2">AI will analyze scale and perspective automatically</p>
            </div>
          )}
        </div>
      </div>

      <div className="w-[450px] border-l border-zinc-800 bg-zinc-950 flex flex-col h-full overflow-y-auto">
        <div className="p-8 border-b border-zinc-800 sticky top-0 bg-zinc-950/95 backdrop-blur-md z-10">
          <button
            onClick={handleCreateForMe}
            disabled={isGenerating || isAnalyzing || !roomImage}
            className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-[0.1em] rounded-2xl transition-all shadow-[0_0_40px_rgba(99,102,241,0.2)] disabled:opacity-30 flex items-center justify-center gap-3"
          >
            {isGenerating ? <><Sparkles className="w-5 h-5 animate-spin" /> Designing...</> : <><Sparkles className="w-5 h-5" /> Make Me Feel Special</>}
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight">Expert Picks</h2>
            {analysis.suggestedStyle && <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-indigo-500/20">{analysis.suggestedStyle}</span>}
          </div>
          
          {recommendations.length === 0 && <p className="text-zinc-600 text-center py-12 italic">Analysis results will appear here</p>}

          {recommendations.map((product) => (
            <div 
              key={product.id}
              className={`rounded-[2rem] border p-5 transition-all duration-500 ${selectedProduct?.id === product.id ? 'border-indigo-500 bg-zinc-900 shadow-2xl' : 'border-zinc-800 hover:border-zinc-700 cursor-pointer'}`}
              onClick={() => setSelectedProduct(product)}
            >
              <div className="flex gap-6">
                <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-inner border border-zinc-800 flex-shrink-0">
                  <img src={product.image} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base truncate">{product.title}</h3>
                  <p className="text-xs text-zinc-500 mt-2 line-clamp-2 leading-relaxed italic">"{product.description}"</p>
                  <div className="flex items-center justify-between mt-4">
                    <p className="font-mono font-bold text-indigo-400">${(product.basePrice * SIZE_MULTIPLIERS[selectedSize]).toFixed(2)}</p>
                    <button className="p-2 bg-zinc-800 rounded-full hover:bg-indigo-600 transition-colors"><ShoppingBag className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
