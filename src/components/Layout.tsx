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

// Hatanın sebebi burasıydı, "export function Layout" tam olarak böyle olmalı
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
      
      {/* FLOATING GLASSMORPHIC NAVBAR */}
      <header className="sticky top-4 z-50 mx-auto w-[calc(100%-2rem)] max-w-7xl rounded-2xl border border-zinc-800 bg-zinc-950/75 backdrop-blur-xl transition-all duration-300 shadow-[0_15px_40px_rgba(0,0,0,0.6)]">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 text-lg font-black tracking-tighter uppercase group">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center group-hover:border-indigo-500/50 transition-colors">
              <Sparkles className="w-4.5 h-4.5 text-indigo-500 group-hover:scale-110 transition-transform" />
            </div>
            <span className="group-hover:text-indigo-400 transition-colors">POSTERWALLART<span className="text-zinc-500">.SHOP</span></span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-widest text-zinc-400">
            <Link to="/shop" className="hover:text-zinc-50 transition-colors">Shop</Link>
            <Link to="/music-posters" className="hover:text-zinc-50 transition-colors text-indigo-400">Music Posters</Link>
            <Link to="/" className="hover:text-zinc-50 transition-colors">AI Studio</Link>
            <Link to="/blog" className="hover:text-zinc-50 transition-colors">Blog</Link>
            {user?.isSeller && (
              <Link to="/seller" className="hover:text-zinc-50 transition-colors">Seller Dashboard</Link>
            )}
          </nav>

          <div className="hidden md:flex items-center gap-6">
            <button 
              onClick={() => handleProtectedNavigation('/tokens')} 
              className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 hover:border-indigo-500/50 hover:bg-indigo-500/20 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest text-indigo-300 transition-all duration-300 cursor-pointer shadow-[0_0_15px_rgba(99,102,241,0.1)]"
            >
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              {user ? `${user.tokens} Tokens` : 'Get Tokens'}
            </button>
            
            <div className="flex items-center gap-5">
              <button onClick={() => handleProtectedNavigation('/wishlist')} className="relative text-zinc-400 hover:text-zinc-50 transition-colors cursor-pointer group">
                <Heart className="w-5 h-5 group-hover:scale-110 transition-transform" />
                {wishlist.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-indigo-500 text-white text-[9px] font-black flex items-center justify-center rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]">
                    {wishlist.length}
                  </span>
                )}
              </button>
              <button onClick={() => handleProtectedNavigation('/cart')} className="relative text-zinc-400 hover:text-zinc-50 transition-colors cursor-pointer group">
                <ShoppingCart className="w-5 h-5 group-hover:scale-110 transition-transform" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-indigo-500 text-white text-[9px] font-black flex items-center justify-center rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]">
                    {cartCount}
                  </span>
                )}
              </button>

              <div className="w-px h-5 bg-zinc-800" />

              {user ? (
                <div className="flex items-center gap-4">
                  <button onClick={() => handleProtectedNavigation('/profile')} className="text-zinc-400 hover:text-zinc-50 transition-colors cursor-pointer" title="Profile">
                    <User className="w-5 h-5" />
                  </button>
                  <button onClick={handleLogout} className="text-zinc-500 hover:text-red-500 transition-colors cursor-pointer" title="Logout">
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button onClick={() => setAuthModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-zinc-50 hover:bg-zinc-200 text-zinc-950 text-[10px] font-black uppercase tracking-widest rounded-full transition-all duration-300">
                  <LogIn className="w-4 h-4" /> Sign In
                </button>
              )}
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <button className="md:hidden text-zinc-400 hover:text-zinc-50 cursor-pointer" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Nav */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-zinc-900 bg-zinc-950/95 backdrop-blur-xl p-6 rounded-b-2xl flex flex-col gap-5">
            <Link to="/shop" className="text-sm font-bold uppercase tracking-wider text-zinc-400 hover:text-zinc-50" onClick={() => setIsMenuOpen(false)}>Shop</Link>
            <Link to="/music-posters" className="text-sm font-bold uppercase tracking-wider text-indigo-400 hover:text-indigo-300" onClick={() => setIsMenuOpen(false)}>Music Posters</Link>
            <Link to="/" className="text-sm font-bold uppercase tracking-wider text-zinc-400 hover:text-zinc-50" onClick={() => setIsMenuOpen(false)}>AI Studio</Link>
            <Link to="/blog" className="text-sm font-bold uppercase tracking-wider text-zinc-400 hover:text-zinc-50" onClick={() => setIsMenuOpen(false)}>Blog</Link>
            <button onClick={() => { setIsMenuOpen(false); handleProtectedNavigation('/tokens'); }} className="text-left text-sm font-bold uppercase tracking-wider text-zinc-400 hover:text-zinc-50">Tokens ({user?.tokens || 0})</button>
            <button onClick={() => { setIsMenuOpen(false); handleProtectedNavigation('/cart'); }} className="text-left text-sm font-bold uppercase tracking-wider text-zinc-400 hover:text-zinc-50">Cart ({cartCount})</button>
            
            <div className="h-px bg-zinc-800 my-2" />

            {user ? (
              <div className="flex flex-col gap-4">
                <button onClick={() => { setIsMenuOpen(false); handleProtectedNavigation('/profile'); }} className="text-left text-sm font-bold uppercase tracking-wider text-zinc-400 hover:text-zinc-50">Profile</button>
                <button onClick={() => { setIsMenuOpen(false); handleLogout(); }} className="text-left text-red-500 hover:text-red-400 font-bold uppercase tracking-wider text-sm">Logout</button>
              </div>
            ) : (
              <button onClick={() => { setIsMenuOpen(false); setAuthModalOpen(true); }} className="flex items-center justify-center gap-2 py-3 bg-zinc-50 text-zinc-950 text-[10px] font-black uppercase tracking-widest rounded-full">Sign In</button>
            )}
          </div>
        )}
      </header>

      <main className="flex-1 flex flex-col pt-6">
        <Outlet />
      </main>

      {/* PREMIUM FOOTER */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-16 relative overflow-hidden mt-auto">
        <div className="absolute inset-0 bg-grid-dots pointer-events-none" />
        <div className="container mx-auto px-6 max-w-7xl relative z-10 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="flex flex-col gap-4">
            <Link to="/" className="flex items-center gap-2.5 text-lg font-black tracking-tighter uppercase">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              <span>POSTERWALLART</span>
            </Link>
            <p className="text-xs text-zinc-500 leading-relaxed max-w-xs">
              Designing the future of wall decor. Premium, AI-powered customized posters matching your style, space, and perspective.
            </p>
          </div>
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-300 mb-6">Explore Shop</h4>
            <ul className="space-y-3 text-xs font-bold text-zinc-500">
              <li><Link to="/shop?category=abstract" className="hover:text-zinc-200 transition-colors">Abstract Collection</Link></li>
              <li><Link to="/shop?category=cyberpunk" className="hover:text-zinc-200 transition-colors">Cyberpunk Studio</Link></li>
              <li><Link to="/shop?category=minimalist" className="hover:text-zinc-200 transition-colors">Minimalist Prints</Link></li>
              <li><Link to="/shop?category=nature" className="hover:text-zinc-200 transition-colors">Fine Art Nature</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-300 mb-6">Customer Care</h4>
            <ul className="space-y-3 text-xs font-bold text-zinc-500">
              <li><Link to="/faq" className="hover:text-zinc-200 transition-colors">Help & FAQ</Link></li>
              <li><Link to="/contact" className="hover:text-zinc-200 transition-colors">Get Support</Link></li>
              <li><Link to="/shipping" className="hover:text-zinc-200 transition-colors">Shipping & Returns</Link></li>
              <li><Link to="/tos" className="hover:text-zinc-200 transition-colors">Terms & Privacy</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-300 mb-6">Connect With Us</h4>
            <ul className="space-y-3 text-xs font-bold text-zinc-500">
              <li><a href="#" className="hover:text-zinc-200 transition-colors">Instagram</a></li>
              <li><a href="#" className="hover:text-zinc-200 transition-colors">Twitter / X</a></li>
              <li><a href="#" className="hover:text-zinc-200 transition-colors">Pinterest boards</a></li>
            </ul>
          </div>
        </div>
        <div className="container mx-auto px-6 max-w-7xl mt-16 pt-8 border-t border-zinc-900 text-xs font-bold text-zinc-600 flex flex-col md:flex-row items-center justify-between gap-4 relative z-10">
          <p>© 2026 POSTERWALLART.SHOP. ALL RIGHTS RESERVED.</p>
          <div className="flex items-center gap-2 opacity-50">
            <span>SECURE PAYMENTS · STRIPE & PAYPAL</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
