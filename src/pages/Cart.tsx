import { useStore } from '../store/useStore';
import { Trash2, Plus, Minus, CreditCard, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Cart() {
  const { cart, removeFromCart, updateQuantity, clearCart } = useStore();

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  
  // Smart Bundling & Discounts logic
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  let discount = 0;
  let discountReason = '';

  if (subtotal > 150) {
    discount = subtotal * 0.2;
    discountReason = '20% Off (Over $150)';
  } else if (totalItems >= 3) {
    discount = subtotal * 0.2;
    discountReason = '20% Off (3+ Items)';
  } else if (totalItems === 2) {
    discount = subtotal * 0.1;
    discountReason = '10% Off (2 Items)';
  }

  const total = subtotal - discount;

  if (cart.length === 0) {
    return (
      <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center mb-6">
          <ShoppingBag className="w-10 h-10 text-zinc-500" />
        </div>
        <h2 className="text-3xl font-bold tracking-tighter uppercase mb-4">Your Cart is Empty</h2>
        <p className="text-zinc-500 mb-8 max-w-md">Looks like you haven't added any masterpieces to your collection yet.</p>
        <Link to="/shop" className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase tracking-widest rounded-xl transition-all">
          Explore The Collection
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold tracking-tighter uppercase mb-12">Checkout</h1>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Cart Items */}
        <div className="w-full lg:w-2/3">
          <div className="space-y-6">
            {cart.map(item => (
              <div key={item.id} className="flex gap-6 p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl items-center">
                <div className="w-24 h-32 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-800">
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-xl font-bold tracking-tight">{item.title}</h3>
                      <p className="text-sm text-zinc-500">{item.category} • {item.type}</p>
                    </div>
                    <p className="font-mono font-bold text-lg">${item.price * item.quantity}</p>
                  </div>

                  <div className="flex items-center justify-between mt-6">
                    <div className="flex items-center gap-4 bg-zinc-950 border border-zinc-800 rounded-full px-2 py-1">
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="font-mono text-sm w-4 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="text-zinc-500 hover:text-red-500 transition-colors flex items-center gap-2 text-sm font-medium"
                    >
                      <Trash2 className="w-4 h-4" />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="w-full lg:w-1/3">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 sticky top-24">
            <h2 className="text-2xl font-bold tracking-tighter uppercase mb-6">Order Summary</h2>
            
            <div className="space-y-4 text-sm mb-6 pb-6 border-b border-zinc-800">
              <div className="flex justify-between text-zinc-400">
                <span>Subtotal ({totalItems} items)</span>
                <span className="font-mono text-zinc-50">${subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-500">
                  <span>Discount: {discountReason}</span>
                  <span className="font-mono">-${discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-zinc-400">
                <span>Shipping</span>
                <span className="font-mono text-zinc-50">Calculated at next step</span>
              </div>
            </div>

            <div className="flex justify-between items-end mb-8">
              <span className="text-lg font-bold uppercase tracking-wider text-zinc-400">Total</span>
              <span className="text-3xl font-mono font-bold">${total.toFixed(2)}</span>
            </div>

            <button className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-3 mb-4">
              <CreditCard className="w-5 h-5" />
              Checkout Securely
            </button>
            <p className="text-xs text-center text-zinc-500">
              Payments processed securely via Stripe & PayPal.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
