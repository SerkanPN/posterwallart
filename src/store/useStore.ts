import { create } from 'zustand';

export interface Product {
  id: string;
  title: string;
  price: number;
  image: string;
  category: string;
  type: 'physical' | 'digital';
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
  login: (user: User) => void;
  logout: () => void;
  addTokens: (amount: number) => void;
  useToken: () => boolean;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  toggleWishlist: (product: Product) => void;
  clearCart: () => void;
}

export const useStore = create<StoreState>((set, get) => ({
  user: { id: '1', name: 'Guest User', email: 'guest@example.com', tokens: 5, isSeller: false }, // Mock logged in user for demo
  cart: [],
  wishlist: [],
  login: (user) => set({ user }),
  logout: () => set({ user: null }),
  addTokens: (amount) => set((state) => ({ user: state.user ? { ...state.user, tokens: state.user.tokens + amount } : null })),
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
  removeFromCart: (productId) => set((state) => ({ cart: state.cart.filter(item => item.id !== productId) })),
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
}));
