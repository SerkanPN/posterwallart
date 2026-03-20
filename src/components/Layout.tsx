import { Link, Outlet, useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, User, Sparkles, Menu, X, LogOut } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useState } from 'react';

export function Layout() {
  const { cart, wishlist, user, logout } = useStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-50 font-sans selection:bg-indigo-500/30">
      <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold tracking-tighter">
            <Sparkles className="w-6 h-6 text-indigo-500" />
            <span>POSTERWALLART<span className="text-zinc-500">.SHOP</span></span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
            <Link to="/shop" className="hover:text-zinc-50 transition-colors">Shop</Link>
            <Link to="/" className="hover:text-zinc-50 transition-colors">AI Studio</Link>
          </nav>

          <div className="hidden md:flex items-center gap-6">
            <Link to="/tokens" className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-full text-xs font-semibold hover:bg-zinc-800 transition-colors">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              {user ? `${user.tokens} Tokens` : 'Get Tokens'}
            </Link>
            
            <div className="flex items-center gap-4">
              <Link to="/wishlist" className="relative text-zinc-400 hover:text-zinc-50 transition-colors">
                <Heart className="w-5 h-5" />
                {wishlist.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full">
                    {wishlist.length}
                  </span>
                )}
              </Link>
              <Link to="/cart" className="relative text-zinc-400 hover:text-zinc-50 transition-colors">
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full">
                    {cartCount}
                  </span>
                )}
              </Link>
              <Link to="/profile" className="text-zinc-400 hover:text-zinc-50 transition-colors">
                <User className="w-5 h-5" />
              </Link>
              {user && (
                <button onClick={handleLogout} className="text-zinc-500 hover:text-red-500 transition-colors">
                  <LogOut className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 flex flex-col"><Outlet /></main>
    </div>
  );
}
