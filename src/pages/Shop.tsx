import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { ShoppingCart, Search, Filter, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const API_URL = 'https://api.posterwallart.shop/api.php';

const CATEGORIES = ['All', 'Minimalist', 'Bauhaus', 'Cyberpunk', 'Renaissance', 'Japandi', 'Industrial', 'Pop Art', 'Vintage Poster'];

export function Shop() {
  const { addToCart } = useStore();
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchShopProducts();
  }, []);

  const fetchShopProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}?action=get_products&limit=50`);
      const data = await res.json();
      if (data.success) setAllProducts(data.products || []);
    } catch (e) {
      console.error('[Shop] Failed to fetch products:', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = allProducts.filter(p => {
    const matchesCategory = selectedCategory === 'All' ||
      (p.category && p.category.toLowerCase() === selectedCategory.toLowerCase()) ||
      (p.style_tags && p.style_tags.some((t: string) => t.toLowerCase() === selectedCategory.toLowerCase()));
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black uppercase italic tracking-tighter">The Collection</h1>
            <p className="text-zinc-500 text-[10px] uppercase tracking-widest mt-1">Unique AI Art & Curated Prints</p>
          </div>

          <div className="flex w-full md:w-auto gap-4">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search art..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-3 pl-12 pr-4 text-xs outline-none focus:border-emerald-500 transition-all"
              />
            </div>
            <button className="p-3 bg-zinc-900 border border-zinc-800 rounded-2xl hover:bg-zinc-800 transition-all">
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="flex flex-wrap gap-2 mb-10">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${selectedCategory === cat ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-500 border border-zinc-800 hover:border-zinc-700'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Sparkles className="animate-pulse text-emerald-500" /></div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-32 opacity-20 uppercase font-mono tracking-[0.5em] text-xs">No art found</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredProducts.map((product) => (
              <div key={product.id} className="relative group bg-zinc-900 rounded-[2.5rem] overflow-hidden border border-zinc-800 hover:border-zinc-700 transition-all">
                <Link to={`/product/${product.slug}`} className="absolute inset-0 z-10" />

                <div className="aspect-[3/4] relative overflow-hidden bg-black">
                  <img
                    src={product.thumbnail_url || product.image_url}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    alt={product.title}
                  />
                  <div className="absolute top-4 left-4 bg-emerald-500/10 backdrop-blur-md border border-emerald-500/20 px-3 py-1 rounded-full flex items-center gap-2 z-20">
                    <Sparkles className="w-3 h-3 text-emerald-500" />
                    <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">AI Masterpiece</span>
                  </div>
                </div>

                <div className="p-6 relative z-20">
                  <div className="flex justify-between items-start mb-4">
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm uppercase italic truncate tracking-tight">{product.title}</h3>
                      <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-widest">{product.category || 'AI ART'}</p>
                    </div>
                    <div className="text-emerald-500 font-black text-sm">${product.price}</div>
                  </div>

                  <button
                    disabled
                    className="w-full py-3 bg-zinc-800 text-white text-[10px] font-black uppercase rounded-xl flex items-center justify-center gap-2 transition-all opacity-50"
                  >
                    View Details
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
