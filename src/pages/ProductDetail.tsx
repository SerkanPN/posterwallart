import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useStore } from '../store/useStore';
import { ShoppingCart, ShieldCheck, Zap } from 'lucide-react';

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
  const [selectedVariant, setSelectedVariant] = useState(VARIANTS[0]);
  const [isFramed, setIsFramed] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      const { data } = await supabase.from('products').select('*').eq('slug', slug).single();
      if (data) setProduct(data);
    };
    fetchProduct();
  }, [slug]);

  if (!product) return <div className="min-h-screen bg-black flex items-center justify-center font-mono text-[10px] uppercase tracking-widest opacity-20">Syncing Dimensions...</div>;

  const finalPrice = isFramed && selectedVariant.price >= 24 ? selectedVariant.price * 2 : selectedVariant.price;

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 pt-20">
        <div className="rounded-[3rem] overflow-hidden border border-zinc-800 bg-black aspect-[2/3] shadow-2xl">
          <img src={product.image_url} className="w-full h-full object-cover" alt={product.title} />
        </div>
        <div className="space-y-10">
          <div>
            <h1 className="text-5xl font-black uppercase italic tracking-tighter mb-4">{product.title}</h1>
            <div className="flex items-center gap-4 mb-6">
              <span className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-[10px] font-bold uppercase text-zinc-400 tracking-widest">{product.category}</span>
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-2"><Zap className="w-3 h-3 fill-emerald-500" /> AI Masterpiece</span>
            </div>
            <p className="text-zinc-500 text-sm leading-relaxed max-w-xl">{product.description}</p>
          </div>
          <div className="space-y-4">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Select Variation</label>
            <div className="grid grid-cols-2 gap-4">
              {VARIANTS.map(v => (
                <button 
                  key={v.id} 
                  onClick={() => setSelectedVariant(v)}
                  className={`p-5 rounded-3xl border text-left transition-all ${selectedVariant.id === v.id ? 'border-emerald-500 bg-emerald-500/5' : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'}`}
                >
                  <p className="text-xs font-black uppercase tracking-tight">{v.label}</p>
                  <p className="text-emerald-500 font-black text-sm mt-1">${v.price}</p>
                </button>
              ))}
            </div>
          </div>
          {selectedVariant.price >= 24 && (
            <div className="flex items-center justify-between p-6 bg-zinc-900 rounded-[2.5rem] border border-zinc-800">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center border border-zinc-800">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase block">Professional Framing</span>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wide">Premium Matte finish (Price x2)</span>
                </div>
              </div>
              <button onClick={() => setIsFramed(!isFramed)} className={`w-12 h-6 rounded-full transition-all ${isFramed ? 'bg-emerald-600' : 'bg-zinc-700'} relative`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isFramed ? 'right-1' : 'left-1'}`} />
              </button>
            </div>
          )}
          <div className="pt-10 border-t border-zinc-900 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase text-zinc-500 tracking-widest mb-1">Total Price</p>
              <div className="text-5xl font-black text-white">${finalPrice}</div>
            </div>
            <button 
              onClick={() => addToCart({ ...product, id: `${product.id}-${selectedVariant.id}`, title: `${product.title} (${selectedVariant.label})`, price: finalPrice, image: product.image_url })}
              className="px-16 py-6 bg-white text-black font-black uppercase rounded-3xl flex items-center gap-3 hover:bg-zinc-200 transition-all shadow-2xl"
            >
              <ShoppingCart className="w-6 h-6" /> Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
