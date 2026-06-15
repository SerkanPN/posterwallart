import { useStore } from '../store/useStore';
import { ShoppingCart, Heart, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Wishlist() {
  const { wishlist, toggleWishlist, addToCart } = useStore();

  if (wishlist.length === 0) {
    return (
      <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center mb-6">
          <Heart className="w-10 h-10 text-zinc-500" />
        </div>
        <h2 className="text-3xl font-bold tracking-tighter uppercase mb-4">Your Wishlist is Empty</h2>
        <p className="text-zinc-500 mb-8 max-w-md">Save your favorite AI masterpieces here to purchase them later.</p>
        <Link to="/shop" className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase tracking-widest rounded-xl transition-all">
          Explore The Collection
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold tracking-tighter uppercase mb-12">Your Wishlist</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {wishlist.map(product => (
          <div key={product.id} className="group flex flex-col">
            <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-4 bg-zinc-900 border border-zinc-800">
              <img 
                src={product.image} 
                alt={product.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 duration-300">
                <button 
                  onClick={() => toggleWishlist(product)}
                  className="p-3 bg-red-500/10 backdrop-blur-md border border-red-500/20 rounded-full hover:bg-red-500/20 transition-colors"
                >
                  <Trash2 className="w-5 h-5 text-red-500" />
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
        ))}
      </div>
    </div>
  );
}
