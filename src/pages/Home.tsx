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

  const [wallAnalysis, setWallAnalysis] = useState({
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
                  text: `
You are a world-class interior designer and spatial AI.

Analyze this room and return ONLY JSON:

{
  "wallCenterX": number,
  "wallCenterY": number,
  "wallWidthRatio": number,
  "rotateY": number,
  "skewY": number,
  "style": string,
  "roomDescription": string
}

Rules:
- detect largest empty wall
- avoid furniture overlap
- respect perspective
- realistic placement
`,
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
      const parsed = JSON.parse(data.candidates[0].content.parts[0].text.trim());

      setWallAnalysis({
        wallCenterX: parsed.wallCenterX ?? 0.35,
        wallCenterY: parsed.wallCenterY ?? 0.35,
        wallWidthRatio: parsed.wallWidthRatio ?? 0.45,
        rotateY: parsed.rotateY ?? 0,
        skewY: parsed.skewY ?? 0,
        suggestedStyle: parsed.style || 'Modern',
        roomDescription: parsed.roomDescription || '',
      });

      setRecommendations([
        {
          id: '1',
          title: `${parsed.style} Match`,
          image: 'https://picsum.photos/seed/art1/800/1200',
          basePrice: 40,
          description: parsed.roomDescription,
        },
      ]);

    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateCustomArt = async () => {
    if (!roomImage) return;

    const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: roomImage.split(',')[1],
                },
              },
              {
                text: `
Create a premium custom poster for this room.

Match:
- style
- colors
- mood

No text. High-end wall art.
`,
              },
            ],
          }],
        }),
      }
    );

    const data = await response.json();

    const imageBase64 = data.candidates?.[0]?.content?.parts?.find((p: any) => p.inline_data)?.inline_data?.data;

    if (imageBase64) {
      setSelectedProduct({
        id: 'custom',
        title: 'AI Artwork',
        image: `data:image/png;base64,${imageBase64}`,
        basePrice: 60,
        description: 'Custom generated',
      });
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
          {isAnalyzing ? (
            <div className="absolute inset-0 flex items-center justify-center">Analyzing...</div>
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
            <div {...getRootProps()} className="absolute inset-0 flex items-center justify-center cursor-pointer">
              <input {...getInputProps()} />
              <Upload />
            </div>
          )}
        </div>
      </div>

      <div className="w-[450px] p-6">
        <button onClick={generateCustomArt}>MAKE ME FEEL SPECIAL</button>

        {recommendations.map((p) => (
          <div key={p.id} onClick={() => setSelectedProduct(p)}>
            <img src={p.image} />
            <p>{p.title}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
