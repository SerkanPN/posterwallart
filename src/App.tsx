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
import { SpecialForRoom } from './pages/SpecialForRoom'; // Added missing import
import { HDTools } from './pages/HDTools';              // Added missing import
import AlbumPosterBuilder from './pages/AlbumPosterBuilder';
import { useStore } from './store/useStore';

export default function App() {
  const { checkUser } = useStore();

  useEffect(() => {
    console.log("[LOG] App: Initializing system check...");
    try {
      checkUser();
      console.log("[LOG] App: User session verified");
    } catch (error) {
      console.error("[ERROR] App: Session verification failed", error);
    }
  }, [checkUser]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* MAIN PAGES */}
          <Route index element={<Home />} />
          <Route path="shop" element={<Shop />} />
          <Route path="product/:slug" element={<ProductDetail />} />
          
          {/* AI SERVICES */}
          <Route path="special" element={<SpecialForRoom />} />
          <Route path="lab" element={<HDTools />} />
          <Route path="custom-album" element={<AlbumPosterBuilder />} />
          
          {/* USER SYSTEM */}
          <Route path="cart" element={<Cart />} />
          <Route path="tokens" element={<Tokens />} />
          <Route path="profile" element={<Profile />} />
          <Route path="seller" element={<SellerDashboard />} />
          <Route path="wishlist" element={<Wishlist />} />

          {/* 404 FALLBACK */}
          <Route 
            path="*" 
            element={
              <div className="container mx-auto px-4 py-24 text-center">
                <h1 className="text-4xl font-black italic tracking-tighter uppercase text-zinc-600">
                  Resource Not Found
                </h1>
                <p className="text-zinc-500 mt-4 font-bold uppercase tracking-widest text-xs">
                  The requested module is under maintenance or does not exist.
                </p>
              </div>
            } 
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
