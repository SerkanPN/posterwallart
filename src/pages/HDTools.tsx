
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Loader2, Download, Maximize, Box, Sparkles, Layers, Image as ImageIcon, Zap } from 'lucide-react';
import { useStore } from '../store/useStore';

interface ToolResult {
  id: string;
  type: 'upscale' | 'vector' | 'gen';
  url: string;
  originalUrl?: string;
  cost: number;
  timestamp: number;
}

const CUSTOM_MODELS = [
  { id: 'rundiffusion:133005@198530', name: 'JuggernautXL V6', group: 'Checkpoint', supportsLora: true },
  { id: 'rundiffusion:211@100', name: 'Pixelwave Schnell 0.4', group: 'Checkpoint', supportsLora: true },
  { id: 'runware:101@1', name: 'FLUX.1 Dev', group: 'FLUX', supportsLora: true },
  { id: 'runware:100@1', name: 'FLUX.1 Schnell', group: 'FLUX', supportsLora: true },
];

const CUSTOM_LORAS = [
  { id: 'civitai:126208@137927', name: 'Style of Alan Lee (Watercolor)' },
  { id: 'civitai:669566@749527', name: 'Style of Rembrandt [FLUX]' },
  { id: 'civitai:669558@749519', name: 'Style of Art Frahm [FLUX]' },
  { id: 'civitai:660637@739480', name: 'Style of Moebius [FLUX]' },
  { id: 'civitai:829769@928048', name: 'Style of Studio Ghibli [FLUX]' },
  { id: 'civitai:650132@734495', name: 'Style of Vincent van Gogh [FLUX]' },
  { id: 'civitai:845851@946309', name: 'Style of Jean-Pierre Gibrat [FLUX]' },
  { id: 'civitai:669423@749374', name: 'Style of Leonardo da Vinci [FLUX]' },
  { id: 'civitai:756659@846206', name: 'Dual-vector Foil Style' },
  { id: 'civitai:1210874@1363831', name: 'Style of Gustave Dore [FLUX]' },
  { id: 'civitai:746347@834608', name: 'Style of Roberto Ferri [FLUX]' },
  { id: 'civitai:753238@842298', name: 'Style of Anato Finnstark [FLUX]' },
  { id: 'civitai:726034@811865', name: 'Style of Winifred Nicholson [FLUX]' },
  { id: 'civitai:700509@783806', name: 'Style of Keith Haring [FLUX]' }
];

