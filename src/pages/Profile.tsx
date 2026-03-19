import { useStore } from '../store/useStore';
import { User, History, Package, Settings, LogOut, Zap, Mail } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '../lib/supabase'; // Supabase istemcisini import ettiğinden emin ol

export function Profile() {
  const { user, logout, login } = useStore();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error logging in with Google:', error);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-24 flex items-center justify-center min-h-[70vh]">
        <div className="w-full max-w-md bg-zinc-900/50 border border-zinc-800 p-10 rounded-[2.5rem] backdrop-blur-sm shadow-2xl">
          <div className="flex flex-col items-center text-center mb-10">
            <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center mb-6 border border-indigo-500/20">
              <User className="w-10 h-10 text-indigo-500" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Welcome Back</h2>
            <p className="text-zinc-500 text-sm">Sign in to manage your AI art gallery</p>
          </div>

          <div className="flex flex-col gap-4">
            {/* Google Login Button */}
            <button 
              onClick={handleGoogleLogin}
              className="flex items-center justify-center gap-3 w-full bg-white hover:bg-zinc-200 text-black font-bold py-4 rounded-2xl transition-all duration-300 shadow-lg shadow-white/5 group"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-800"></div></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#09090b] px-4 text-zinc-500 font-medium">Or email</span></div>
            </div>

            {/* Email Login */}
            <div className="space-y-3">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input 
                  type="email" 
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                />
              </div>
              <button 
                onClick={() => login(email)}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="flex flex-col md:flex-row gap-12">
        {/* Sidebar */}
        <div className="w-full md:w-64 flex flex-col gap-2">
          <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl mb-6 shadow-xl">
            <div className="w-16 h-16 bg-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center text-2xl font-bold mb-4 border border-indigo-500/10">
              {user.name?.charAt(0) || user.email?.charAt(0)}
            </div>
            <h2 className="font-bold text-lg text-white truncate">{user.name || 'User'}</h2>
            <p className="text-sm text-zinc-500 mb-4 truncate">{user.email}</p>
            <div className="flex items-center gap-2 text-indigo-400 font-mono text-sm bg-indigo-500/10 px-3 py-2 rounded-xl w-fit border border-indigo-500/10">
              <Zap className="w-4 h-4 fill-indigo-400" />
              {user.tokens} Tokens
            </div>
          </div>

          <nav className="flex flex-col gap-1">
            <button className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-indigo-600 text-white font-medium shadow-lg shadow-indigo-600/20 transition-all">
              <History className="w-5 h-5" />
              History
            </button>
            <button className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-zinc-400 hover:bg-zinc-900 hover:text-zinc-50 font-medium transition-colors">
              <Package className="w-5 h-5" />
              Orders
            </button>
            <button className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-zinc-400 hover:bg-zinc-900 hover:text-zinc-50 font-medium transition-colors">
              <Settings className="w-5 h-5" />
              Settings
            </button>
            <button 
              onClick={logout}
              className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-red-400 hover:bg-red-500/10 font-medium transition-colors mt-4"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="flex justify-between items-end mb-8">
            <h1 className="text-3xl font-bold tracking-tight uppercase text-white">Your Creations</h1>
            <p className="text-zinc-500 text-sm">Showing your latest generations</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="group relative aspect-[3/4] rounded-[2rem] overflow-hidden bg-zinc-900 border border-zinc-800 shadow-2xl transition-all hover:border-indigo-500/50">
                <img 
                  src={`https://picsum.photos/seed/history${i}/800/1200`} 
                  alt={`Generated Art ${i}`} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-6">
                  <p className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-2">Mar {19 - i}, 2026</p>
                  <button className="w-full py-3 bg-white text-black text-sm font-bold uppercase tracking-wider rounded-xl hover:bg-indigo-500 hover:text-white transition-colors duration-300">
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
