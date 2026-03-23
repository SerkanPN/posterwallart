import { Link } from 'react-router-dom';
import { Sparkles, Maximize, Box, Zap, ArrowRight, Layout, Camera, Image as ImageIcon } from 'lucide-react';

export function Home() {
  console.log("[LOG] Landing Page mounted");

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-zinc-950 text-zinc-50 font-sans overflow-x-hidden">
      {/* HERO SECTION */}
      <section className="relative pt-20 pb-32 px-6">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-emerald-500/10 blur-[120px] rounded-full" />
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <Sparkles className="w-3 h-3 text-emerald-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Next-Gen AI Art Studio</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter mb-8 leading-[0.9]">
            TRANSFORM YOUR <span className="text-emerald-500">WALLS</span> <br />
            WITH THE POWER OF AI
          </h1>
          
          <p className="max-w-2xl mx-auto text-zinc-400 text-lg font-medium leading-relaxed mb-12">
            Odanıza özel tasarımlar üretin veya profesyonel AI laboratuvarımızda 
            başyapıtlar yaratın. Sınır yok, sadece hayal gücü.
          </p>
        </div>

        {/* CTA CARDS */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 px-4">
          
          {/* SPECIAL FOR YOUR ROOM */}
          <Link 
            to="/special" 
            className="group relative bg-zinc-900 border border-zinc-800 p-10 rounded-[40px] overflow-hidden transition-all hover:border-emerald-500/50 hover:shadow-[0_0_50px_rgba(16,185,129,0.1)]"
            onClick={() => console.log("[LOG] User navigating to Special for Room")}
          >
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <Camera className="w-32 h-32 text-white" />
            </div>
            
            <div className="relative z-10">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-6">
                <Layout className="w-6 h-6 text-emerald-500" />
              </div>
              <h2 className="text-3xl font-black italic tracking-tighter mb-4 uppercase">Special For <br /> Your Room</h2>
              <p className="text-zinc-500 text-sm font-bold mb-8 leading-relaxed">
                Odanızın fotoğrafını yükleyin, AI duvarınızı analiz etsin ve perspektife uygun, 
                mobilyalarınızla uyumlu özel sanat eserleri hazırlasın.
              </p>
              <div className="flex items-center gap-2 text-emerald-500 font-black text-xs uppercase tracking-widest">
                Start Previewing <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
              </div>
            </div>
          </Link>

          {/* HD ART LAB */}
          <Link 
            to="/lab" 
            className="group relative bg-zinc-900 border border-zinc-800 p-10 rounded-[40px] overflow-hidden transition-all hover:border-blue-500/50 hover:shadow-[0_0_50px_rgba(59,130,246,0.1)]"
            onClick={() => console.log("[LOG] User navigating to HD Art Lab")}
          >
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <Zap className="w-32 h-32 text-white" />
            </div>

            <div className="relative z-10">
              <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-6">
                <Maximize className="w-6 h-6 text-blue-500" />
              </div>
              <h2 className="text-3xl font-black italic tracking-tighter mb-4 uppercase">HD Sanat <br /> Laboratuvarı</h2>
              <p className="text-zinc-500 text-sm font-bold mb-8 leading-relaxed">
                Flux, Juggernaut ve özel LoRA'lar ile en yüksek kalitede üretim yapın. 
                Görsellerinizi 2K çözünürlüğe yükseltin veya vektöre (SVG) dönüştürün.
              </p>
              <div className="flex items-center gap-2 text-blue-500 font-black text-xs uppercase tracking-widest">
                Enter The Lab <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
              </div>
            </div>
          </Link>

        </div>
      </section>

      {/* TOOLS BENTO BOX MINI */}
      <section className="py-20 border-t border-zinc-900">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-6 bg-zinc-900/50 rounded-3xl border border-zinc-800 text-center group">
            <ImageIcon className="w-6 h-6 text-zinc-600 mx-auto mb-3 group-hover:text-emerald-500 transition-colors" />
            <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">FLUX.1 Engine</h3>
          </div>
          <div className="p-6 bg-zinc-900/50 rounded-3xl border border-zinc-800 text-center group">
            <Maximize className="w-6 h-6 text-zinc-600 mx-auto mb-3 group-hover:text-emerald-500 transition-colors" />
            <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">2X HD Upscale</h3>
          </div>
          <div className="p-6 bg-zinc-900/50 rounded-3xl border border-zinc-800 text-center group">
            <Box className="w-6 h-6 text-zinc-600 mx-auto mb-3 group-hover:text-emerald-500 transition-colors" />
            <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">SVG Vectorize</h3>
          </div>
          <div className="p-6 bg-zinc-900/50 rounded-3xl border border-zinc-800 text-center group">
            <Zap className="w-6 h-6 text-zinc-600 mx-auto mb-3 group-hover:text-emerald-500 transition-colors" />
            <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">LoRA Adapters</h3>
          </div>
        </div>
      </section>

      {/* FOOTER MINI */}
      <footer className="py-12 border-t border-zinc-900 text-center">
        <p className="text-[10px] text-zinc-700 font-black uppercase tracking-[0.5em]">
          &copy; 2026 POSTERWALLART STUDIO · Powered by Runware
        </p>
      </footer>
    </div>
  );
}
