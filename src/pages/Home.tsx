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
    posterWidthRatio: number;
    rotateY: number;
    skewY: number;
    suggestedStyle: string;
    roomDescription: string;
  }>({
    wallCenterX: 0.5,
    wallCenterY: 0.32,
    posterWidthRatio: 0.18,
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
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`,
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
                  text: `Look at this room photo. I want to place a framed poster on the main empty wall.

Using the real objects in the room (sofa, chairs, doors, etc.) as size reference, estimate:

1. Where is the best empty wall spot for a poster? Give its center as wallCenterX (0=left edge, 1=right edge of image) and wallCenterY (0=top, 1=bottom).

2. How wide should the poster be to look realistic and proportional to the room? Give posterWidthRatio as a fraction of the total image width (e.g. a poster that takes up 20% of image width = 0.20).

3. What is the perspective angle of that wall? rotateY in degrees (negative=wall faces left, positive=wall faces right, 0=wall faces camera). skewY for any vertical tilt.

4. What interior style is this room? One word.

5. One sentence describing the room.

Return ONLY this JSON:
{
  "wallCenterX": <0.0 to 1.0>,
  "wallCenterY": <0.0 to 1.0>,
  "posterWidthRatio": <0.10 to 0.35>,
  "rotateY": <-20 to 20>,
  "skewY": <-5 to 5>,
  "suggestedStyle": "<style>",
  "roomDescription": "<sentence>"
}`,
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
        wallCenterX: parsed.wallCenterX ?? 0.5,
        wallCenterY: parsed.wallCenterY ?? 0.32,
        posterWidthRatio: parsed.posterWidthRatio ?? 0.18,
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
      <div className="flex-1 p-6 flex flex-col relative">
        <div className="flex-1 relative rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800">
          {!roomImage ? (
            <div
              {...getRootProps()}
              className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-800/50 transition-all border-2 border-dashed border-zinc-800 m-4 rounded-xl"
            >
              <input {...getInputProps()} />
              <Upload className="w-12 h-12 mb-4 opacity-20" />
              <p className="font-mono text-xs uppercase tracking-widest opacity-40">Upload Room Image</p>
            </div>
          ) : (
            <>
              <InteractiveCanvas
                backgroundImage={roomImage}
                mountedArt={selectedProduct?.image || null}
                aspectRatio={aspectRatio}
                wallCenterX={wallAnalysis.wallCenterX}
                wallCenterY={wallAnalysis.wallCenterY}
                posterWidthRatio={wallAnalysis.posterWidthRatio}
                frameColor={FRAME_COLORS[selectedFrame]}
                perspective={{ rotateY: wallAnalysis.rotateY, skewY: wallAnalysis.skewY }}
              />
              {isAnalyzing && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-zinc-900/90 backdrop-blur-sm px-4 py-2 rounded-full border border-zinc-700 z-20">
                  <div className="w-3 h-3 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <span className="font-mono text-xs uppercase tracking-widest text-zinc-400">Analyzing wall...</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="w-[450px] border-l border-zinc-800 bg-zinc-950 flex flex-col p-6 overflow-y-auto gap-6">
        <button className="w-full py-4 bg-emerald-600 text-white font-bold uppercase rounded-xl">
          MAKE ME FEEL SPECIAL
        </button>

        <div>
          <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-3">Size</h3>
          <div className="flex gap-2 flex-wrap">
            {['18x24', '24x36', '36x48'].map(size => (
              <button key={size} onClick={() => setSelectedSize(size)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${selectedSize === size ? 'border-emerald-500 text-emerald-400 bg-emerald-950' : 'border-zinc-700 text-zinc-400'}`}>
                {size}"
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-3">Orientation</h3>
          <div className="flex gap-2">
            {(['portrait', 'landscape'] as const).map(o => (
              <button key={o} onClick={() => setOrientation(o)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all capitalize ${orientation === o ? 'border-emerald-500 text-emerald-400 bg-emerald-950' : 'border-zinc-700 text-zinc-400'}`}>
                {o}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-3">Frame</h3>
          <div className="flex gap-2">
            {Object.entries(FRAME_COLORS).map(([key, color]) => (
              <button key={key} onClick={() => setSelectedFrame(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all capitalize ${selectedFrame === key ? 'border-emerald-500 text-emerald-400 bg-emerald-950' : 'border-zinc-700 text-zinc-400'}`}>
                {color && <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: color }} />}
                {key}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold mb-4">Top Matches</h2>
          <div className="space-y-4">
            {recommendations.map((p) => (
              <div key={p.id}
                className={`p-4 border rounded-xl cursor-pointer transition-all ${selectedProduct?.id === p.id ? 'border-emerald-500 bg-zinc-900' : 'border-zinc-800 hover:border-zinc-600'}`}
                onClick={() => setSelectedProduct(selectedProduct?.id === p.id ? null : p)}>
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
