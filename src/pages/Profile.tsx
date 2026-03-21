import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabase';
import { Download, EyeOff, Trash2, Loader2, User as UserIcon, Lock } from 'lucide-react';
import { getUpscaledImage } from '../services/upscaleService';

export function Profile() {
  const { user } = useStore();
  const [myDesigns, setMyDesigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchMyGallery();
  }, [user]);

  const fetchMyGallery = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .or(`creator_id.eq.${user?.id},owner_id.eq.${user?.id}`)
      .order('created_at', { ascending: false });

    if (!error) setMyDesigns(data || []);
    setLoading(false);
  };

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
      alert("Download failed.");
    } finally {
      setProcessingId(null);
    }
  };

  const makeItPrivate = async (productId: string) => {
    const { error } = await supabase
      .from('products')
      .update({ 
        stock: 0, 
        is_private: true, 
        owner_id: user?.id 
      })
      .eq('id', productId);

    if (!error) {
      alert("Success! This masterpiece is now exclusive to you and removed from the shop.");
      fetchMyGallery();
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
            <UserIcon className="w-6 h-6 text-zinc-600" />
          </div>
        </header>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>
        ) : myDesigns.length === 0 ? (
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
                  {/* HIZLANDIRMA EKLENTİSİ: Varsa thumbnail kullan, yoksa image_url */}
                  <img src={design.thumbnail_url || design.image_url} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={design.title} />
                  
                  <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 backdrop-blur-md">
                    <button 
                      onClick={() => handleDownloadProcess(design.id, design.image_url, design.title)}
                      disabled={processingId === design.id}
                      className="w-52 py-4 bg-white text-black text-[10px] font-black uppercase rounded-2xl flex items-center justify-center gap-2 hover:bg-zinc-200 disabled:opacity-50"
                    >
                      {processingId === design.id ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                      ) : (
                        <><Download className="w-4 h-4" /> Download 4K</>
                      )}
                    </button>
                  </div>
                </div>

                <div className="p-8">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="font-bold text-sm uppercase italic tracking-tight">{design.title}</h3>
                      <div className="flex items-center gap-2 mt-2 text-zinc-500">
                         {design.is_private && <Lock className="w-3 h-3 text-emerald-500" />}
                         <span className="text-[8px] font-mono uppercase tracking-widest">{design.id.slice(0, 8)}</span>
                      </div>
                    </div>
                  </div>

                  {!design.is_private && (
                    <button 
                      onClick={() => makeItPrivate(design.id)}
                      className="w-full py-4 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase border border-indigo-500/20 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-sm"
                    >
                      <EyeOff className="w-3 h-3" /> Make Private ($5.00)
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
