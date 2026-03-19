/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Shop } from './pages/Shop';
import { Cart } from './pages/Cart';
import { Tokens } from './pages/Tokens';
import { Profile } from './pages/Profile';
import { SellerDashboard } from './pages/SellerDashboard';
import { Wishlist } from './pages/Wishlist';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="shop" element={<Shop />} />
          <Route path="cart" element={<Cart />} />
          <Route path="tokens" element={<Tokens />} />
          <Route path="profile" element={<Profile />} />
          <Route path="seller" element={<SellerDashboard />} />
          <Route path="wishlist" element={<Wishlist />} />
          {/* Fallbacks for other routes */}
          <Route path="*" element={<div className="container mx-auto px-4 py-24 text-center"><h1 className="text-4xl font-bold uppercase">Coming Soon</h1></div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
