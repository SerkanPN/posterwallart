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
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: [
          {
            inlineData: {
              data: base64Image.split(',')[1],
              mimeType: base64Image.split(';')[0].split(':')[1]
            }
          },
          `Analyze this room as a professional interior designer. 
          1. Perspective: Identify the main focal wall. Estimate 'rotateY' (-20 to 20 degrees) and 'skewY' (-10 to 10) so a poster fits perfectly flat on THAT wall.
          2. Scale: Based on items like beds or doors, estimate a realistic PPI (pixels-per-inch).
          3. Style & Color: Identify the interior style (e.g. Minimalist, Industrial) and dominant hex colors.
          4. Suggest an art theme that matches the vibe.
          Return ONLY JSON: 
          { "pixelsPerInch": number, "rotateY": number, "skewY": number, "suggestedStyle": "string", "suggestedColors": ["hex"], "roomDescription": "string" }`
        ],
        config: { responseMimeType: "application/json" }
      });
      
      const data = JSON.parse(response.text);
      setAnalysis({
        ppi: data.pixelsPerInch || 5,
        rotateY: data.rotateY || 0,
        skewY: data.skewY || 0,
        suggestedStyle: data.suggestedStyle,
        suggestedColors: data.suggestedColors,
        roomDescription: data.roomDescription
      });

      setRecommendations([{
        id: 'rec_match',
        title: `${data.suggestedStyle} Match`,
        basePrice: 45,
        image: 'https://picsum.photos/seed/style/800/1200',
        category: data.suggestedStyle,
        description: data.roomDescription
      }]);
    } catch (e) {
      console.error("Analysis failed:", e);
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
        const prompt = `Create high-end artistic wall art for a ${analysis.suggestedStyle} room. Colors: ${analysis.suggestedColors.join(', ')}. Insight: ${analysis.roomDescription}. The art must feel intentional and fit the room's energy perfectly.`;
        
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
            title: 'Your Custom AI Art',
            basePrice: 65,
            image: newArt,
            category: analysis.suggestedStyle,
            description: 'Generated based on your room analysis.',
            isGenerated: true
          };
          setRecommendations([newProduct, ...recommendations]);
          setSelectedProduct(newProduct);
        }
      } catch (error) {
        alert('Generation failed.');
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
        <div className="flex-1 relative rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800">
          {isAnalyzing ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-zinc-950/80 z-20 backdrop-blur-sm">
              <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="font-mono text-sm uppercase">Analyzing Space...</p>
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
            <div {...getRootProps()} className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-800/50 transition-all">
              <input {...getInputProps()} />
              <ImageIcon className="w-16 h-16 opacity-50 mb-4" />
              <p className="font-mono text-sm uppercase">Upload room photo to begin</p>
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
          {isGenerating ? 'Weaving Art...' : 'MAKE ME FEEL SPECIAL'}
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
                <img src={product.image} className="w-20 h-20 rounded-lg object-cover" />
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
