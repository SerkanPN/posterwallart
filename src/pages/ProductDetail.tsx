import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useStore } from '../store/useStore';
import { ShoppingCart } from 'lucide-react';

const VARIANTS = [
  { id: 'digi', label: 'Digital Download', price: 1 },
  { id: 'comm', label: 'Digital + Commercial Rights', price: 5 },
  { id: '8x10', label: '8x10" Physical', price: 24 },
  { id: '11x14', label: '11x14" Physical', price: 28 },
  { id: '16x20', label: '16x20" Physical', price: 32 },
  { id: '18x24', label: '18x24" Physical', price: 36 },
  { id: '20x30', label: '20x30" Physical', price: 40 },
  { id: '24x36', label: '24x36" Physical', price: 44 },
];

export function ProductDetail() {
  const { id } = useParams();
  const { addToCart } = useStore();
  const [product, setProduct] = useState<any>(null);
  const [selectedVariant, setSelectedVariant] = useState(VARIANTS[0]);
  const [isFramed, setIsFramed] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      const { data } = await supabase.from('products').select('*').eq('id', id).single();
      if (data) setProduct(data);
    };
    fetchProduct();
  }, [id]);

  if (!product) return <div className="min-h-screen bg-black flex items-center justify-center font-mono text-[10px] uppercase tracking-widest opacity-20">Loading dimensions...</div>;

  const finalPrice = isFramed && selectedVariant.price > 5 ? selectedVariant.price * 2 : selectedVariant.price;

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 pt-20">
        <div className="rounded-[3rem] overflow-hidden border border-zinc-800 bg-black aspect-[2/3] shadow-2xl">
          <img src={product.image_url} className="w-full h-full object-cover" alt={product.title} />
        </div>
        
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-black uppercase italic tracking-tighter mb-4">{product.title}</h1>
            <p className="text-zinc-500 text-sm leading-relaxed">{product.description}</p>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Select Version</label>
            <div className="grid grid-cols-2 gap-3">
              {VARIANTS.map(v => (
                <button 
                  key={v.id} 
                  onClick={() => setSelectedVariant(v)}
                  className={`p-4 rounded-2xl border text-left transition-all ${selectedVariant.id === v.id ? 'border-emerald-500 bg-emerald-500/5' : 'border-zinc-800 bg-zinc-900 hover:border-zinc-600'}`}
                >
                  <p className="text-xs font-bold uppercase tracking-tight">{v.label}</p>
                  <p className="text-emerald-500 font-black text-sm mt-1">${v.price}</p>
                </button>
              ))}
            </div>
          </div>

          {selectedVariant.price > 5 && (
            <div className="flex items-center justify-between p-6 bg-zinc-900 rounded-[2rem] border border-zinc-800">
              <div>
                <span className="text-xs font-bold uppercase block">Add Professional Frame?</span>
                <span className="text-[10px] text-zinc-500 uppercase tracking-wide">Premium matte finish (Price x2)</span>
              </div>
              <button onClick={() => setIsFramed(!isFramed)} className={`w-12 h-6 rounded-full transition-all ${isFramed ? 'bg-emerald-600' : 'bg-zinc-700'} relative`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isFramed ? 'right-1' : 'left-1'}`} />
              </button>
            </div>
          )}

          <div className="pt-8 border-t border-zinc-900 flex items-center justify-between">
            <div className="text-4xl font-black text-emerald-500">${finalPrice}</div>
            <button 
              onClick={() => addToCart({ 
                ...product, 
                id: `${product.id}-${selectedVariant.id}-${isFramed}`, 
                title: `${product.title} (${selectedVariant.label}${isFramed ? ' + Frame' : ''})`, 
                price: finalPrice, 
                image: product.image_url, 
                type: selectedVariant.price > 5 ? 'physical' : 'digital' 
              })}
              className="px-12 py-5 bg-white text-black font-black uppercase rounded-2xl flex items-center gap-2 hover:bg-zinc-200 transition-all shadow-xl"
            >
              <ShoppingCart className="w-5 h-5" /> Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