export function HDTools() {
  const { tokens, useToken, accessToken } = useStore();
  const [activeTab, setActiveTab] = useState<'gen' | 'upscale' | 'vector'>('gen');
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<ToolResult[]>([]);
  const [uploadImage, setUploadImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState(CUSTOM_MODELS[0]);
  const [selectedLora, setSelectedLora] = useState("");
  const [loraWeight, setLoraWeight] = useState(0.8);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    console.log("[LOG] File dropped for processing");
    const file = acceptedFiles[0];
    const reader = new FileReader();
    reader.onload = (e) => setUploadImage(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const { getRootProps, getInputProps } = useDropzone({ onDrop, accept: { 'image/*': [] }, maxFiles: 1 });

  const handleGenerate = async () => {
    console.log("[LOG] HD Lab: Starting generation");
    if (!prompt || tokens <= 0 || isProcessing) return;
    setIsProcessing(true);
    try {
      const task: any = {
        taskType: "imageInference",
        taskUUID: crypto.randomUUID(),
        model: selectedModel.id,
        positivePrompt: prompt,
        width: 1024, height: 1024,
        numberResults: 1, outputType: "URL", outputFormat: "PNG"
      };
      if (selectedLora) task.lora = [{ model: selectedLora, weight: loraWeight }];
      const res = await fetch('/api/runware', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([task])
      });
      const data = await res.json();
      if (data.errors) throw new Error(data.errors[0].message);
      useToken();
      const newResult: ToolResult = {
        id: crypto.randomUUID(),
        type: 'gen',
        url: data.data[0].imageURL,
        cost: data.data[0].cost || 0,
        timestamp: Date.now()
      };
      setResults(prev => [newResult, ...prev]);
      console.log("[LOG] Gen success:", newResult.url);
    } catch (e: any) {
      console.error("[ERROR] Lab Gen failed:", e.message);
      alert(e.message);
    } finally { setIsProcessing(false); }
  };

  const handleUpscale = async () => {
    console.log("[LOG] HD Lab: Starting Upscale");
    if (!uploadImage || isProcessing) return;
    setIsProcessing(true);
    try {
      const res = await fetch('/api/upscale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: uploadImage })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const newResult: ToolResult = {
        id: crypto.randomUUID(),
        type: 'upscale',
        url: data.upscaledUrl,
        originalUrl: uploadImage,
        cost: data.cost || 0,
        timestamp: Date.now()
      };
      setResults(prev => [newResult, ...prev]);
      console.log("[LOG] Upscale success:", newResult.url);
    } catch (e: any) {
      console.error("[ERROR] Lab Upscale failed:", e.message);
      alert(e.message);
    } finally { setIsProcessing(false); }
  };

  const handleVectorize = async () => {
    console.log("[LOG] HD Lab: Starting Vectorization");
    if (!uploadImage || isProcessing) return;
    setIsProcessing(true);
    try {
      const res = await fetch('/api/vectorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: uploadImage })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const newResult: ToolResult = {
        id: crypto.randomUUID(),
        type: 'vector',
        url: data.svgUrl,
        originalUrl: uploadImage,
        cost: data.cost || 0,
        timestamp: Date.now()
      };
      setResults(prev => [newResult, ...prev]);
      console.log("[LOG] Vectorize success:", newResult.url);
    } catch (e: any) {
      console.error("[ERROR] Lab Vectorize failed:", e.message);
      alert(e.message);
    } finally { setIsProcessing(false); }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-12">
        <header className="flex items-center justify-between border-b border-zinc-800 pb-8">
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter flex items-center gap-3">
              <Zap className="text-emerald-500 fill-emerald-500" />
              HD TOOLS & VECTOR LAB
            </h1>
            <p className="text-zinc-500 text-sm mt-1 uppercase tracking-widest font-bold">Powered by Runware AI Altimeters</p>
          </div>
          <div className="px-4 py-2 bg-zinc-900 rounded-xl border border-zinc-800 flex items-center gap-3">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-bold uppercase tracking-tighter">Credits: {tokens}</span>
          </div>
        </header>

        <div className="flex gap-2 p-1 bg-zinc-900 rounded-2xl w-fit border border-zinc-800">
          <button onClick={() => setActiveTab('gen')} className={`px-6 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'gen' ? 'bg-zinc-100 text-zinc-950' : 'text-zinc-500 hover:text-zinc-300'}`}>
            <Sparkles className="w-4 h-4" /> GENERATE
          </button>
          <button onClick={() => setActiveTab('upscale')} className={`px-6 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'upscale' ? 'bg-zinc-100 text-zinc-950' : 'text-zinc-500 hover:text-zinc-300'}`}>
            <Maximize className="w-4 h-4" /> HD UPSCALE
          </button>
          <button onClick={() => setActiveTab('vector')} className={`px-6 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'vector' ? 'bg-zinc-100 text-zinc-950' : 'text-zinc-500 hover:text-zinc-300'}`}>
            <Box className="w-4 h-4" /> VECTORIZE (SVG)
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div className="space-y-8 bg-zinc-900/50 p-8 rounded-3xl border border-zinc-800 backdrop-blur-xl">
            {activeTab === 'gen' ? (
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Engine Selection</label>
                  <select value={selectedModel.id} onChange={(e) => setSelectedModel(CUSTOM_MODELS.find(m => m.id === e.target.value) || CUSTOM_MODELS[0])} className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-2xl text-xs outline-none focus:border-emerald-500 transition-colors">
                    {CUSTOM_MODELS.map(m => <option key={m.id} value={m.id}>{m.name} ({m.group})</option>)}
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Style Adapter (TangBohu List)</label>
                  <div className="flex gap-2">
                    <select value={selectedLora} onChange={(e) => setSelectedLora(e.target.value)} className="flex-1 bg-zinc-950 border border-zinc-800 p-4 rounded-2xl text-xs outline-none focus:border-emerald-500 transition-colors">
                      <option value="">None (Base Style)</option>
                      {CUSTOM_LORAS.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                    <input type="number" value={loraWeight} onChange={(e) => setLoraWeight(parseFloat(e.target.value))} step="0.1" className="w-20 bg-zinc-950 border border-zinc-800 p-4 rounded-2xl text-xs outline-none" title="Strength" />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Artistic Prompt</label>
                  <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Describe the masterpiece..." className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-2xl text-xs outline-none h-32 focus:border-emerald-500 resize-none transition-colors" />
                </div>
                <button onClick={handleGenerate} disabled={isProcessing} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase rounded-2xl transition-all shadow-[0_0_30px_rgba(16,185,129,0.2)] disabled:opacity-50">
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'START PRODUCTION'}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div {...getRootProps()} className="border-2 border-dashed border-zinc-800 rounded-3xl p-12 hover:bg-zinc-950 cursor-pointer text-center group transition-all">
                  <input {...getInputProps()} />
                  {uploadImage ? (
                    <img src={uploadImage} className="max-h-64 mx-auto rounded-2xl shadow-2xl" alt="Upload" />
                  ) : (
                    <div className="space-y-4">
                      <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                        <Upload className="w-8 h-8 text-zinc-500" />
                      </div>
                      <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Drop image to process</p>
                    </div>
                  )}
                </div>
                <button onClick={activeTab === 'upscale' ? handleUpscale : handleVectorize} disabled={!uploadImage || isProcessing} className="w-full py-4 bg-zinc-100 hover:bg-white text-zinc-950 font-black uppercase rounded-2xl transition-all disabled:opacity-50">
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : activeTab === 'upscale' ? 'PROCESS HD UPSCALE' : 'PROCESS VECTOR CONVERSION'}
                </button>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500 flex items-center gap-2">
              <Layers className="w-3 h-3" /> SESSION OUTPUTS
            </h2>
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-hide">
              {results.length === 0 && (
                <div className="p-12 border border-zinc-800 border-dashed rounded-3xl text-center">
                  <ImageIcon className="w-8 h-8 text-zinc-800 mx-auto mb-3" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-700">No results in current session</p>
                </div>
              )}
              {results.map((res) => (
                <div key={res.id} className="bg-zinc-900 border border-zinc-800 p-4 rounded-3xl flex gap-4 items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="relative group">
                    <img src={res.url} className="w-20 h-20 rounded-xl object-cover border border-zinc-800" alt="Result" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                      <a href={res.url} target="_blank" rel="noreferrer" className="text-white p-2 hover:scale-110 transition-transform"><Maximize className="w-4 h-4" /></a>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md ${res.type === 'gen' ? 'bg-emerald-500/20 text-emerald-400' : res.type === 'vector' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'}`}>
                        {res.type}
                      </span>
                      <span className="text-[8px] text-zinc-600 font-bold tracking-tighter">
                        {new Date(res.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-tighter">Maliyet: ${res.cost.toFixed(4)}</p>
                    <a href={res.url} download={`${res.type}_result.${res.type === 'vector' ? 'svg' : 'png'}`} className="inline-flex items-center gap-1.5 text-[10px] text-zinc-100 font-black uppercase mt-2 border-b border-zinc-700 pb-0.5 hover:text-emerald-400 hover:border-emerald-400 transition-all">
                      <Download className="w-3 h-3" /> DOWNLOAD {res.type === 'vector' ? 'SVG' : 'PNG'}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
