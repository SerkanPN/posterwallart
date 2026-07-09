import { Link } from 'react-router-dom';
import { ArrowLeft, Activity, MapPin, AlignLeft, ReceiptText } from 'lucide-react';

export default function TrendPostersSelection() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans p-6 md:p-12 relative overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-purple-500/5 blur-[150px] rounded-full" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Header */}
        <div className="mb-16">
          <Link to="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-300 text-xs font-bold uppercase tracking-widest mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-4 uppercase text-zinc-100">
            Trend <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">Posters</span>
          </h1>
          <p className="text-zinc-400 max-w-2xl font-medium leading-relaxed">
            Create personalized and meaningful wall art. From real audio soundwaves to minimalist location coordinates, design the perfect gift or aesthetic centerpiece.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* CARD 1: SOUNDWAVE (ACTIVE) */}
          <Link to="/trend-posters/soundwave" className="group relative bg-zinc-900/60 border border-zinc-800 p-8 rounded-3xl overflow-hidden transition-all duration-300 hover:border-indigo-500/50 hover:bg-zinc-900/80 shadow-2xl flex flex-col justify-between h-[320px]">
            <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative z-10 flex items-center justify-between">
              <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20">
                <Activity className="w-6 h-6 text-indigo-400" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                Popular
              </span>
            </div>

            <div className="relative z-10">
              <h2 className="text-2xl font-black tracking-tight mb-2 uppercase text-zinc-100">Soundwave Art</h2>
              <p className="text-zinc-500 text-xs font-bold leading-relaxed">
                Generate aesthetic soundwaves or upload an MP3/WAV file to visualize real audio like a baby's heartbeat or a voice message.
              </p>
            </div>
            
            {/* Visual Deco */}
            <div className="absolute -bottom-6 -right-6 opacity-10 group-hover:opacity-20 transition-opacity duration-500 flex gap-2 rotate-12">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="w-4 bg-zinc-100 rounded-full" style={{ height: `${40 + Math.random() * 80}px` }} />
              ))}
            </div>
          </Link>

          {/* CARD 2: TYPOGRAPHY (COMING SOON) */}
          <div className="relative bg-zinc-900/20 border border-zinc-800/50 p-8 rounded-3xl overflow-hidden flex flex-col justify-between h-[320px] opacity-60 grayscale">
            <div className="relative z-10 flex items-center justify-between">
              <div className="w-12 h-12 bg-zinc-800/50 rounded-2xl flex items-center justify-center border border-zinc-700">
                <AlignLeft className="w-6 h-6 text-zinc-500" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 bg-zinc-800/50 px-3 py-1 rounded-full border border-zinc-700">
                Coming Soon
              </span>
            </div>

            <div className="relative z-10">
              <h2 className="text-2xl font-black tracking-tight mb-2 uppercase text-zinc-100">Modern Typography</h2>
              <p className="text-zinc-500 text-xs font-bold leading-relaxed">
                Create Swiss-style minimalist typographic posters for quotes, company values, or personal manifestos.
              </p>
            </div>
          </div>

          {/* CARD 3: COORDINATES (COMING SOON) */}
          <div className="relative bg-zinc-900/20 border border-zinc-800/50 p-8 rounded-3xl overflow-hidden flex flex-col justify-between h-[320px] opacity-60 grayscale">
            <div className="relative z-10 flex items-center justify-between">
              <div className="w-12 h-12 bg-zinc-800/50 rounded-2xl flex items-center justify-center border border-zinc-700">
                <MapPin className="w-6 h-6 text-zinc-500" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 bg-zinc-800/50 px-3 py-1 rounded-full border border-zinc-700">
                Coming Soon
              </span>
            </div>

            <div className="relative z-10">
              <h2 className="text-2xl font-black tracking-tight mb-2 uppercase text-zinc-100">Map Coordinates</h2>
              <p className="text-zinc-500 text-xs font-bold leading-relaxed">
                Design beautiful coordinate art for a new home, the place you met, or your favorite travel destination.
              </p>
            </div>
          </div>

          {/* CARD 4: RECEIPT (COMING SOON) */}
          <div className="relative bg-zinc-900/20 border border-zinc-800/50 p-8 rounded-3xl overflow-hidden flex flex-col justify-between h-[320px] opacity-60 grayscale">
            <div className="relative z-10 flex items-center justify-between">
              <div className="w-12 h-12 bg-zinc-800/50 rounded-2xl flex items-center justify-center border border-zinc-700">
                <ReceiptText className="w-6 h-6 text-zinc-500" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 bg-zinc-800/50 px-3 py-1 rounded-full border border-zinc-700">
                Coming Soon
              </span>
            </div>

            <div className="relative z-10">
              <h2 className="text-2xl font-black tracking-tight mb-2 uppercase text-zinc-100">Vintage Receipt</h2>
              <p className="text-zinc-500 text-xs font-bold leading-relaxed">
                Turn marathon stats, special dates, or cafe menus into aesthetic vintage supermarket receipt posters.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
