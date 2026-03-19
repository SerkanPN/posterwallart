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
const FRAME_COLORS = { 'unframed': null, 'black': '#18181b', 'oak': '#8b5a2b' };

export function Home() {
  const { user, useToken, addToCart } = useStore();
  const [roomImage, setRoomImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [analysis, setAnalysis] = useState({
    ppi: 6, // Daha gerçekçi bir başlangıç ölçeği
    rotateY: 0,
    skewY: 0,
    suggestedStyle: '',
    suggestedColors: [] as string[],
    roomDescription: ''
  });

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null); // Başlangıçta boş
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
      const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY || "");
      const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-image-preview" });
      
      const prompt = `Analyze this room. 
          1. Perspective: Identify the wall. Estimate 'rotateY' (-20 to 20 deg) and 'skewY' (-10 to 10) for a poster.
          2. Scale: Estimate realistic PPI (pixels-per-inch). IF LARGE ROOM, PPI is around 4-6. IF SMALL, 8-10.
          3. Room style & dominant hex colors.
          Return ONLY JSON: 
          { "pixelsPerInch": number, "rotateY": number, "skewY": number, "suggestedStyle": "string", "suggestedColors": ["hex"], "roomDescription": "string" }`;

      const result = await model.generateContent([
        prompt,
        { inlineData: { data: base64Image.split(',')[1], mimeType: "image/jpeg" } }
      ]);
      
      const data = JSON.parse(result.response.text().replace(/```json/g, '').replace(/```/g, ''));
      
      setAnalysis({
        ppi: data.pixelsPerInch || 6,
        rotateY: data.rotateY || 0,
        skewY: data.skewY || 0,
        suggestedStyle: data.suggestedStyle,
        suggestedColors: data.suggestedColors,
        roomDescription: data.roomDescription
      });

      // Tavsiye edilen ürünleri doldur ama SEÇME (selectedProduct null kalmalı)
      setRecommendations([{
        id: 'rec_match',
        title: `${data.suggestedStyle} Style Match`,
        basePrice: 45,
        image: 'https://picsum.photos/seed/interior/800/1200',
        category: data.suggestedStyle,
        description: data.roomDescription
      }]);
    } catch (e) {
      console.error("Analysis failed");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCreateForMe = async () => {
    if (!user || isGenerating) return;
    if (useToken()) {
      setIsGenerating(true);
      try {
        const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY || "");
        const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-image-preview" });
        const prompt = `Art for a ${analysis.suggestedStyle} room. Colors: ${analysis.suggestedColors.join(', ')}. Context: ${analysis.roomDescription}.`;
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const imgPart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);

        if (imgPart?.inlineData) {
          const newArt = `data:image/png;base64,${imgPart.inlineData.data}`;
          const newProduct: Product = {
            id: `gen_${Date.now()}`,
            title: 'Your AI Art',
            basePrice: 65,
            image: newArt,
            category: analysis.suggestedStyle,
            description: 'Custom generated.',
            isGenerated: true
          };
          setRecommendations([newProduct, ...recommendations]);
          setSelectedProduct(newProduct);
        }
      } catch (error) {
        console.error("Gen failed");
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
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-zinc-950/80 z-20 backdrop-blur-sm">
              <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="font-mono text-sm uppercase">Analyzing Room...</p>
            </div>
          ) : roomImage ? (
            <InteractiveCanvas 
              backgroundImage={roomImage} 
              mountedArt={selectedProduct?.image || null} 
              physicalWidth={physicalWidth}
              physicalHeight={physicalHeight}
              naturalPixelsPerInch={analysis.ppi}
              frameColor={FRAME_COLORS[selectedFrame as keyof typeof FRAME_COLORS]}
              perspective={{ rotateY: analysis.rotateY, skewY: analysis.skewY }}
            />
          ) : (
            <div {...getRootProps()} className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-800/50 transition-all">
              <input {...getInputProps()} />
              <ImageIcon className="w-16 h-16 opacity-50 mb-4" />
              <p className="font-mono text-sm uppercase">Upload room photo</p>
            </div>
          )}
        </div>
      </div>

      <div className="w-[450px] border-l border-zinc-800 bg-zinc-950 flex flex-col h-full overflow-y-auto p-6">
        <button
          onClick={handleCreateForMe}
          disabled={isGenerating || isAnalyzing || !roomImage}
          className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold uppercase rounded-xl transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)] mb-8"
        >
          {isGenerating ? 'Designing...' : 'MAKE ME FEEL SPECIAL'}
        </button>

        <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Sparkles className="w-5 h-5 text-indigo-400" /> Top Matches</h2>
        <div className="space-y-4">
          {recommendations.map((product) => (
            <div 
              key={product.id}
              className={`rounded-xl border p-4 cursor-pointer transition-all ${selectedProduct?.id === product.id ? 'border-indigo-500 bg-zinc-900/50' : 'border-zinc-800 hover:border-zinc-700'}`}
              onClick={() => setSelectedProduct(product)}
            >
              <div className="flex gap-4">
                <img src={product.image} className="w-20 h-20 rounded-lg object-cover border border-zinc-800" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm truncate">{product.title}</h3>
                  <p className="text-[10px] text-zinc-500 line-clamp-2">{product.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
