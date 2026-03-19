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

const SIZE_MULTIPLIERS = {
  '12x18': 1,
  '18x24': 1.5,
  '24x36': 2.2
};

const FRAME_PRICES = {
  'unframed': 0,
  'black': 20,
  'oak': 25
};

const FRAME_COLORS = {
  'unframed': null,
  'black': '#18181b',
  'oak': '#8b5a2b'
};

export function Home() {
  const { user, useToken, addToCart } = useStore();
  const [roomImage, setRoomImage] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Canvas & Product State
  const [naturalPPI, setNaturalPPI] = useState<number>(15); // Fallback PPI
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

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 1,
  } as any);

  const analyzeRoom = async (base64Image: string) => {
    setIsAnalyzing(true);
    setRecommendations(MOCK_RECOMMENDATIONS);
    if (!selectedProduct) setSelectedProduct(MOCK_RECOMMENDATIONS[0]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          {
            inlineData: {
              data: base64Image.split(',')[1],
              mimeType: base64Image.split(';')[0].split(':')[1]
            }
          },
          "Analyze this room image to determine its physical scale. Look for standard objects like beds, doors, chairs, or windows. Estimate the 'pixels per inch' (PPI) for the main focal wall where a poster would hang. For example, if a standard 80-inch door is 400 pixels tall in the image, the PPI would be 5. Return ONLY a JSON object with a single numeric field 'pixelsPerInch'."
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              pixelsPerInch: { type: Type.NUMBER }
            },
            required: ["pixelsPerInch"]
          }
        }
      });
      const data = JSON.parse(response.text);
      if (data.pixelsPerInch) {
        setNaturalPPI(data.pixelsPerInch);
      }
    } catch (e) {
      console.error("Failed to analyze room scale:", e);
      setNaturalPPI(15); // Fallback
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
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const prompt = `A highly detailed poster art piece in the style of ${selectedStyle || 'Abstract'}, using a color palette of ${selectedColor || 'various colors'}. Suitable for modern home decor.`;
        
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [{ text: prompt }],
          },
          config: {
            imageConfig: {
              aspectRatio: orientation === 'portrait' ? "3:4" : "4:3",
            }
          }
        });

        let newArt = '';
        if (response.candidates && response.candidates[0] && response.candidates[0].content && response.candidates[0].content.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
              const base64EncodeString = part.inlineData.data;
              newArt = `data:image/png;base64,${base64EncodeString}`;
              break;
            }
          }
        }

        if (newArt) {
          const newProduct: Product = {
            id: `gen_${Date.now()}`,
            title: 'AI Generated Masterpiece',
            basePrice: 65,
            image: newArt,
            category: selectedStyle || 'Abstract',
            description: `A custom poster featuring a ${selectedStyle || 'unique'} style generated specifically for your space.`,
            isGenerated: true
          };
          setRecommendations([newProduct, ...recommendations]);
          setSelectedProduct(newProduct);
        } else {
          throw new Error('No image returned from AI');
        }
      } catch (error) {
        console.error('Failed to generate image:', error);
        alert('Failed to generate image. Please try again.');
      } finally {
        setIsGenerating(false);
      }
    } else {
      alert('Not enough tokens. Please purchase more.');
    }
  };

  const getPhysicalDimensions = () => {
    const [w, h] = selectedSize.split('x').map(Number);
    return orientation === 'portrait' ? { w, h } : { w: h, h: w };
  };

  const calculatePrice = (product: Product) => {
    const sizeMultiplier = SIZE_MULTIPLIERS[selectedSize];
    const framePrice = FRAME_PRICES[selectedFrame];
    return (product.basePrice * sizeMultiplier) + framePrice;
  };

  const { w: physicalWidth, h: physicalHeight } = getPhysicalDimensions();

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-zinc-950 text-zinc-50 overflow-hidden">
      {/* Left Panel: Canvas Area */}
      <div className="flex-1 p-6 flex flex-col relative">
        <div className="flex-1 relative rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800">
          {isAnalyzing ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-zinc-500 bg-zinc-950/80 z-20 backdrop-blur-sm">
              <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
              <p className="font-mono text-sm uppercase tracking-widest animate-pulse">Analyzing Space Scale...</p>
            </div>
          ) : roomImage ? (
            <InteractiveCanvas 
              backgroundImage={roomImage} 
              mountedArt={selectedProduct?.image || null} 
              physicalWidth={physicalWidth}
              physicalHeight={physicalHeight}
              naturalPixelsPerInch={naturalPPI}
              frameColor={FRAME_COLORS[selectedFrame]}
            />
          ) : (
            <div 
              {...getRootProps()} 
              className={`absolute inset-0 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${isDragActive ? 'bg-indigo-500/10' : 'hover:bg-zinc-800/50'}`}
            >
              <input {...getInputProps()} />
              <ImageIcon className="w-16 h-16 opacity-50 mb-4" />
              <p className="font-mono text-sm uppercase tracking-widest text-zinc-400">Upload a room photo to begin</p>
              <p className="text-xs text-zinc-600 mt-2">Drag & drop or click to browse</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel: Sidebar Controls & Recommendations */}
      <div className="w-[450px] border-l border-zinc-800 bg-zinc-950 flex flex-col h-full overflow-y-auto">
        
        {/* Hero Button Section */}
        <div className="p-6 border-b border-zinc-800 sticky top-0 bg-zinc-950/90 backdrop-blur-md z-10 flex flex-col">
          <button
            onClick={handleCreateForMe}
            disabled={isGenerating || isAnalyzing || !roomImage}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white text-base font-bold uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_40px_rgba(16,185,129,0.5)] border border-emerald-400/30"
          >
            {isGenerating ? (
              <><Sparkles className="w-5 h-5 animate-spin" /> Weaving Magic...</>
            ) : (
              <><Sparkles className="w-5 h-5" /> Make Me Feel Special</>
            )}
          </button>
          <p className="text-center text-emerald-500/80 text-xs mt-3 font-medium tracking-wide">
            A unique design crafted exclusively for your space.
          </p>
        </div>

        {/* Product List */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold tracking-tight">Top Matches</h2>
          </div>

          {recommendations.length === 0 && !roomImage && (
            <p className="text-sm text-zinc-500 text-center py-8">Upload a room photo to see AI recommendations.</p>
          )}

          {recommendations.map((product) => {
            const isSelected = selectedProduct?.id === product.id;
            
            return (
              <div 
                key={product.id}
                className={`rounded-xl border transition-all duration-200 overflow-hidden ${isSelected ? 'border-indigo-500 bg-zinc-900/50' : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700 cursor-pointer'}`}
                onClick={() => !isSelected && setSelectedProduct(product)}
              >
                <div className="p-4 flex gap-4">
                  <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 border border-zinc-800 bg-zinc-900 relative">
                    <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
                    {product.isGenerated && (
                      <div className="absolute top-1 right-1 bg-yellow-500/20 text-yellow-500 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">
                        AI
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm truncate">{product.title}</h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-zinc-400">
                      <span className="flex items-center gap-1"><Maximize2 className="w-3 h-3" /> {selectedSize}"</span>
                      <span className="font-medium text-zinc-200">${calculatePrice(product).toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-2 line-clamp-2 leading-relaxed">{product.description}</p>
                  </div>
                </div>

                {/* Expanded Configurator */}
                {isSelected && (
                  <div className="px-4 pb-4 pt-2 border-t border-zinc-800/50 space-y-4">
                    
                    {/* Size Selection */}
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2 block">Size</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['12x18', '18x24', '24x36'] as SizeType[]).map(size => (
                          <button
                            key={size}
                            onClick={(e) => { e.stopPropagation(); setSelectedSize(size); }}
                            className={`py-2 text-xs font-medium rounded-lg border transition-colors ${selectedSize === size ? 'bg-zinc-100 text-zinc-900 border-zinc-100' : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-600'}`}
                          >
                            {size}"
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Orientation */}
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2 block">Orientation</label>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); setOrientation('portrait'); }}
                          className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors ${orientation === 'portrait' ? 'bg-zinc-800 text-zinc-100 border-zinc-700' : 'bg-zinc-950 text-zinc-500 border-zinc-800 hover:border-zinc-700'}`}
                        >
                          Portrait
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setOrientation('landscape'); }}
                          className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors ${orientation === 'landscape' ? 'bg-zinc-800 text-zinc-100 border-zinc-700' : 'bg-zinc-950 text-zinc-500 border-zinc-800 hover:border-zinc-700'}`}
                        >
                          Landscape
                        </button>
                      </div>
                    </div>

                    {/* Frame Selection */}
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2 block">Frame</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['unframed', 'black', 'oak'] as FrameType[]).map(frame => (
                          <button
                            key={frame}
                            onClick={(e) => { e.stopPropagation(); setSelectedFrame(frame); }}
                            className={`py-2 flex flex-col items-center gap-1 rounded-lg border transition-colors ${selectedFrame === frame ? 'bg-zinc-800 border-zinc-600' : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'}`}
                          >
                            <div className="w-6 h-6 rounded flex items-center justify-center border border-zinc-700" style={{ backgroundColor: FRAME_COLORS[frame] || '#f4f4f5' }}>
                              {frame === 'unframed' && <div className="w-4 h-4 border border-dashed border-zinc-400" />}
                            </div>
                            <span className="text-[10px] capitalize text-zinc-400">{frame}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Buy Button */}
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        addToCart({ ...product, price: calculatePrice(product), type: 'physical' }); 
                      }}
                      className="w-full py-3 bg-zinc-100 hover:bg-white text-zinc-900 font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 mt-2"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      Buy Now - ${calculatePrice(product).toFixed(2)}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
