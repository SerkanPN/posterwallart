import { Link, Outlet } from 'react-router-dom';
import { ShoppingCart, Heart, User, Sparkles, Menu, X } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useState } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Layout() {
  const { cart, wishlist, user } = useStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-50 font-sans selection:bg-indigo-500/30">
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
            <Link to="/tokens" className="text-zinc-400 hover:text-zinc-50" onClick={() => setIsMenuOpen(false)}>Tokens ({user?.tokens || 0})</Link>
            <Link to="/cart" className="text-zinc-400 hover:text-zinc-50" onClick={() => setIsMenuOpen(false)}>Cart ({cartCount})</Link>
            <Link to="/profile" className="text-zinc-400 hover:text-zinc-50" onClick={() => setIsMenuOpen(false)}>Profile</Link>
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
