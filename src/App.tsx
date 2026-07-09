import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Layout & Components
import { Layout } from './components/Layout';

// Pages
import { Home } from './pages/Home';
import { Shop } from './pages/Shop';
import { Cart } from './pages/Cart';
import { Tokens } from './pages/Tokens';
import { Profile } from './pages/Profile';
import { SellerDashboard } from './pages/SellerDashboard';
import { Wishlist } from './pages/Wishlist';
import { ProductDetail } from './pages/ProductDetail';

// AI Services & Tools
import { SpecialForRoom } from './pages/SpecialForRoom'; 
import { HDTools } from './pages/HDTools';              

// Poster Builders
import { MusicPosterSelection } from './pages/MusicPosterSelection';
import SongPosterSelection from './pages/SongPosterSelection';
import AlbumPosterBuilder from './pages/AlbumPosterBuilder';
import SpotifyPosterBuilder from './pages/SpotifyPosterBuilder'; 
import VinylPosterBuilder from './pages/VinylPosterBuilder';

// State Management
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
          
          {/* AI SERVICES & TOOLS */}
          <Route path="special" element={<SpecialForRoom />} />
          <Route path="lab" element={<HDTools />} />

          {/* POSTER BUILDERS HIERARCHY */}
          {/* 1. Main Selection (Album Cover Poster vs Song Poster) */}
          <Route path="music-posters" element={<MusicPosterSelection />} />
          
          {/* 2. Album Cover Builder */}
          <Route path="custom-album" element={<AlbumPosterBuilder />} />
          
          {/* 3. Song Poster Sub-Selection (Spotify vs Vinyl) */}
          <Route path="song-poster" element={<SongPosterSelection />} />
          
          {/* 4. Song Poster Editors */}
          <Route path="song-poster/spotify" element={<SpotifyPosterBuilder />} />
          <Route path="song-poster/vinyl" element={<VinylPosterBuilder />} />
          
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
