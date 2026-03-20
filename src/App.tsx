import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Shop } from './pages/Shop';
import { Cart } from './pages/Cart';
import { Tokens } from './pages/Tokens';
import { Profile } from './pages/Profile';
import { SellerDashboard } from './pages/SellerDashboard';
import { Wishlist } from './pages/Wishlist';
import { ProductDetail } from './pages/ProductDetail';
import { useStore } from './store/useStore';

export default function App() {
  const { checkUser } = useStore();
  useEffect(() => { checkUser(); }, [checkUser]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="shop" element={<Shop />} />
          <Route path="product/:slug" element={<ProductDetail />} />
          <Route path="cart" element={<Cart />} />
          <Route path="tokens" element={<Tokens />} />
          <Route path="profile" element={<Profile />} />
          <Route path="seller" element={<SellerDashboard />} />
          <Route path="wishlist" element={<Wishlist />} />
          <Route path="*" element={<div className="container mx-auto px-4 py-24 text-center h-screen flex flex-col justify-center"><h1 className="text-4xl font-bold uppercase tracking-tighter italic">404 - Dimension Not Found</h1></div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
