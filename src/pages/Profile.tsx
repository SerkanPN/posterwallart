import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { Download, EyeOff, Loader2, User as UserIcon, Lock, ShoppingBag, Sparkles, Package, X, ShoppingCart, Zap, ExternalLink } from 'lucide-react';
import { getUpscaledImage } from '../services/upscaleService';
import { Link } from 'react-router-dom';

const API_URL = 'https://api.posterwallart.shop/api.php';

const VARIANTS = [
  { id: 'digi',  label: 'Digital Download',            price: 1  },
  { id: 'comm',  label: 'Digital + Commercial Rights', price: 5  },
  { id: '8x10',  label: '8×10" Physical Poster',       price: 24 },
  { id: '11x14', label: '11×14" Physical Poster',      price: 28 },
  { id: '16x20', label: '16×20" Physical Poster',      price: 32 },
  { id: '18x24', label: '18×24" Physical Poster',      price: 36 },
  { id: '20x30', label: '20×30" Physical Poster',      price: 40 },
  { id: '24x36', label: '24×36" Physical Poster',      price: 44 },
];

export function Profile() {
  const { user, accessToken, addToCart } = useStore();
  const [myDesigns, setMyDesigns]         = useState<any[]>([]);
  const [loading, setLoading]             = useState(true);
  const [processingId, setProcessingId]   = useState<string | null>(null);
  const [activeTab, setActiveTab]         = useState<'studio' | 'orders'>('studio');
  const [selectedDesign, setSelectedDesign] = useState<any | null>(null);
  const [selectedVariant, setSelectedVariant] = useState(VARIANTS[0]);

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
    setProcessingId(String(design.id));
    try {
      const hiresUrl = await getUpscaledImage(
        String(design.id),
        design.primary_image || design.image_url,
        accessToken
      );
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
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'make_private', product_id: productId }),
      });
      alert('This masterpiece is now exclusive to you and removed from the shop.');
      fetchMyGallery();
      setSelectedDesign(null);
    } catch (e) { alert('Failed to update privacy.'); }
  };

  const openModal = (design: any) => {
    setSelectedDesign(design);
    setSelectedVariant(VARIANTS[0]);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans">

      {/* ── PRODUCT MODAL ──────────────────────────────────────── */}
      {selectedDesign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={() => setSelectedDesign(null)}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0">

              {/* Image */}
              <div className="relative aspect-[3/4] bg-black rounded-l-[2.5rem] overflow-hidden">
                <img
                  src={selectedDesign.primary_image || selectedDesign.thumbnail_url}
                  alt={selectedDesign.title}
                  className="w-full h-full object-cover"
                />
                <button onClick={() => setSelectedDesign(null)} className="absolute top-4 right-4 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center hover:bg-black transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Details */}
              <div className="p-8 flex flex-col gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-full flex items-center gap-1">
                      <Zap className="w-2.5 h-2.5" /> AI Masterpiece
                    </span>
                    {selectedDesign.is_private && (
                      <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/10 border border-indigo-500/20 px-2 py-1 rounded-full flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> Private
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-black uppercase italic tracking-tighter leading-tight mb-1">{selectedDesign.title}</h2>
                  <p className="text-zinc-500 text-[10px] uppercase tracking-widest">{selectedDesign.category || 'AI Art'}</p>
                </div>

                {/* Download (free for creator) */}
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4">
                  <p className="text-[9px] text-emerald-400 font-black uppercase tracking-widest mb-2">Your Creation · Free Download</p>
                  <button
                    onClick={() => handleDownload(selectedDesign)}
                    disabled={processingId === String(selectedDesign.id)}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {processingId === String(selectedDesign.id) ? (
                      <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing 4K...</>
                    ) : (
                      <><Download className="w-3.5 h-3.5" /> Download 4K · 300dpi · Free</>
                    )}
                  </button>
                </div>

                {/* Variants */}
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-3">Buy Additional Format</p>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {VARIANTS.map(v => (
                      <button
                        key={v.id}
                        onClick={() => setSelectedVariant(v)}
                        className={`p-3 rounded-xl border text-left transition-all ${selectedVariant.id === v.id ? 'border-emerald-500 bg-emerald-500/5' : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'}`}
                      >
                        <p className="text-[9px] font-black uppercase leading-tight mb-0.5">{v.label}</p>
                        <p className="text-emerald-500 font-black text-sm">${v.price}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Add to cart */}
                <button
                  onClick={() => {
                    addToCart({
                      ...selectedDesign,
                      id: `${selectedDesign.id}-${selectedVariant.id}`,
                      title: `${selectedDesign.title} (${selectedVariant.label})`,
                      price: selectedVariant.price,
                      image: selectedDesign.primary_image,
                      type: selectedVariant.price >= 24 ? 'physical' : 'digital',
                    });
                    setSelectedDesign(null);
                  }}
                  className="w-full py-4 bg-white text-black font-black uppercase text-[10px] tracking-widest rounded-2xl flex items-center justify-center gap-2 hover:bg-emerald-400 transition-all"
                >
                  <ShoppingCart className="w-4 h-4" /> Add to Cart · ${selectedVariant.price}
                </button>

                {/* View in shop */}
                {!selectedDesign.is_private && (
                  <Link
                    to={`/product/${selectedDesign.slug}`}
                    onClick={() => setSelectedDesign(null)}
                    className="w-full py-3 border border-zinc-800 text-zinc-400 font-black uppercase text-[9px] tracking-widest rounded-2xl flex items-center justify-center gap-2 hover:border-zinc-600 hover:text-white transition-all"
                  >
                    <ExternalLink className="w-3 h-3" /> View in Shop
                  </Link>
                )}

                {/* Make private */}
                {!selectedDesign.is_private && (
                  <button
                    onClick={() => makeItPrivate(String(selectedDesign.id))}
                    className="w-full py-3 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-400 text-[9px] font-black uppercase border border-indigo-500/20 rounded-2xl flex items-center justify-center gap-2 transition-all"
                  >
                    <EyeOff className="w-3 h-3" /> Make Private · Remove from Shop
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── HEADER ─────────────────────────────────────────────── */}
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

        <div className="max-w-6xl mx-auto px-8 flex gap-1">
          {[
            { key: 'studio', label: 'My Creations', icon: Sparkles },
            { key: 'orders', label: 'Orders',       icon: Package  },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex items-center gap-2 px-5 py-3 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === key ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
            >
              <Icon className="w-3 h-3" /> {label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-10">

        {/* ── MY CREATIONS ───────────────────────────────────────── */}
        {activeTab === 'studio' && (
          <>
            <div className="grid grid-cols-3 gap-4 mb-10">
              {[
                { label: 'Creations',      value: myDesigns.length },
                { label: 'Available Tokens', value: user?.tokens ?? 0 },
                { label: 'Private Works',  value: myDesigns.filter(d => d.is_private).length },
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {myDesigns.map((design) => (
                  <div key={design.id} className="group bg-zinc-900 rounded-[2rem] overflow-hidden border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer" onClick={() => openModal(design)}>
                    <div className="aspect-[3/4] relative overflow-hidden bg-black">
                      <img
                        src={design.thumbnail_url || design.primary_image}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        alt={design.title}
                      />

                      {design.is_private && (
                        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5 text-emerald-400" />
                          <span className="text-[7px] font-black text-emerald-400 uppercase">Private</span>
                        </div>
                      )}

                      {design.hires_url && (
                        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full">
                          <span className="text-[7px] font-black text-yellow-400 uppercase">4K Ready</span>
                        </div>
                      )}

                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 backdrop-blur-sm">
                        <button
                          onClick={e => { e.stopPropagation(); openModal(design); }}
                          className="w-40 py-2.5 bg-white text-black text-[9px] font-black uppercase rounded-xl hover:bg-emerald-400 transition-all"
                        >
                          View & Download
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); handleDownload(design); }}
                          disabled={processingId === String(design.id)}
                          className="w-40 py-2.5 bg-zinc-800/80 text-white text-[9px] font-black uppercase rounded-xl hover:bg-zinc-700 transition-all disabled:opacity-50 flex items-center justify-center gap-1"
                        >
                          {processingId === String(design.id) ? (
                            <><Loader2 className="w-3 h-3 animate-spin" /> Processing...</>
                          ) : (
                            <><Download className="w-3 h-3" /> Quick Download</>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="p-4">
                      <h3 className="font-bold text-[10px] uppercase italic tracking-tight truncate">{design.title}</h3>
                      <p className="text-[8px] text-zinc-600 uppercase tracking-widest mt-0.5">
                        {design.category || 'AI Art'} · ${design.basePrice || design.price}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── ORDERS TAB ─────────────────────────────────────────── */}
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
