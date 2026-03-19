import { useStore } from '../store/useStore';
import { User, History, Package, Settings, LogOut, Zap } from 'lucide-react';
import { useState } from 'react';

export function Profile() {
  const { user, logout, login } = useStore();
  const [email, setEmail] = useState('');

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center text-center">
        <User className="w-16 h-16 text-zinc-500 mb-6" />
        <h2 className="text-3xl font-bold tracking-tighter uppercase mb-4">Sign in to view profile</h2>
        <div className="flex w-full max-w-sm gap-2">
          <input 
            type="email" 
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-4 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <button 
            onClick={() => login(email)}
            className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase tracking-widest rounded-xl transition-all"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="flex flex-col md:flex-row gap-12">
        {/* Sidebar */}
        <div className="w-full md:w-64 flex flex-col gap-2">
          <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl mb-6">
            <div className="w-16 h-16 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center text-2xl font-bold mb-4">
              {user.name.charAt(0)}
            </div>
            <h2 className="font-bold text-lg">{user.name}</h2>
            <p className="text-sm text-zinc-500 mb-4">{user.email}</p>
            <div className="flex items-center gap-2 text-indigo-400 font-mono text-sm bg-indigo-500/10 px-3 py-1.5 rounded-full w-fit">
              <Zap className="w-4 h-4" />
              {user.tokens} Tokens
            </div>
          </div>

          <nav className="flex flex-col gap-1">
            <button className="flex items-center gap-3 px-4 py-3 rounded-xl bg-zinc-800 text-zinc-50 font-medium transition-colors">
              <History className="w-5 h-5" />
              Generation History
            </button>
            <button className="flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-400 hover:bg-zinc-900 hover:text-zinc-50 font-medium transition-colors">
              <Package className="w-5 h-5" />
              Orders
            </button>
            <button className="flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-400 hover:bg-zinc-900 hover:text-zinc-50 font-medium transition-colors">
              <Settings className="w-5 h-5" />
              Settings
            </button>
            <button 
              onClick={logout}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 font-medium transition-colors mt-4"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tighter uppercase mb-8">Generation History</h1>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Mock History Items */}
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="group relative aspect-[2/3] rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800">
                <img 
                  src={`https://picsum.photos/seed/history${i}/800/1200`} 
                  alt={`Generated Art ${i}`} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                  <p className="text-sm font-bold uppercase tracking-wider mb-2">Generated on Mar {19 - i}</p>
                  <button className="w-full py-2 bg-white text-black text-xs font-bold uppercase tracking-wider rounded transition-colors">
                    Order Print
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
