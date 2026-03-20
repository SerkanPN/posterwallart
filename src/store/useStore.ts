import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';

export interface Product {
  id: string; title: string; price: number; image: string; category: string; type: 'physical' | 'digital'; isGenerated?: boolean; slug?: string;
}

interface CartItem extends Product {
  quantity: number;
}

interface User {
  id: string; name: string; email: string; tokens: number; isSeller: boolean;
}

interface StoreState {
  user: User | null; cart: CartItem[]; wishlist: Product[]; isLoading: boolean;
  login: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  checkUser: () => Promise<void>;
  addTokens: (amount: number) => void;
  useToken: () => Promise<boolean>;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  toggleWishlist: (product: Product) => void;
  clearCart: () => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      user: null, cart: [], wishlist: [], isLoading: false,

      login: async (email: string) => {
        set({ isLoading: true });
        const { error } = await supabase.auth.signInWithOtp({ email });
        if (error) alert(error.message);
        else alert('Check your email for the magic link!');
        set({ isLoading: false });
      },

      logout: async () => {
        await supabase.auth.signOut();
        set({ user: null });
      },

      checkUser: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        const syncProfile = async (s: any) => {
          if (!s) return;
          let { data: profile } = await supabase.from('profiles').select('*').eq('id', s.user.id).single();
          if (!profile) {
            const { data: newProfile } = await supabase.from('profiles').insert([{ id: s.user.id, email: s.user.email, tokens: 5 }]).select().single();
            profile = newProfile;
          }
          set({ user: { id: s.user.id, name: s.user.email?.split('@')[0] || 'User', email: s.user.email || '', tokens: profile?.tokens || 0, isSeller: false } });
        };
        if (session) await syncProfile(session);
        supabase.auth.onAuthStateChange(async (_, s) => { if (s) await syncProfile(s); else set({ user: null }); });
      },

      addTokens: (amount) => set((state) => ({ user: state.user ? { ...state.user, tokens: state.user.tokens + amount } : null })),

      useToken: async () => {
        const { user } = get();
        if (user && user.tokens > 0) {
          const newTokenCount = user.tokens - 1;
          const { error } = await supabase.from('profiles').update({ tokens: newTokenCount }).eq('id', user.id);
          if (!error) { set({ user: { ...user, tokens: newTokenCount } }); return true; }
        }
        return false;
      },

      addToCart: (product) => set((state) => {
        const existing = state.cart.find(item => item.id === product.id);
        if (existing) return { cart: state.cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item) };
        return { cart: [...state.cart, { ...product, quantity: 1 }] };
      }),

      removeFromCart: (productId) => set((state) => ({ cart: state.cart.filter(item => item.id !== productId) })),
      updateQuantity: (productId, quantity) => set((state) => ({ cart: state.cart.map(item => item.id === productId ? { ...item, quantity: Math.max(1, quantity) } : item) })),
      toggleWishlist: (product) => set((state) => {
        const exists = state.wishlist.find(item => item.id === product.id);
        if (exists) return { wishlist: state.wishlist.filter(item => item.id !== product.id) };
        return { wishlist: [...state.wishlist, product] };
      }),
      clearCart: () => set({ cart: [] }),
    }),
    { name: 'posterwall-storage', partialize: (state) => ({ user: state.user, cart: state.cart, wishlist: state.wishlist }) }
  )
);
