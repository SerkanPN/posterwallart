import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useStore } from '../store/useStore';
import { ShoppingCart, ShieldCheck, Zap, ArrowLeft, Tag, AlertTriangle } from 'lucide-react';

const VARIANTS = [
  { id: 'digi', label: 'Digital Download', price: 1 },
  { id: 'comm', label: 'Digital + Commercial Rights', price: 5 },
  { id: '8x10', label: '8x10" Physical Poster', price: 24 },
  { id: '11x14', label: '11x14" Physical Poster', price: 28 },
  { id: '16x20', label: '16x20" Physical Poster', price: 32 },
  { id: '18x24', label: '18x24" Physical Poster', price: 36 },
  { id: '20x30', label: '20x30" Physical Poster', price: 40 },
  { id: '24x36', label: '24x36" Physical Poster', price: 44 },
];

export function ProductDetail() {
  const { slug } = useParams();
  const { addToCart } = useStore();
  const [product, setProduct] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState(VARIANTS[0]);
  const [isFramed, setIsFramed] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!slug) {
        setError("Invalid product link.");
        return;
      }

      // Hata yakalama ve maybeSingle ile çökme engellendi
      const { data, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .limit(1)
        .maybeSingle();

      if (fetchError) {
        console.error("Fetch error:", fetchError);
        setError("Failed to load product details.");
      } else if (!data) {
        setError("Product not found. It might be deleted or private.");
      } else {
        setProduct(data);
      }
    };
    
    fetchProduct();
  }, [slug]);

  // Hata varsa sonsuz döngü yerine şık bir hata ekranı göster
  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white p-4 font-sans">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-2">Artwork Not Found</h2>
        <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-widest mb-8">{error}</p>
        <Link to="/shop" className="px-8 py-4 bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-zinc-200 transition-all flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Collection
        </Link>
      </div>
    );
  }

  // Veri gelene kadar yükleme ekranı
  if (!product) return <div className="min-h-screen bg-black flex items-center justify-center font-mono text-[10px] uppercase tracking-widest opacity-20 animate-pulse">Syncing Dimensions...</div>;

  const finalPrice = isFramed && selectedVariant.price >= 24 ? selectedVariant.price * 2 : selectedVariant.price;

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8 font-sans">
      <div className="max-w-7xl mx-auto pt-10">
        <Link to="/shop" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-[10px] uppercase font-bold tracking-widest mb-12">
          <ArrowLeft className="w-3 h-3" /> Back to Collection
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
          <div className="rounded-[3rem] overflow-hidden border border-zinc-800 bg-black aspect-[2/3] shadow-2xl sticky top-24">
            <img src={product.image_url} alt={product.alt_text || product.title} className="w-full h-full object-cover" />
          </div>

          <div className="space-y-12">
            <div>
              <h1 className="text-6xl font-black uppercase italic tracking-tighter mb-6 leading-none">{product.title}</h1>
              <div className="flex flex-wrap gap-3 mb-8">
                <span className="px-4 py-1.5 bg-zinc-900 border border-zinc-800 rounded-full text-[10px] font-black uppercase text-zinc-400 tracking-widest">{product.category}</span>
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2 px-4 py-1.5 bg-emerald-500/5 border border-emerald-500/10 rounded-full">
                  <Zap className="w-3 h-3 fill-emerald-500" /> AI Masterpiece
                </span>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed max-w-xl mb-8">{product.description}</p>
              
              {product.tags && product.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag: string) => (
                    <span key={tag} className="text-[9px] text-zinc-600 font-bold uppercase tracking-tighter flex items-center gap-1">
                      <Tag className="w-2 h-2" /> {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-6">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 block border-b border-zinc-900 pb-2">Select Format</label>
              <div className="grid grid-cols-2 gap-4">
                {VARIANTS.map(v => (
                  <button key={v.id} onClick={() => setSelectedVariant(v)}
                    className={`p-6 rounded-[2rem] border text-left transition-all ${selectedVariant.id === v.id ? 'border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500/20' : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'}`}
                  >
                    <p className="text-[10px] font-black uppercase tracking-widest mb-1">{v.label}</p>
                    <p className="text-emerald-500 font-black text-lg">${v.price}</p>
                  </button>
                ))}
              </div>
            </div>

            {selectedVariant.price >= 24 && (
              <div className="p-8 bg-zinc-900 rounded-[2.5rem] border border-zinc-800 flex items-center justify-between group">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center border border-zinc-800 group-hover:border-emerald-500/30 transition-all">
                    <ShieldCheck className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div>
                    <span className="text-xs font-black uppercase block tracking-widest">Premium Framing</span>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wide">Gallery-grade wood & matte finish (Price x2)</span>
                  </div>
                </div>
                <button onClick={() => setIsFramed(!isFramed)} className={`w-14 h-7 rounded-full transition-all ${isFramed ? 'bg-emerald-600' : 'bg-zinc-700'} relative`}>
                  <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${isFramed ? 'right-1' : 'left-1'}`} />
                </button>
              </div>
            )}

            <div className="pt-10 border-t border-zinc-900 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase text-zinc-500 tracking-widest mb-2">Total Amount</p>
                <div className="text-6xl font-black text-white italic tracking-tighter">${finalPrice}</div>
              </div>
              <button onClick={() => addToCart({ ...product, id: `${product.id}-${selectedVariant.id}`, title: `${product.title} (${selectedVariant.label})`, price: finalPrice, image: product.image_url, type: selectedVariant.price >= 24 ? 'physical' : 'digital' })}
                className="px-20 py-7 bg-white text-black font-black uppercase tracking-widest text-xs rounded-[2rem] flex items-center gap-3 hover:bg-emerald-500 hover:text-white transition-all shadow-2xl"
              >
                <ShoppingCart className="w-5 h-5" /> Add to Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
