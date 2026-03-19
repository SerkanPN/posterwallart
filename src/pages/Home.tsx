import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';
import { useStore } from '../store/useStore';
import { InteractiveCanvas } from '../components/InteractiveCanvas';

const FRAME_COLORS: Record<string, string | null> = {
  unframed: null,
  black: '#18181b',
  oak: '#8b5a2b',
};

export function Home() {
  const { user, useToken } = useStore();
  const [roomImage, setRoomImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);

  const [wallAnalysis, setWallAnalysis] = useState<{
    wallCenterX: number;
    wallCenterY: number;
    wallWidthRatio: number;
    rotateY: number;
    skewY: number;
    suggestedStyle: string;
    roomDescription: string;
  }>({
    wallCenterX: 0.35,
    wallCenterY: 0.35,
    wallWidthRatio: 0.45,
    rotateY: 0,
    skewY: 0,
    suggestedStyle: '',
    roomDescription: '',
  });

  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedSize, setSelectedSize] = useState('24x36');
  const [selectedFrame, setSelectedFrame] = useState('unframed');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setRoomImage(base64);
      analyzeRoom(base64);
    };
    reader.readAsDataURL(file);
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 1,
  });

  const analyzeRoom = async (base64Image: string) => {
    setIsAnalyzing(true);
    const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                {
                  inline_data: {
                    mime_type: 'image/jpeg',
                    data: base64Image.split(',')[1],
                  },
                },
                {
                  text: `You are analyzing a room photo to place a wall art poster on the main empty wall.

Analyze the image and return a JSON with these fields:
- wallCenterX: horizontal center of the best empty wall area for art placement, as a ratio 0.0 (left edge) to 1.0 (right edge) of the image width
- wallCenterY: vertical center of that wall area, as a ratio 0.0 (top) to 1.0 (bottom) of the image height  
- wallWidthRatio: how wide is that wall as a fraction of the total image width (0.1 to 0.9)
- rotateY: perspective tilt of the wall in degrees (-15 to 15, 0 if wall faces camera directly)
- skewY: vertical skew of the wall in degrees (-5 to 5, 0 if wall is straight)
- suggestedStyle: one word style (Modern/Minimalist/Bohemian/Industrial/Scandinavian)
- roomDescription: one short sentence describing the room

Example for a living room with the main wall on the left side:
{"wallCenterX":0.3,"wallCenterY":0.35,"wallWidthRatio":0.5,"rotateY":5,"skewY":0,"suggestedStyle":"Modern","roomDescription":"A bright minimalist living room with white walls."}

Return ONLY raw JSON, no markdown, no backticks, no explanation.`,
                },
              ],
            }],
            generationConfig: {
              response_mime_type: 'application/json',
            },
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.candidates?.[0]?.content?.parts?.[0]?.text) {
        console.error('Gemini API error:', data);
        throw new Error(data.error?.message || 'No response from API');
      }

      const text = data.candidates[0].content.parts[0].text;
      const parsed = JSON.parse(text.trim());
      console.log('🔍 Gemini Wall Analysis:', parsed);

      setWallAnalysis({
        wallCenterX: parsed.wallCenterX ?? 0.35,
        wallCenterY: parsed.wallCenterY ?? 0.35,
        wallWidthRatio: parsed.wallWidthRatio ?? 0.45,
        rotateY: parsed.rotateY ?? 0,
        skewY: parsed.skewY ?? 0,
        suggestedStyle: parsed.suggestedStyle || 'Modern',
        roomDescription: parsed.roomDescription || 'Analyzed space',
      });

      setRecommendations([{
        id: '1',
        title: 'Curated Match',
        image: 'https://picsum.photos/seed/art/800/1200',
        basePrice: 40,
        description: parsed.roomDescription || 'Matches your room style',
      }]);

    } catch (e) {
      console.error('Analysis failed:', e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const [pw, ph] = selectedSize.split('x').map(Number);
  const physicalWidth = orientation === 'portrait' ? pw : ph;
  const physicalHeight = orientation === 'portrait' ? ph : pw;
  const aspectRatio = physicalHeight / physicalWidth;

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-zinc-950 text-zinc-50 overflow-hidden">
      {/* Sol: Canvas */}
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
              aspectRatio={aspectRatio}
              wallCenterX={wallAnalysis.wallCenterX}
              wallCenterY={wallAnalysis.wallCenterY}
              wallWidthRatio={wallAnalysis.wallWidthRatio}
              frameColor={FRAME_COLORS[selectedFrame]}
              perspective={{ rotateY: wallAnalysis.rotateY, skewY: wallAnalysis.skewY }}
            />
          ) : (
            <div
              {...getRootProps()}
              className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-800/50 transition-all border-2 border-dashed border-zinc-800 m-4 rounded-xl"
            >
              <input {...getInputProps()} />
              <Upload className="w-12 h-12 mb-4 opacity-20" />
              <p className="font-mono text-xs uppercase tracking-widest opacity-40">Upload Room Image</p>
            </div>
          )}
        </div>
      </div>

      {/* Sağ: Panel */}
      <div className="w-[450px] border-l border-zinc-800 bg-zinc-950 flex flex-col p-6 overflow-y-auto gap-6">
        <button className="w-full py-4 bg-emerald-600 text-white font-bold uppercase rounded-xl">
          MAKE ME FEEL SPECIAL
        </button>

        {/* Boyut Seçici */}
        <div>
          <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-3">Size</h3>
          <div className="flex gap-2 flex-wrap">
            {['18x24', '24x36', '36x48'].map(size => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                  selectedSize === size
                    ? 'border-emerald-500 text-emerald-400 bg-emerald-950'
                    : 'border-zinc-700 text-zinc-400'
                }`}
              >
                {size}"
              </button>
            ))}
          </div>
        </div>

        {/* Yönelim */}
        <div>
          <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-3">Orientation</h3>
          <div className="flex gap-2">
            {(['portrait', 'landscape'] as const).map(o => (
              <button
                key={o}
                onClick={() => setOrientation(o)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all capitalize ${
                  orientation === o
                    ? 'border-emerald-500 text-emerald-400 bg-emerald-950'
                    : 'border-zinc-700 text-zinc-400'
                }`}
              >
                {o}
              </button>
            ))}
          </div>
        </div>

        {/* Çerçeve */}
        <div>
          <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-3">Frame</h3>
          <div className="flex gap-2">
            {Object.entries(FRAME_COLORS).map(([key, color]) => (
              <button
                key={key}
                onClick={() => setSelectedFrame(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all capitalize ${
                  selectedFrame === key
                    ? 'border-emerald-500 text-emerald-400 bg-emerald-950'
                    : 'border-zinc-700 text-zinc-400'
                }`}
              >
                {color && (
                  <span
                    className="inline-block w-2 h-2 rounded-full mr-1.5"
                    style={{ backgroundColor: color }}
                  />
                )}
                {key}
              </button>
            ))}
          </div>
        </div>

        {/* Top Matches */}
        <div>
          <h2 className="text-lg font-bold mb-4">Top Matches</h2>
          <div className="space-y-4">
            {recommendations.map((p) => (
              <div
                key={p.id}
                className={`p-4 border rounded-xl cursor-pointer transition-all ${
                  selectedProduct?.id === p.id
                    ? 'border-emerald-500 bg-zinc-900'
                    : 'border-zinc-800 hover:border-zinc-600'
                }`}
                onClick={() => setSelectedProduct(selectedProduct?.id === p.id ? null : p)}
              >
                <div className="flex gap-4 items-center">
                  <img src={p.image} className="w-16 h-16 rounded-lg object-cover" alt={p.title} />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm">{p.title}</h3>
                    <p className="text-xs text-zinc-500 line-clamp-2 mt-0.5">{p.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
