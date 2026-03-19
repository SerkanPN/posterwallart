import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Move } from 'lucide-react';
import { useStore } from '../store/useStore';
import { InteractiveCanvas } from '../components/InteractiveCanvas';

const FRAME_COLORS = { 'unframed': null, 'black': '#18181b', 'oak': '#8b5a2b' };

export function Home() {
  const { user, useToken } = useStore();
  const [roomImage, setRoomImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);

  const [analysis, setAnalysis] = useState({
    ppi: 6,
    rotateY: 0,
    skewY: 0,
    suggestedStyle: '',
    roomDescription: ''
  });

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

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 1
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
                    data: base64Image.split(',')[1]
                  }
                },
                {
                  text: `Analyze this room for wall art placement. Return ONLY a raw JSON object, no markdown, no backticks, no explanation:
{"pixelsPerInch": <number 4-10, estimate wall scale>, "rotateY": <number -15 to 15, wall perspective angle>, "skewY": <number -5 to 5, vertical skew>, "suggestedStyle": "<one word: Modern/Minimalist/Bohemian/Industrial/Scandinavian>", "roomDescription": "<one short sentence describing the room>"}`
                }
              ]
            }],
            generationConfig: {
              response_mime_type: 'application/json'
            }
          })
        }
      );

      const data = await response.json();

      if (!response.ok || !data.candidates?.[0]?.content?.parts?.[0]?.text) {
        console.error('Gemini API error:', data);
        throw new Error(data.error?.message || 'No response from API');
      }

      const text = data.candidates[0].content.parts[0].text;
      const parsed = JSON.parse(text.trim());

      setAnalysis({
        ppi: parsed.pixelsPerInch || 6,
        rotateY: parsed.rotateY || 0,
        skewY: parsed.skewY || 0,
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

      <div className="w-[450px] border-l border-zinc-800 bg-zinc-950 flex flex-col p-6 overflow-y-auto">
        <button className="w-full py-4 bg-emerald-600 text-white font-bold uppercase rounded-xl mb-8">
          MAKE ME FEEL SPECIAL
        </button>
        <h2 className="text-lg font-bold mb-6">Top Matches</h2>
        <div className="space-y-4">
          {recommendations.map((p) => (
            <div
              key={p.id}
              className={`p-4 border rounded-xl cursor-pointer transition-all ${
                selectedProduct?.id === p.id
                  ? 'border-emerald-500 bg-zinc-900'
                  : 'border-zinc-800'
              }`}
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
