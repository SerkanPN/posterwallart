import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';

const API_URL = 'https://api.posterwallart.shop/api.php';

export interface Product {
  id: string; title: string; price: number; image: string; category: string; type: 'physical' | 'digital'; isGenerated?: boolean; slug?: string; description?: string;
}

interface CartItem extends Product {
  quantity: number;
}

interface User {
  id: string; name: string; email: string; tokens: number; isSeller: boolean;
}

interface StoreState {
  user: User | null; cart: CartItem[]; wishlist: Product[]; isLoading: boolean; isAuthModalOpen: boolean;
  setAuthModalOpen: (isOpen: boolean) => void;
  login: (email: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  checkUser: () => Promise<void>;
  addTokens: (amount: number) => void;
  useToken: () => Promise<boolean>;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  toggleWishlist: (product: Product) => void;
  clearCart: () => void;
  tokens: number;
  setTokens: (tokens: number) => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      user: null, cart: [], wishlist: [], isLoading: false, isAuthModalOpen: false,
      tokens: 0,

      setTokens: (tokens: number) => set((state) => ({
        user: state.user ? { ...state.user, tokens } : null,
        tokens,
      })),

      setAuthModalOpen: (isOpen: boolean) => set({ isAuthModalOpen: isOpen }),

      loginWithGoogle: async () => {
        set({ isLoading: true });
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: `${window.location.origin}/` }
        });
        if (error) alert(error.message);
        set({ isLoading: false });
      },

      login: async (email: string) => {
        set({ isLoading: true });
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: `${window.location.origin}/` }
        });
        if (error) alert(error.message);
        else {
          alert('Magic link sent to your email! Please check your inbox.');
          set({ isAuthModalOpen: false });
        }
        set({ isLoading: false });
      },

      logout: async () => {
        await supabase.auth.signOut();
        set({ user: null, tokens: 0 });
      },

      checkUser: async () => {
        const { data: { session } } = await supabase.auth.getSession();

        const syncProfile = async (authSession: any) => {
          if (!authSession) return;

          // 1. Supabase profiles tablosunu kontrol et / oluştur
          let { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authSession.user.id)
            .maybeSingle();

          if (!profile) {
            const { data: newProfile } = await supabase
              .from('profiles')
              .insert([{ id: authSession.user.id, email: authSession.user.email, tokens: 10 }])
              .select()
              .single();
            profile = newProfile;
          }

          if (!profile) return;

          // 2. MySQL'e senkronize et (fire & forget — hata olursa sessizce geç)
          try {
            await fetch(API_URL, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${authSession.access_token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                action: 'sync_user',
                supabase_id: authSession.user.id,
                email: authSession.user.email,
                name: authSession.user.user_metadata?.full_name || authSession.user.user_metadata?.name || authSession.user.email?.split('@')[0] || 'User',
                avatar: authSession.user.user_metadata?.avatar_url || null,
                tokens: profile.tokens,
              }),
            });
          } catch (e) {
            console.warn('[WARN] MySQL sync failed (non-critical):', e);
          }

          // 3. Store'u güncelle
          set({
            user: {
              id: authSession.user.id,
              name: authSession.user.user_metadata?.full_name || authSession.user.email?.split('@')[0] || 'User',
              email: authSession.user.email || '',
              tokens: profile.tokens,
              isSeller: false,
            },
            tokens: profile.tokens,
            isAuthModalOpen: false,
          });
        };

        if (session) await syncProfile(session);

        supabase.auth.onAuthStateChange(async (_event, session) => {
          if (session) {
            await syncProfile(session);
            if (window.location.hash.includes('access_token')) {
              window.history.replaceState(null, '', window.location.pathname);
            }
          } else {
            set({ user: null, tokens: 0 });
          }
        });
      },

      addTokens: (amount) => set((state) => ({
        user: state.user ? { ...state.user, tokens: state.user.tokens + amount } : null,
        tokens: state.tokens + amount,
      })),

      useToken: async () => {
        const { user } = get();
        if (!user || user.tokens <= 0) return false;

        const newCount = user.tokens - 1;

        // 1. Supabase'den düş (kaynak of truth)
        const { error } = await supabase
          .from('profiles')
          .update({ tokens: newCount })
          .eq('id', user.id);

        if (error) return false;

        // 2. Store güncelle
        set({ user: { ...user, tokens: newCount }, tokens: newCount });

        // 3. MySQL'e de yansıt (fire & forget)
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.access_token) {
            await fetch(API_URL, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                action: 'update_tokens',
                tokens: newCount,
              }),
            });
          }
        } catch (e) {
          console.warn('[WARN] MySQL token sync failed (non-critical):', e);
        }

        return true;
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
    {
      name: 'posterwall-storage',
      partialize: (state) => ({ user: state.user, cart: state.cart, wishlist: state.wishlist, tokens: state.tokens })
    }
  )
);
