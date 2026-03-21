import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, Wand2, Image as ImageIcon, Sparkles, ShoppingBag, Maximize2, Palette, Type, Layout, Lock, Loader2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { InteractiveCanvas } from '../components/InteractiveCanvas';
import { AuthModal } from '../components/AuthModal';

// Categories matching your DB 'categories' table IDs
const DB_CATEGORIES = [
  { id: 1, name: 'Music' }, { id: 2, name: 'Movies' }, { id: 3, name: 'Anime' },
  { id: 4, name: 'Vintage' }, { id: 5, name: 'Botanical' }, { id: 6, name: 'Abstract' },
  { id: 7, name: 'Minimalist' }, { id: 17, name: 'Scandinavian' }, { id: 18, name: 'Pop Art' }
];

const STYLES = ['Minimalist', 'Bauhaus', 'Cyberpunk', 'Renaissance', 'Japandi', 'Pop Art', 'Vintage Poster'];
const SIZES = [
  { label: '8x10"', price: 22, value: '8x10' },
  { label: '11x14"', price: 24, value: '11x14' },
  { label: '16x20"', price: 26, value: '16x20' },
  { label: '18x24"', price: 26, value: '18x24' },
  { label: '20x30"', price: 39, value: '20x30' },
  { label: '24x36"', price: 49, value: '24x36' },
];
const FRAME_COLORS = { 'unframed': null, 'black': '#18181b', 'oak': '#8b5a2b' };

const base64ToBlob = (base64Data: string) => {
  const parts = base64Data.split(';base64,');
  const contentType = parts[0].split(':')[1] || 'image/png';
  const byteCharacters = atob(parts[1]);
  const byteArrays = [];
  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
  return new Blob(byteArrays, { type: contentType });
};

const createThumbnail = (base64: string, maxWidth = 400): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8)); 
      } else {
        resolve(base64); 
      }
      img.src = '';
    };
    img.src = base64;
  });
};

