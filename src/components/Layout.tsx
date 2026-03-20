import { Link, Outlet, useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, User, Sparkles, Menu, X, LogOut, LogIn } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useState } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AuthModal } from './AuthModal';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Layout() {
  const { cart, wishlist, user, logout, setAuthModalOpen } = useStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handleProtectedNavigation = (path: string) => {
    if (!user) {
      setAuthModalOpen(true);
    } else {
      navigate(path);
      setIsMenuOpen(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-50 font-sans selection:bg-indigo-500/30">
      <AuthModal />
      <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold tracking-tighter">
            <Sparkles className="w-6 h-6 text-indigo-500" />
            <span>POSTERWALLART<span className="text-zinc-500">.SHOP</span></span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
            <Link to="/shop" className="hover:text-zinc-50 transition-colors">Shop</Link>
            <Link to="/" className="hover:text-zinc-50 transition-colors">AI Studio</Link>
            <Link to="/blog" className="hover:text-zinc-50 transition-colors">Blog</Link>
            {user?.isSeller && (
              <Link to="/seller" className="hover:text-zinc-50 transition-colors">Seller Dashboard</Link>
            )}
          </nav>

          <div className="hidden md:flex items-center gap-6">
            <button onClick={() => handleProtectedNavigation('/tokens')} className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-full text-xs font-semibold hover:bg-zinc-800 transition-colors cursor-pointer">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              {user ? `${user.tokens} Tokens` : 'Get Tokens'}
            </button>
            
            <div className="flex items-center gap-4">
              <button onClick={() => handleProtectedNavigation('/wishlist')} className="relative text-zinc-400 hover:text-zinc-50 transition-colors cursor-pointer">
                <Heart className="w-5 h-5" />
                {wishlist.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full">
                    {wishlist.length}
                  </span>
                )}
              </button>
              <button onClick={() => handleProtectedNavigation('/cart')} className="relative text-zinc-400 hover:text-zinc-50 transition-colors cursor-pointer">
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* DÜZELTİLEN VE EKLENEN GİRİŞ/ÇIKIŞ ALANI */}
              {user ? (
                <>
                  <button onClick={() => handleProtectedNavigation('/profile')} className="text-zinc-400 hover:text-zinc-50 transition-colors cursor-pointer" title="Profile">
                    <User className="w-5 h-5" />
                  </button>
                  <button onClick={handleLogout} className="text-zinc-500 hover:text-red-500 transition-colors cursor-pointer ml-2" title="Logout">
                    <LogOut className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <button onClick={() => setAuthModalOpen(true)} className="flex items-center gap-2 px-4 py-1.5 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-zinc-200 transition-colors ml-2">
                  <LogIn className="w-4 h-4" /> Sign In
                </button>
              )}
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <button className="md:hidden text-zinc-400 hover:text-zinc-50" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Nav */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-zinc-800 bg-zinc-950 p-4 flex flex-col gap-4">
            <Link to="/shop" className="text-zinc-400 hover:text-zinc-50" onClick={() => setIsMenuOpen(false)}>Shop</Link>
            <Link to="/" className="text-zinc-400 hover:text-zinc-50" onClick={() => setIsMenuOpen(false)}>AI Studio</Link>
            <Link to="/blog" className="text-zinc-400 hover:text-zinc-50" onClick={() => setIsMenuOpen(false)}>Blog</Link>
            <button onClick={() => handleProtectedNavigation('/tokens')} className="text-left text-zinc-400 hover:text-zinc-50">Tokens ({user?.tokens || 0})</button>
            <button onClick={() => handleProtectedNavigation('/cart')} className="text-left text-zinc-400 hover:text-zinc-50">Cart ({cartCount})</button>
            
            {user ? (
              <>
                <button onClick={() => handleProtectedNavigation('/profile')} className="text-left text-zinc-400 hover:text-zinc-50">Profile</button>
                <button onClick={handleLogout} className="text-left text-red-500 hover:text-red-400 mt-4 font-bold uppercase tracking-wider text-xs">Logout</button>
              </>
            ) : (
              <button onClick={() => { setIsMenuOpen(false); setAuthModalOpen(true); }} className="text-left text-emerald-500 hover:text-emerald-400 mt-4 font-bold uppercase tracking-wider text-xs">Sign In</button>
            )}
          </div>
        )}
      </header>

      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>

      <footer className="border-t border-zinc-900 bg-zinc-950 py-12 mt-auto">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <Link to="/" className="flex items-center gap-2 text-xl font-bold tracking-tighter mb-4">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              <span>POSTERWALLART</span>
            </Link>
            <p className="text-sm text-zinc-500">
              High-end, AI-driven posters and wall art. Transform your space with generative art.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Shop</h4>
            <ul className="space-y-2 text-sm text-zinc-500">
              <li><Link to="/shop?category=abstract" className="hover:text-zinc-300">Abstract</Link></li>
              <li><Link to="/shop?category=cyberpunk" className="hover:text-zinc-300">Cyberpunk</Link></li>
              <li><Link to="/shop?category=minimalist" className="hover:text-zinc-300">Minimalist</Link></li>
              <li><Link to="/shop?category=nature" className="hover:text-zinc-300">Nature</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-zinc-500">
              <li><Link to="/faq" className="hover:text-zinc-300">FAQ</Link></li>
              <li><Link to="/contact" className="hover:text-zinc-300">Contact Us</Link></li>
              <li><Link to="/shipping" className="hover:text-zinc-300">Shipping & Returns</Link></li>
              <li><Link to="/tos" className="hover:text-zinc-300">Terms of Service</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Connect</h4>
            <ul className="space-y-2 text-sm text-zinc-500">
              <li><a href="#" className="hover:text-zinc-300">Instagram</a></li>
              <li><a href="#" className="hover:text-zinc-300">Twitter</a></li>
              <li><a href="#" className="hover:text-zinc-300">Pinterest</a></li>
            </ul>
          </div>
        </div>
        <div className="container mx-auto px-4 mt-12 pt-8 border-t border-zinc-900 text-sm text-zinc-600 flex flex-col md:flex-row items-center justify-between">
          <p>© 2026 PosterWallArt.shop. All rights reserved.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <span>Secure Payments via Stripe & PayPal</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
