import { create } from 'zustand';
import { persist } from 'zustand/middleware'; // Verileri hafızada tutmak için eklendi
import { supabase } from '../lib/supabase';

export interface Product {
  id: string;
  title: string;
  price: number;
  image: string;
  category: string;
  type: 'physical' | 'digital';
  isGenerated?: boolean; // AI tasarımları için eklendi
}

interface CartItem extends Product {
  quantity: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  tokens: number;
  isSeller: boolean;
}

interface StoreState {
  user: User | null;
  cart: CartItem[];
  wishlist: Product[];
  isLoading: boolean;
  
  login: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  checkUser: () => Promise<void>;
  
  addTokens: (amount: number) => void;
  useToken: () => boolean;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  toggleWishlist: (product: Product) => void;
  clearCart: () => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      user: null,
      cart: [],
      wishlist: [],
      isLoading: false,

      login: async (email: string) => {
        set({ isLoading: true });
        const { error } = await supabase.auth.signInWithOtp({ email });
        if (error) {
          alert(error.message);
        } else {
          alert('Giriş linki e-posta adresine gönderildi! Lütfen kontrol et.');
        }
        set({ isLoading: false });
      },

      logout: async () => {
        await supabase.auth.signOut();
        set({ user: null });
        // Çıkış yapınca sepeti temizlemek istersen: set({ cart: [], wishlist: [] });
      },

      checkUser: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        const currentUser = get().user;

        if (session) {
          // Eğer zaten bir kullanıcı varsa ve jetonları güncellenmişse, 
          // 5 jetonla üzerine yazma (Kalıcılık anahtarı burası)
          set({ 
            user: { 
              id: session.user.id, 
              name: session.user.email?.split('@')[0] || 'User', 
              email: session.user.email || '', 
              tokens: currentUser?.id === session.user.id ? currentUser.tokens : 5, 
              isSeller: false 
            } 
          });
        }
        
        supabase.auth.onAuthStateChange((_event, session) => {
          if (session) {
            const updatedUser = get().user;
            set({ 
              user: { 
                id: session.user.id, 
                name: session.user.email?.split('@')[0] || 'User', 
                email: session.user.email || '', 
                tokens: updatedUser?.id === session.user.id ? updatedUser.tokens : 5, 
                isSeller: false 
              } 
            });
          } else {
            set({ user: null });
          }
        });
      },

      addTokens: (amount) => set((state) => ({ 
        user: state.user ? { ...state.user, tokens: state.user.tokens + amount } : null 
      })),

      useToken: () => {
        const { user } = get();
        if (user && user.tokens > 0) {
          set({ user: { ...user, tokens: user.tokens - 1 } });
          return true;
        }
        return false;
      },

      addToCart: (product) => set((state) => {
        const existing = state.cart.find(item => item.id === product.id);
        if (existing) {
          return { cart: state.cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item) };
        }
        return { cart: [...state.cart, { ...product, quantity: 1 }] };
      }),

      removeFromCart: (productId) => set((state) => ({ 
        cart: state.cart.filter(item => item.id !== productId) 
      })),
      
      updateQuantity: (productId, quantity) => set((state) => ({
        cart: state.cart.map(item => item.id === productId ? { ...item, quantity: Math.max(1, quantity) } : item)
      })),
      
      toggleWishlist: (product) => set((state) => {
        const exists = state.wishlist.find(item => item.id === product.id);
        if (exists) {
          return { wishlist: state.wishlist.filter(item => item.id !== product.id) };
        }
        return { wishlist: [...state.wishlist, product] };
      }),
      
      clearCart: () => set({ cart: [] }),
    }),
    {
      name: 'posterwall-storage', // LocalStorage'da bu isimle saklanır
      partialize: (state) => ({ 
        user: state.user, 
        cart: state.cart, 
        wishlist: state.wishlist 
      }), // Sadece bu alanları kaydet, isLoading gibi geçici şeyleri kaydetme
    }
  )
);
