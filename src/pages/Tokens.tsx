import { useStore } from '../store/useStore';
import { Sparkles, Zap, Crown, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

const PACKAGES = [
  { id: 'pkg_1', name: 'Starter', tokens: 1, price: 1, icon: Sparkles, color: 'text-zinc-400', bg: 'bg-zinc-900', border: 'border-zinc-800' },
  { id: 'pkg_5', name: 'Creator', tokens: 5, price: 5, icon: Zap, color: 'text-indigo-400', bg: 'bg-indigo-950/20', border: 'border-indigo-500/50', popular: true },
  { id: 'pkg_10', name: 'Pro', tokens: 10, price: 10, icon: Crown, color: 'text-amber-400', bg: 'bg-amber-950/20', border: 'border-amber-500/50' },
];

export function Tokens() {
  const { user, addTokens } = useStore();

  const handlePurchase = (pkg: typeof PACKAGES[0]) => {
    if (!user) {
      alert('Please sign in to purchase tokens.');
      return;
    }
    // Mock purchase flow
    alert(`Purchasing ${pkg.tokens} tokens for $${pkg.price}...`);
    setTimeout(() => {
      addTokens(pkg.tokens);
      alert('Purchase successful!');
    }, 1000);
  };

  return (
    <div className="container mx-auto px-4 py-24 max-w-5xl">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold tracking-tighter uppercase mb-6">
          Fuel Your <span className="text-indigo-500">Creativity</span>
        </h1>
        <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
          Purchase AI generation tokens to create unique, high-end posters for your space. 
          1 Token = 1 AI Generation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {PACKAGES.map((pkg, i) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={pkg.id}
            className={`relative flex flex-col p-8 rounded-3xl border ${pkg.bg} ${pkg.border} backdrop-blur-sm`}
          >
            {pkg.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                Most Popular
              </div>
            )}
            
            <div className="flex items-center justify-between mb-8">
              <pkg.icon className={`w-10 h-10 ${pkg.color}`} />
              <h3 className="text-2xl font-bold tracking-tight">{pkg.name}</h3>
            </div>

            <div className="mb-8">
              <span className="text-5xl font-bold tracking-tighter">${pkg.price}</span>
              <span className="text-zinc-500 ml-2">USD</span>
            </div>

            <ul className="space-y-4 mb-12 flex-1">
              <li className="flex items-center gap-3 text-zinc-300">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span>{pkg.tokens} AI Generations</span>
              </li>
              <li className="flex items-center gap-3 text-zinc-300">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span>High-Resolution Output</span>
              </li>
              <li className="flex items-center gap-3 text-zinc-300">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span>Commercial Rights</span>
              </li>
            </ul>

            <button
              onClick={() => handlePurchase(pkg)}
              className={`w-full py-4 font-bold uppercase tracking-widest rounded-xl transition-all ${
                pkg.popular 
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-[0_0_30px_rgba(99,102,241,0.3)]' 
                  : 'bg-zinc-100 hover:bg-white text-zinc-900'
              }`}
            >
              Purchase Now
            </button>
          </motion.div>
        ))}
      </div>

      {user && (
        <div className="mt-16 text-center p-8 bg-zinc-900/50 border border-zinc-800 rounded-2xl max-w-md mx-auto">
          <p className="text-zinc-400 uppercase tracking-widest text-sm mb-2">Current Balance</p>
          <p className="text-4xl font-mono font-bold text-indigo-400">{user.tokens} Tokens</p>
        </div>
      )}
    </div>
  );
}
