import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'motion/react';
import { Upload, Wand2, Image as ImageIcon, Sparkles, ShoppingBag } from 'lucide-react';
import { useStore } from '../store/useStore';
import { InteractiveCanvas } from '../components/InteractiveCanvas';
import { GoogleGenAI } from "@google/genai";

const FRAME_COLORS = { 'unframed': null, 'black': '#18181b', 'oak': '#8b5a2b' };

export function Home() {
  const { user, useToken } = useStore();
  const [roomImage, setRoomImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Analiz ve Perspektif State'leri
  const [analysis, setAnalysis] = useState({
    ppi: 6, // Başlangıçta daha küçük bir ölçek (Odayı kaplamaması için)
    rotateY: 0,
    skewY: 0,
    suggestedStyle: '',
    roomDescription: ''
  });

  const [selectedProduct, setSelectedProduct] = useState<any>(null); // BAŞLANGIÇTA NULL (Boş Çerçeve)
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
    // API KEY KONTROLÜ
    const apiKey = process.env.GEMINI_API_KEY || (import.meta as any).env.VITE_GEMINI_API_KEY;
    
    try {
      if (!apiKey) throw new Error("API Key Missing");
      
      const genAI = new GoogleGenAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = "Analyze this room for wall art. Estimate PPI (scale) for the wall (range 4-10). Calculate 'rotateY' (-15 to 15) and 'skewY' (-5 to 5) for perspective. Return ONLY JSON: { \"pixelsPerInch\": number, \"rotateY\": number, \"skewY\": number }";

      const result = await model.generateContent([
        prompt,
        { inlineData: { data: base64Image.split(',')[1], mimeType: "image/jpeg" } }
      ]);
      
      const text = (await result.response).text();
      const data = JSON.parse(text.replace(/```json/g, '').replace(/```/g, ''));
      
      setAnalysis({
        ppi: data.pixelsPerInch || 6,
        rotateY: data.rotateY || 0,
        skewY: data.skewY || 0,
        suggestedStyle: 'Modern',
        roomDescription: 'Analyzed space'
      });

      setRecommendations([
        { id: '1', title: 'Curated Match', image: 'https://picsum.photos/seed/art/800/1200', basePrice: 40, description: 'Matches your room style' }
      ]);
    } catch (e) {
      console.error("Analysis Pattı:", e);
      // Analiz patlasa bile posterin odayı kaplamasını engellemek için güvenli değerler:
      setAnalysis(prev => ({ ...prev, ppi: 6, rotateY: 0, skewY: 0 }));
    } finally {
      setIsAnalyzing(false);
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
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-zinc-950/80 z-20 backdrop-blur-sm font-mono text-sm uppercase tracking-widest">
              <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <span>Analyzing Space...</span>
            </div>
          ) : roomImage ? (
            <InteractiveCanvas 
              backgroundImage={roomImage} 
              mountedArt={selectedProduct?.image || null} 
              physicalWidth={physicalWidth}
              physicalHeight={physicalHeight}
              naturalPixelsPerInch={analysis.ppi}
              frameColor={(FRAME_COLORS as any)[selectedFrame]}
              perspective={{ rotateY: analysis.rotateY, skewY: analysis.skewY }}
            />
          ) : (
            <div {...getRootProps()} className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-800/50 transition-all border-2 border-dashed border-zinc-800 m-4 rounded-xl">
              <input {...getInputProps()} />
              <Upload className="w-12 h-12 mb-4 opacity-20" />
              <p className="font-mono text-xs uppercase tracking-widest opacity-40">Upload Room Image</p>
            </div>
          )}
        </div>
      </div>

      <div className="w-[450px] border-l border-zinc-800 bg-zinc-950 flex flex-col p-6 overflow-y-auto">
        <button className="w-full py-4 bg-emerald-600 text-white font-bold uppercase rounded-xl mb-8">MAKE ME FEEL SPECIAL</button>
        <h2 className="text-lg font-bold mb-6">Top Matches</h2>
        <div className="space-y-4">
          {recommendations.map((p) => (
            <div 
              key={p.id} 
              className={`p-4 border rounded-xl cursor-pointer transition-all ${selectedProduct?.id === p.id ? 'border-emerald-500 bg-zinc-900' : 'border-zinc-800'}`}
              onClick={() => setSelectedProduct(p)}
            >
              <div className="flex gap-4">
                <img src={p.image} className="w-16 h-16 rounded-lg object-cover" />
                <div>
                  <h3 className="font-bold text-sm">{p.title}</h3>
                  <p className="text-xs text-zinc-500 line-clamp-1">{p.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
