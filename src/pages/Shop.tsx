import { useState } from 'react';
import { useStore } from '../store/useStore';
import { ShoppingCart, Heart, Filter, Search } from 'lucide-react';

const CATEGORIES = ['All', 'Abstract', 'Nature', 'Synthwave', 'Cyberpunk', 'Minimalist', 'Renaissance', 'Photography', 'Typography'];

const MOCK_PRODUCTS = Array.from({ length: 24 }).map((_, i) => ({
  id: `prod_${i}`,
  title: `Art Piece ${i + 1}`,
  price: Math.floor(Math.random() * 100) + 20,
  image: `https://picsum.photos/seed/art${i}/800/1200`,
  category: CATEGORIES[Math.floor(Math.random() * (CATEGORIES.length - 1)) + 1],
  type: (Math.random() > 0.5 ? 'physical' : 'digital') as 'physical' | 'digital',
}));

export function Shop() {
  const { addToCart, toggleWishlist, wishlist } = useStore();
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = MOCK_PRODUCTS.filter(p => {
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tighter uppercase mb-2">The Collection</h1>
          <p className="text-zinc-500">Curated AI-generated masterpieces.</p>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Search art..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <button className="p-2 bg-zinc-900 border border-zinc-800 rounded-full hover:bg-zinc-800 transition-colors">
            <Filter className="w-5 h-5 text-zinc-400" />
          </button>
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-3 overflow-x-auto pb-6 mb-8 snap-x no-scrollbar">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all snap-start ${activeCategory === cat ? 'bg-indigo-600 text-white' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-50 border border-zinc-800'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {filteredProducts.map(product => {
          const isWishlisted = wishlist.some(w => w.id === product.id);
          return (
            <div key={product.id} className="group flex flex-col">
              <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-4 bg-zinc-900 border border-zinc-800">
                <img 
                  src={product.image} 
                  alt={product.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 duration-300">
                  <button 
                    onClick={() => toggleWishlist(product)}
                    className="p-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full hover:bg-white/20 transition-colors"
                  >
                    <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                  </button>
                  <button 
                    onClick={() => addToCart(product)}
                    className="p-3 bg-indigo-600 border border-indigo-500 rounded-full hover:bg-indigo-700 transition-colors shadow-lg"
                  >
                    <ShoppingCart className="w-5 h-5 text-white" />
                  </button>
                </div>
                <div className="absolute bottom-4 left-4">
                  <span className="px-2 py-1 bg-black/60 backdrop-blur-md rounded text-[10px] font-bold uppercase tracking-wider text-zinc-300 border border-white/10">
                    {product.type}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg tracking-tight group-hover:text-indigo-400 transition-colors">{product.title}</h3>
                  <p className="text-sm text-zinc-500">{product.category}</p>
                </div>
                <p className="font-mono font-bold">${product.price}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