export function Home() {
  const { user, tokens, setTokens, setAuthModalOpen } = useStore();
  const [roomImage, setRoomImage] = useState<string | null>(null);
  const [refImage, setRefImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const [selectedSize, setSelectedSize] = useState(SIZES[3]); 
  const [selectedStyle, setSelectedStyle] = useState('Minimalist');
  const [selectedTheme, setSelectedTheme] = useState(DB_CATEGORIES[5]); 
  const [includeText, setIncludeText] = useState(false);
  const [selectedFrame, setSelectedFrame] = useState<'unframed' | 'black' | 'oak'>('black');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [analysisData, setAnalysisData] = useState<any>(null);

  const onDropRoom = useCallback((acceptedFiles: File[]) => {
    if (!user) { setAuthModalOpen(true); return; }
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
  }, [user, setAuthModalOpen]);

  const analyzeRoom = async (base64Image: string) => {
    setIsAnalyzing(true);
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [
            { text: "Analyze room for scale. Return PPI (5-10) and perspective. Return ONLY JSON: { \"ppi\": number, \"rotateY\": number, \"skewY\": number }" },
            { inlineData: { mimeType: "image/jpeg", data: base64Image.split(',')[1] } }
          ]}]
        })
      });
      if (response.ok) {
        const res = await response.json();
        const data = JSON.parse(res.candidates[0].content.parts[0].text.replace(/```json/g, '').replace(/```/g, '').trim());
        setAnalysisData(data);
      }
    } catch (e) { console.error("Room Analysis Error:", e); } finally { setIsAnalyzing(false); }
  };

  const handleCreateForMe = async () => {
    if (!user) { setAuthModalOpen(true); return; }
    if (tokens <= 0) { alert("Insufficient tokens."); return; }
    if (isGenerating) return; 

    setIsGenerating(true);
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    try {
      const prompt = `Create a high-end ${selectedStyle} poster with ${selectedTheme.name} theme. 8k, edge-to-edge. ${includeText ? 'Add text.' : 'No text.'}`;
      const contents: any = [{ parts: [{ text: prompt }] }];
      if (refImage) contents[0].parts.push({ inlineData: { mimeType: "image/jpeg", data: refImage.split(',')[1] } });

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents })
      });

      if (!response.ok) throw new Error("AI Busy.");
      const res = await response.json();
      const imgPart = res.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);

      if (imgPart?.inlineData) {
        let base64Image = `data:image/png;base64,${imgPart.inlineData.data}`;
        let thumbnailBase64 = await createThumbnail(base64Image);

        const formData = new FormData();
        formData.append('action', 'generate_and_save');
        formData.append('userId', user.id);
        formData.append('category_id', selectedTheme.id.toString());
        formData.append('price', selectedSize.price.toString());
        formData.append('metadata', JSON.stringify({ title: "AI Artwork", description: "Exclusive AI Wall Art", tags: ["art"] }));
        formData.append('mainImage', base64ToBlob(base64Image), 'art.png');
        formData.append('thumbnail', base64ToBlob(thumbnailBase64), 'thumb.jpg');

        const uploadRes = await fetch('https://posterwallart.shop/api.php', { method: 'POST', body: formData });
        const result = await uploadRes.json();

        if (result.success) {
          setRecommendations(prev => [result.product, ...prev.slice(0, 2)]);
          setSelectedProduct(result.product);
          setTokens(tokens - 1); // Sync tokens locally
        } else { throw new Error(result.error); }
      }
    } catch (e: any) { alert(e.message); } finally { setIsGenerating(false); }
  };

  const [pw, ph] = selectedSize.value.split('x').map(Number);
  return (
    <div className="flex h-[calc(100vh-4rem)] bg-zinc-950 text-zinc-50 overflow-hidden font-sans">
      <AuthModal />
      <div className="flex-1 p-6 flex flex-col relative">
        <div className="flex-1 relative rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800">
          {isAnalyzing ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-zinc-950/90 z-20">
              <Loader2 className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="font-mono text-[10px] uppercase tracking-widest text-emerald-500">Scanning room...</p>
            </div>
          ) : roomImage ? (
            <InteractiveCanvas 
              backgroundImage={roomImage} 
              mountedArt={selectedProduct?.thumbnail || selectedProduct?.image || null} 
              physicalWidth={orientation === 'portrait' ? pw : ph}
              physicalHeight={orientation === 'portrait' ? ph : pw}
              naturalPixelsPerInch={analysisData?.ppi || 6} 
              frameColor={(FRAME_COLORS as any)[selectedFrame]}
              perspective={{ rotateY: analysisData?.rotateY || 0, skewY: analysisData?.skewY || 0 }}
            />
          ) : (
            <div {...useDropzone({ onDrop: onDropRoom, accept: { 'image/*': [] }, maxFiles: 1 }).getRootProps()} className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer border-2 border-dashed border-zinc-800 m-8 rounded-3xl">
              <input {...useDropzone({ onDrop: onDropRoom, accept: { 'image/*': [] }, maxFiles: 1 }).getInputProps()} />
              <Upload className="w-12 h-12 opacity-20 mb-4" />
              <p className="font-mono text-xs uppercase opacity-30 tracking-widest">Upload Room Image</p>
            </div>
          )}
        </div>
      </div>

      <div className="w-[480px] border-l border-zinc-800 bg-zinc-950 flex flex-col h-full overflow-y-auto">
        <div className="p-6 space-y-8 pb-24">
          <button onClick={handleCreateForMe} disabled={isGenerating || !roomImage || (user && tokens <= 0)} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold uppercase rounded-xl transition-all disabled:opacity-20">
            {isGenerating ? 'Designing...' : 'Make Me Feel Special'}
          </button>
          <div className="space-y-6">
            <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block">Theme & Style</label>
                <div className="grid grid-cols-2 gap-2">
                    <select value={selectedTheme.id} onChange={(e)=>setSelectedTheme(DB_CATEGORIES.find(c => c.id === Number(e.target.value)) || DB_CATEGORIES[0])} className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-xs outline-none">
                        {DB_CATEGORIES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                    <select value={selectedStyle} onChange={(e)=>setSelectedStyle(e.target.value)} className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-xs outline-none">
                        {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>
            <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block">Size</label>
                <div className="grid grid-cols-3 gap-2">
                    {SIZES.map(s => (
                        <button key={s.value} onClick={()=>setSelectedSize(s)} className={`p-3 rounded-xl border text-[10px] font-bold transition-all ${selectedSize.value === s.value ? 'bg-zinc-100 text-zinc-900 border-zinc-100' : 'bg-zinc-900 text-zinc-400 border-zinc-800'}`}>
                            {s.label}
                        </button>
                    ))}
                </div>
            </div>
            {recommendations.length > 0 && (
              <div className="pt-6 border-t border-zinc-800 space-y-4">
                <h3 className="text-sm font-bold uppercase italic tracking-tighter">AI Studio Items</h3>
                {recommendations.map((p) => (
                  <div key={p.id} className={`p-4 border rounded-2xl cursor-pointer transition-all ${selectedProduct?.slug === p.slug ? 'border-emerald-500 bg-zinc-900' : 'border-zinc-800'}`} onClick={()=>setSelectedProduct(p)}>
                    <div className="flex gap-4 items-center">
                      <img src={p.thumbnail || p.image} className="w-14 h-14 rounded-lg object-cover" />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold truncate uppercase italic">{p.title}</h4>
                        <button className="text-[10px] text-emerald-500 font-bold mt-1 uppercase tracking-wider">Add to Cart • ${p.basePrice}</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
