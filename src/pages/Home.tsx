import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Maximize, ShoppingBag, ArrowRight, Layout, Camera, Star, Zap, Search } from 'lucide-react';

interface Product {
  id: string;
  title: string;
  price: number;
  image: string;
  category: string;
  slug: string;
  thumbnail?: string;
}

export function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("[LOG] Home: Fetching global marketplace collection...");
    const fetchProducts = async () => {
      try {
        const res = await fetch('https://api.posterwallart.shop/api.php?action=get_products');
        const data = await res.json();
        setProducts(data.products || []);
        console.log("[LOG] Home: Marketplace data received", data.products?.length);
      } catch (error) {
        console.error("[ERROR] Home: Failed to fetch products", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans">
      {/* HERO SECTION */}
      <section className="relative pt-24 pb-20 px-6">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-emerald-500/5 blur-[120px] rounded-full" />
        </div>

        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 mb-8 shadow-2xl">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Elite AI Art Marketplace</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter mb-8 leading-[0.85] uppercase">
            Art Redefined <br /> By <span className="text-emerald-500">Intelligence</span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-zinc-400 text-lg font-medium leading-relaxed mb-12">
            Browse our exclusive collection of AI-crafted posters or use our 
            advanced architectural tools to design art specifically for your walls.
          </p>

          {/* MAIN SERVICE CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-32">
            {/* SPECIAL FOR YOUR ROOM */}
            <Link 
              to="/special" 
              className="group relative bg-zinc-900 border border-zinc-800 p-8 rounded-[32px] overflow-hidden transition-all hover:border-emerald-500/50 hover:bg-zinc-900/80"
              onClick={() => console.log("[LOG] Home: User selected Special for Room")}
            >
              <div className="relative z-10 text-left">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6">
                  <Camera className="w-6 h-6 text-emerald-500" />
                </div>
                <h2 className="text-2xl font-black italic tracking-tighter mb-2 uppercase">Special For Your Room</h2>
                <p className="text-zinc-500 text-xs font-bold mb-6 leading-relaxed">
                  Upload a photo of your room. Our AI analyzes scale, perspective 
                  and lighting to create a masterpiece that fits your furniture perfectly.
                </p>
                <span className="inline-flex items-center gap-2 text-emerald-500 font-black text-[10px] uppercase tracking-widest group-hover:gap-4 transition-all">
                  Launch Design Studio <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </Link>

            {/* HD CREATOR LAB */}
            <Link 
              to="/lab" 
              className="group relative bg-zinc-900 border border-zinc-800 p-8 rounded-[32px] overflow-hidden transition-all hover:border-blue-500/50 hover:bg-zinc-900/80"
              onClick={() => console.log("[LOG] Home: User selected Creator Lab")}
            >
              <div className="relative z-10 text-left">
                <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6">
                  <Zap className="w-6 h-6 text-blue-500" />
                </div>
                <h2 className="text-2xl font-black italic tracking-tighter mb-2 uppercase">Pro Creator Lab</h2>
                <p className="text-zinc-500 text-xs font-bold mb-6 leading-relaxed">
                  Advanced tools for artists. Generate high-resolution masterpieces, 
                  upscale your images to 2K, or convert your art into vectors.
                </p>
                <span className="inline-flex items-center gap-2 text-blue-500 font-black text-[10px] uppercase tracking-widest group-hover:gap-4 transition-all">
                  Enter The Lab <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* SHOP SECTION */}
      <section className="max-w-7xl mx-auto px-6 pb-32">
        <div className="flex items-end justify-between mb-12 border-b border-zinc-900 pb-8">
          <div>
            <h2 className="text-3xl font-black italic tracking-tighter uppercase flex items-center gap-3">
              <ShoppingBag className="text-emerald-500" />
              Marketplace
            </h2>
            <p className="text-zinc-500 text-xs font-bold mt-1 uppercase tracking-widest">Discover & Buy Community Masterpieces</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex bg-zinc-900 border border-zinc-800 rounded-full px-4 py-2 items-center gap-2">
              <Search className="w-3 h-3 text-zinc-500" />
              <input type="text" placeholder="Search art..." className="bg-transparent text-xs outline-none w-48 text-zinc-300" />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-square bg-zinc-900 rounded-3xl animate-pulse border border-zinc-800" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {products.map((product) => (
              <div 
                key={product.id} 
                className="group cursor-pointer"
                onClick={() => console.log("[LOG] Home: Viewing product", product.id)}
              >
                <div className="relative aspect-square overflow-hidden rounded-[32px] bg-zinc-900 border border-zinc-800 mb-4 shadow-xl">
                  <img 
                    src={product.thumbnail || product.image} 
                    alt={product.title} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button className="px-6 py-3 bg-white text-black font-black text-[10px] uppercase rounded-full shadow-2xl transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                      Quick View
                    </button>
                  </div>
                  <div className="absolute top-4 right-4 bg-zinc-950/80 backdrop-blur-md border border-zinc-800 px-2 py-1 rounded-lg">
                    <span className="text-[10px] font-black text-emerald-500 tracking-tighter">${product.price}</span>
                  </div>
                </div>
                <div className="px-2">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{product.category}</p>
                  <h3 className="text-sm font-black italic tracking-tighter uppercase truncate text-zinc-200">{product.title}</h3>
                  <div className="flex items-center gap-1 mt-2 opacity-30">
                    {[...Array(5)].map((_, i) => <Star key={i} className="w-2.5 h-2.5 fill-white" />)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-16 text-center">
          <button 
            className="px-8 py-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-zinc-800 transition-all"
            onClick={() => console.log("[LOG] Home: Loading more products")}
          >
            Explore Full Collection
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 border-t border-zinc-900 text-center">
        <p className="text-[10px] text-zinc-700 font-black uppercase tracking-[0.5em]">
          &copy; 2026 POSTERWALLART MARKETPLACE · INTERNATIONAL SHIPPING
        </p>
      </footer>
    </div>
  );
}
