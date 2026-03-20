import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Download, EyeOff, Trash2, Loader2, Sparkles, ShoppingCart, User as UserIcon } from 'lucide-react';
import { getUpscaledImage } from '../services/upscaleService';

export function Profile() {
  const { user, recommendations = [] } = useStore(); // recommendations boş dizi varsayıldı
  const [processingId, setProcessingId] = useState<string | null>(null);

  // recommendations undefined ise hata vermemesi için kontrol eklendi
  const myDesigns = Array.isArray(recommendations) 
    ? recommendations.filter(p => p && p.isGenerated) 
    : [];

  const handleDownloadProcess = async (id: string, originalUrl: string, title: string) => {
    setProcessingId(id);
    try {
      const finalImageUrl = await getUpscaledImage(id, originalUrl);
      const link = document.createElement('a');
      link.href = finalImageUrl;
      link.download = `${title.replace(/\s+/g, '-').toLowerCase()}-4k.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error(error);
      alert("İndirme hatası.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-3xl font-black uppercase italic tracking-tighter">My Studio</h1>
            <p className="text-zinc-500 text-[10px] uppercase tracking-widest mt-1">Inventory Management</p>
          </div>
          
          <div className="flex items-center gap-4 bg-zinc-900 px-5 py-2 rounded-2xl border border-zinc-800">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              {user?.name || user?.email || 'Guest'}
            </span>
            {user?.photoURL ? (
              <img src={user.photoURL} className="w-6 h-6 rounded-full" alt="Avatar" />
            ) : (
              <UserIcon className="w-6 h-6 text-zinc-600" />
            )}
          </div>
        </header>

        {myDesigns.length === 0 ? (
          <div className="text-center py-32 border-2 border-dashed border-zinc-900 rounded-[3rem]">
            <p className="text-zinc-600 font-mono text-[10px] uppercase tracking-widest italic">
              No designs found in your gallery.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {myDesigns.map((design) => (
              <div key={design.id} className="group bg-zinc-900 rounded-[2.5rem] overflow-hidden border border-zinc-800 hover:border-zinc-700 transition-all">
                <div className="aspect-[2/3] relative overflow-hidden bg-black">
                  <img src={design.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={design.title} />
                  
                  <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 backdrop-blur-md">
                    <button 
                      onClick={() => handleDownloadProcess(design.id, design.image, design.title)}
                      disabled={processingId === design.id}
                      className="w-52 py-4 bg-white text-black text-[10px] font-black uppercase rounded-2xl flex items-center justify-center gap-2 hover:bg-zinc-200 disabled:opacity-50"
                    >
                      {processingId === design.id ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                      ) : (
                        <><Download className="w-4 h-4" /> Download 4K</>
                      )}
                    </button>
                    <button className="w-52 py-4 bg-zinc-800 text-white text-[10px] font-black uppercase rounded-2xl flex items-center justify-center gap-2 hover:bg-zinc-700">
                      <ShoppingCart className="w-4 h-4" /> Order Print
                    </button>
                  </div>
                </div>

                <div className="p-8">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="font-bold text-sm uppercase italic tracking-tight">{design.title}</h3>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="px-2 py-0.5 bg-zinc-800 text-[8px] font-bold text-zinc-400 rounded uppercase tracking-widest font-mono">
                          {design.id.slice(-6)}
                        </span>
                      </div>
                    </div>
                    <button className="text-zinc-700 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <button 
                    className="w-full py-4 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase border border-indigo-500/20 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-sm"
                  >
                    <EyeOff className="w-3 h-3" /> Make Private ($5.00)
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
