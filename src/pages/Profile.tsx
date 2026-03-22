import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { Download, EyeOff, Loader2, User as UserIcon, Lock, ShoppingBag, Sparkles, Package } from 'lucide-react';
import { getUpscaledImage } from '../services/upscaleService';

const API_URL = 'https://api.posterwallart.shop/api.php';

export function Profile() {
  const { user, accessToken } = useStore();
  const [myDesigns, setMyDesigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'studio' | 'orders'>('studio');

  useEffect(() => {
    if (user && accessToken) fetchMyGallery();
  }, [user, accessToken]);

  const fetchMyGallery = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}?action=get_my_products`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (data.success) setMyDesigns(data.products || []);
    } catch (e) {
      console.error('[Profile] Failed to fetch designs:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (design: any) => {
    if (!accessToken) { alert('Please log in again.'); return; }
    setProcessingId(design.id);
    try {
      const hiresUrl = await getUpscaledImage(
        String(design.id),
        design.primary_image || design.image_url,
        accessToken
      );

      // Force download
      const response = await fetch(hiresUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${design.title.replace(/\s+/g, '-').toLowerCase()}-4k.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error(error);
      alert('Download failed: ' + (error.message || 'Unknown error'));
    } finally {
      setProcessingId(null);
    }
  };

  const makeItPrivate = async (productId: string) => {
    if (!accessToken) return;
    try {
      await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'make_private', product_id: productId }),
      });
      alert('This masterpiece is now exclusive to you and removed from the shop.');
      fetchMyGallery();
    } catch (e) {
      alert('Failed to update privacy.');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-8 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black uppercase italic tracking-tighter">My Studio</h1>
            <p className="text-zinc-600 text-[9px] uppercase tracking-[0.2em] mt-0.5">Your Creative Universe</p>
          </div>
          <div className="flex items-center gap-3 bg-zinc-900 px-4 py-2 rounded-2xl border border-zinc-800">
            {user?.name && (
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                <span className="text-[10px] font-black text-emerald-400">{user.name[0].toUpperCase()}</span>
              </div>
            )}
            <div>
              <p className="text-[10px] font-bold text-white">{user?.name || 'Artist'}</p>
              <p className="text-[8px] text-zinc-500">{user?.email}</p>
            </div>
            <UserIcon className="w-4 h-4 text-zinc-600" />
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-6xl mx-auto px-8 flex gap-1 pb-0">
          <button
            onClick={() => setActiveTab('studio')}
            className={`flex items-center gap-2 px-5 py-3 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'studio' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
          >
            <Sparkles className="w-3 h-3" /> My Creations
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-5 py-3 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'orders' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
          >
            <Package className="w-3 h-3" /> Orders
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-10">

        {/* ── MY CREATIONS TAB ── */}
        {activeTab === 'studio' && (
          <>
            {/* Stats bar */}
            <div className="grid grid-cols-3 gap-4 mb-10">
              {[
                { label: 'Creations', value: myDesigns.length },
                { label: 'Available Tokens', value: user?.tokens ?? 0 },
                { label: 'Private Works', value: myDesigns.filter(d => d.is_private).length },
              ].map(stat => (
                <div key={stat.label} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                  <p className="text-2xl font-black text-white">{stat.value}</p>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            {loading ? (
              <div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-500" /></div>
            ) : myDesigns.length === 0 ? (
              <div className="text-center py-32 border-2 border-dashed border-zinc-900 rounded-[3rem]">
                <Sparkles className="w-10 h-10 text-zinc-700 mx-auto mb-4" />
                <p className="text-zinc-600 font-mono text-[10px] uppercase tracking-widest">No creations yet. Head to AI Studio!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {myDesigns.map((design) => (
                  <div key={design.id} className="group bg-zinc-900 rounded-[2rem] overflow-hidden border border-zinc-800 hover:border-zinc-700 transition-all">
                    <div className="aspect-[3/4] relative overflow-hidden bg-black">
                      <img
                        src={design.thumbnail_url || design.primary_image}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        alt={design.title}
                      />

                      {/* Private badge */}
                      {design.is_private && (
                        <div className="absolute top-3 right-3 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-full flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5 text-emerald-500" />
                          <span className="text-[8px] font-black text-emerald-500 uppercase">Private</span>
                        </div>
                      )}

                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/85 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 backdrop-blur-sm">
                        <button
                          onClick={() => handleDownload(design)}
                          disabled={processingId === String(design.id)}
                          className="w-48 py-3.5 bg-white text-black text-[9px] font-black uppercase rounded-2xl flex items-center justify-center gap-2 hover:bg-emerald-400 transition-all disabled:opacity-50"
                        >
                          {processingId === String(design.id) ? (
                            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing 4K...</>
                          ) : (
                            <><Download className="w-3.5 h-3.5" /> Download 4K</>
                          )}
                        </button>
                        <p className="text-[8px] text-zinc-400 uppercase tracking-wider">Free · Included with creation</p>
                      </div>
                    </div>

                    <div className="p-5">
                      <h3 className="font-bold text-xs uppercase italic tracking-tight truncate mb-1">{design.title}</h3>
                      <p className="text-[8px] text-zinc-600 uppercase tracking-widest mb-4">
                        {design.style_tags ? JSON.parse(design.style_tags)?.[0] : 'AI Art'} · {design.hires_url ? '4K Ready' : 'Standard'}
                      </p>

                      {!design.is_private && (
                        <button
                          onClick={() => makeItPrivate(String(design.id))}
                          className="w-full py-3 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-400 text-[9px] font-black uppercase border border-indigo-500/20 rounded-xl flex items-center justify-center gap-2 transition-all"
                        >
                          <EyeOff className="w-3 h-3" /> Make Private
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── ORDERS TAB ── */}
        {activeTab === 'orders' && (
          <div className="py-20 text-center border-2 border-dashed border-zinc-900 rounded-[3rem]">
            <ShoppingBag className="w-10 h-10 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-600 font-mono text-[10px] uppercase tracking-widest mb-2">No orders yet</p>
            <p className="text-zinc-700 text-[9px]">Physical poster orders will appear here once Stripe is connected</p>
          </div>
        )}
      </div>
    </div>
  );
}
