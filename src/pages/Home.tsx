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
  
  // Analiz Sonuçları
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

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 1,
  } as any);

  const analyzeRoomDeeply = async (base64Image: string) => {
    setIsAnalyzing(true);
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
          `Bu odayı profesyonel bir iç mimar gibi analiz et. 
          1. Odadaki eşyaların (yatak, kapı, masa) boyutuna bakarak duvar için gerçekçi bir PPI (pixels-per-inch) hesapla.
          2. Ana duvarın açısını bul: 'rotateY' (-15 ile 15 derece arası) ve 'skewY' (-5 ile 5 arası).
          3. Odanın stilini (Modern, Bohem, Endüstriyel vb.) ve dominant renk paletini belirle.
          4. Bu odaya en çok yakışacak poster temasını belirle.
          JSON olarak şu yapıda yanıt ver: 
          { "pixelsPerInch": sayı, "rotateY": sayı, "skewY": sayı, "suggestedStyle": "stil adı", "suggestedColors": ["hex1", "hex2"], "roomDescription": "kısa analiz" }`
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

      // İlk öneriyi oluştur
      setRecommendations([{
        id: 'rec_ai',
        title: `${data.suggestedStyle} Tasarımı`,
        basePrice: 50,
        image: 'https://picsum.photos/seed/interior/800/1200',
        category: data.suggestedStyle,
        description: data.roomDescription
      }]);
    } catch (e) {
      console.error("Analiz hatası:", e);
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
        const prompt = `Create a high-end wall art poster. 
        Style: ${analysis.suggestedStyle}. 
        Color Palette: ${analysis.suggestedColors.join(', ')}. 
        Context: It must perfectly match a room described as: ${analysis.roomDescription}. 
        The art should feel intentional and artistic, not like a stock photo.`;
        
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
            title: 'Odanıza Özel Başyapıt',
            basePrice: 65,
            image: newArt,
            category: analysis.suggestedStyle,
            description: 'Yapay zeka tarafından odanızın analizine göre üretildi.',
            isGenerated: true
          };
          setRecommendations([newProduct, ...recommendations]);
          setSelectedProduct(newProduct);
        }
      } catch (error) {
        alert('Görsel üretilemedi.');
      } finally {
        setIsGenerating(false);
      }
    }
  };

  const { w: physicalWidth, h: physicalHeight } = selectedSize.split('x').map(Number).reduce((acc, val, i) => {
    return orientation === 'portrait' ? (i === 0 ? { ...acc, w: val } : { ...acc, h: val }) : (i === 0 ? { ...acc, h: val } : { ...acc, w: val });
  }, { w: 0, h: 0 });

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-zinc-950 text-zinc-50 overflow-hidden">
      <div className="flex-1 p-6 flex flex-col relative">
        <div className="flex-1 relative rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800">
          {isAnalyzing ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-zinc-950/80 z-20 backdrop-blur-sm">
              <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="font-mono text-sm uppercase tracking-widest">Oda Analiz Ediliyor...</p>
            </div>
          ) : roomImage ? (
            <InteractiveCanvas 
              backgroundImage={roomImage} 
              mountedArt={selectedProduct?.image || null} 
              physicalWidth={physicalWidth}
              physicalHeight={physicalHeight}
              naturalPixelsPerInch={analysis.ppi}
              frameColor={FRAME_COLORS[selectedFrame]}
              // InteractiveCanvas'a bu yeni özellikleri de prop olarak göndermelisin
              // perspectiveData={{ rotateY: analysis.rotateY, skewY: analysis.skewY }}
            />
          ) : (
            <div {...getRootProps()} className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-800/50 transition-all">
              <input {...getInputProps()} />
              <ImageIcon className="w-16 h-16 opacity-50 mb-4" />
              <p className="font-mono text-sm uppercase">Oda fotoğrafı yükleyin</p>
            </div>
          )}
        </div>
      </div>

      <div className="w-[450px] border-l border-zinc-800 bg-zinc-950 flex flex-col h-full overflow-y-auto">
        <div className="p-6 border-b border-zinc-800 sticky top-0 bg-zinc-950/90 backdrop-blur-md z-10">
          <button
            onClick={handleCreateForMe}
            disabled={isGenerating || isAnalyzing || !roomImage}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold uppercase tracking-widest rounded-xl transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)]"
          >
            {isGenerating ? 'Sanat Üretiliyor...' : 'Benim İçin Tasarla'}
          </button>
          {analysis.suggestedStyle && (
            <p className="text-center text-emerald-500 text-[10px] mt-2 uppercase font-bold tracking-widest">
              Önerilen Stil: {analysis.suggestedStyle}
            </p>
          )}
        </div>

        <div className="p-6 space-y-4">
          <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" /> Uygun Seçenekler
          </h2>
          {recommendations.map((product) => (
            <div 
              key={product.id}
              className={`rounded-xl border p-4 transition-all ${selectedProduct?.id === product.id ? 'border-indigo-500 bg-zinc-900/50' : 'border-zinc-800 hover:border-zinc-700 cursor-pointer'}`}
              onClick={() => setSelectedProduct(product)}
            >
              <div className="flex gap-4">
                <img src={product.image} className="w-20 h-20 rounded-lg object-cover border border-zinc-800" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm truncate">{product.title}</h3>
                  <p className="text-[10px] text-zinc-500 mt-1 line-clamp-2">{product.description}</p>
                  <p className="text-xs font-bold mt-2 text-indigo-400">${(product.basePrice * SIZE_MULTIPLIERS[selectedSize]).toFixed(2)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
