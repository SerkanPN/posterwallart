import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ShoppingBag, ArrowRight, Camera, Star, Zap, Search, Music, Shield, Check, Eye } from 'lucide-react';

interface Product {
  id: string;
  title: string;
  price: number;
  image: string;
  category: string;
  slug: string;
  thumbnail?: string;
}

const CATEGORIES = ["ALL", "ABSTRACT", "CYBERPUNK", "MINIMALIST", "NATURE"];

// CARD 1: ROOM VISUALIZER SIMULATOR
function RoomVisualizerPreview() {
  const [activeFrame, setActiveFrame] = useState(0);
  const frames = [
    "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=400&q=80", // Living room
    "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=400&q=80", // Bedroom
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveFrame((prev) => (prev + 1) % frames.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-28 rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 flex items-center justify-center">
      <img src={frames[activeFrame]} className="w-full h-full object-cover opacity-50 transition-all duration-1000" />
      <div 
        className="absolute w-12 h-16 border border-zinc-700 bg-zinc-900 shadow-2xl flex items-center justify-center p-0.5 rounded-sm transition-all duration-1000"
        style={{
          transform: activeFrame === 0 
            ? 'perspective(400px) rotateY(15deg) skewY(-5deg) translate(-20px, -5px)' 
            : 'perspective(400px) rotateY(-10deg) skewY(2deg) translate(25px, 5px)'
        }}
      >
        <div className="w-full h-full bg-gradient-to-b from-indigo-500/20 to-purple-600/30 flex items-center justify-center relative overflow-hidden border border-zinc-800">
          <Camera className="w-3.5 h-3.5 text-zinc-400 absolute opacity-40 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

// CARD 2: AI PROMPT TYPEWRITER SIMULATOR
function PromptTyper() {
  const prompts = [
    "A futuristic cyberpunk street in neon purple and indigo...",
    "An abstract fluid gold and navy blue canvas print...",
    "A minimalist retro-wave mountain sunset illustration...",
    "A clean Scandinavian forest wrapped in morning fog..."
  ];
  const [text, setText] = useState("");
  const [promptIndex, setPromptIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [state, setState] = useState<'typing' | 'loading' | 'success'>('typing');

  useEffect(() => {
    if (state === 'loading') {
      const timer = setTimeout(() => {
        setState('success');
      }, 1500);
      return () => clearTimeout(timer);
    }
    if (state === 'success') {
      const timer = setTimeout(() => {
        setState('typing');
        setIsDeleting(true);
      }, 3000);
      return () => clearTimeout(timer);
    }

    const currentPrompt = prompts[promptIndex];
    const speed = isDeleting ? 20 : 40;

    if (!isDeleting && charIndex === currentPrompt.length) {
      setState('loading');
      return;
    }

    if (isDeleting && charIndex === 0) {
      setIsDeleting(false);
      setPromptIndex((prev) => (prev + 1) % prompts.length);
      return;
    }

    const timer = setTimeout(() => {
      setCharIndex((prev) => prev + (isDeleting ? -1 : 1));
      setText(currentPrompt.substring(0, charIndex + (isDeleting ? -1 : 1)));
    }, speed);

    return () => clearTimeout(timer);
  }, [charIndex, isDeleting, promptIndex, state]);

  return (
    <div className="bg-zinc-950/90 border border-zinc-800 rounded-2xl p-4 text-[10px] font-mono leading-normal shadow-inner relative overflow-hidden h-28 flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-1 opacity-30 mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
        </div>
        <span className="text-zinc-300 font-medium">{text}</span>
        {state === 'typing' && <span className="w-1 h-3 bg-indigo-500 inline-block animate-pulse ml-0.5 align-middle" />}
      </div>
      
      {state === 'loading' && (
        <div className="flex items-center gap-2 text-indigo-400 font-black justify-center py-2">
          <span className="w-2.5 h-2.5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span>Generating Masterpiece...</span>
        </div>
      )}

      {state === 'success' && (
        <div className="absolute inset-x-0 bottom-0 top-7 bg-zinc-950/95 flex items-center justify-center p-3 border-t border-zinc-900">
          <div className="flex items-center gap-3 w-full h-full">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 border border-indigo-400/20 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(99,102,241,0.3)]">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="text-[9px] leading-tight text-left">
              <span className="font-bold text-zinc-100 block uppercase tracking-wider">AI Generation Finished</span>
              <span className="text-zinc-500">4K Upscaling & Vector Exports Ready</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// CARD 3: MUSIC POSTERS ROTATING VINYL SIMULATOR
function MusicPosterPreview() {
  return (
    <div className="relative w-full h-28 rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950/80 p-4 flex items-center justify-between gap-4">
      {/* Mini Poster layout */}
      <div className="w-16 h-20 rounded bg-zinc-900 border border-zinc-800 p-1 flex flex-col justify-between shrink-0 relative shadow-md">
        <div className="aspect-square bg-gradient-to-br from-indigo-500 via-zinc-800 to-purple-600 rounded relative overflow-hidden border border-zinc-800">
          <div className="absolute inset-0 flex items-center justify-center text-[7px] font-black text-white uppercase tracking-tighter">BEAT</div>
        </div>
        <div className="flex flex-col gap-0.5 text-[5px] tracking-tight leading-none mt-1">
          <span className="font-black text-zinc-200">NEON HORIZON</span>
          <span className="text-zinc-600">REVERB CLUB</span>
        </div>
        <div className="h-1 bg-zinc-800 rounded-sm mt-1 flex items-center justify-between px-0.5 text-[4px] text-zinc-500 font-mono">
          <span>||||| | ||||</span>
        </div>
      </div>

      {/* Rotating Vinyl Disc */}
      <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
        <div className="w-20 h-20 rounded-full bg-zinc-950 border border-zinc-800 shadow-2xl flex items-center justify-center relative overflow-hidden animate-spin-slow">
          <div className="absolute inset-1 rounded-full border border-zinc-900" />
          <div className="absolute inset-2.5 rounded-full border border-zinc-900/50" />
          <div className="absolute inset-4 rounded-full border border-zinc-900/70" />
          <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center relative border border-zinc-950">
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-950" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    console.log("[LOG] Home: Fetching global marketplace collection...");
    const fetchProducts = async () => {
      try {
        const res = await fetch('https://api.posterwallart.shop/api.php?action=get_products');
        const data = await res.json();
        setProducts(data.products || []);
        console.log("[LOG] Home: Marketplace data received", data.products?.length);
      } catch (error) {
        console.error("[ERROR] Home: Failed to fetch products", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === "ALL" || product.category?.toUpperCase() === selectedCategory;
    const matchesSearch = product.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          product.category?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans relative overflow-x-hidden">
      
      {/* AMBIENT GLOWING ORBS */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[10%] left-[10%] w-[350px] h-[350px] bg-indigo-500/10 blur-[100px] rounded-full animate-pulse-glow" />
        <div className="absolute top-[30%] right-[5%] w-[450px] h-[450px] bg-purple-500/5 blur-[120px] rounded-full animate-float" />
        <div className="absolute top-[60%] left-[-5%] w-[300px] h-[300px] bg-indigo-500/5 blur-[90px] rounded-full animate-float-delayed" />
      </div>

      <div className="relative z-10">
        {/* HERO SECTION */}
        <section className="pt-24 pb-20 px-6 max-w-7xl mx-auto">
          <div className="text-center">
            
            {/* Redesign Live Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900/60 border border-zinc-800 backdrop-blur-md mb-8 shadow-2xl animate-float">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-300">Elite AI Art Marketplace v2.0</span>
            </div>
            
            {/* Premium Headline */}
            <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.9] uppercase text-zinc-50">
              Art Redefined <br /> By <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-400 to-indigo-500">Intelligence</span>
            </h1>
            
            <p className="max-w-2xl mx-auto text-zinc-400 text-base md:text-lg font-medium leading-relaxed mb-16">
              Browse our exclusive collection of AI-crafted posters or use our 
              advanced architectural tools to design art specifically for your walls.
            </p>

            {/* FOUR MAIN SERVICE CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-32 max-w-7xl mx-auto">
              
              {/* CARD 1: AI ROOM DESIGNER */}
              <Link to="/special" className="group relative bg-zinc-900/40 border border-zinc-800 p-6 lg:p-8 rounded-3xl overflow-hidden transition-all duration-300 hover:border-indigo-500/50 hover:bg-zinc-900/70 shadow-2xl flex flex-col justify-between gap-6">
                <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10 text-left flex flex-col gap-4">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20">
                    <Camera className="w-5 h-5 lg:w-6 lg:h-6 text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-xl lg:text-2xl font-black tracking-tight mb-2 uppercase text-zinc-100">AI Room Designer</h2>
                    <p className="text-zinc-500 text-[10px] lg:text-xs font-bold leading-normal">
                      Upload a photo of your space. Our AI analyzes lighting and perspective to visualize the perfect posters on your walls.
                    </p>
                  </div>
                </div>
                
                {/* Visual Preview */}
                <div className="relative z-10">
                  <RoomVisualizerPreview />
                </div>

                <div className="relative z-10 text-left mt-auto">
                  <span className="inline-flex items-center gap-2 text-indigo-400 font-bold text-[10px] lg:text-xs uppercase tracking-wider group-hover:gap-4 transition-all">
                    Design For Room <ArrowRight className="w-3 h-3 lg:w-3.5 lg:h-3.5" />
                  </span>
                </div>
              </Link>

              {/* CARD 2: HD CREATOR LAB */}
              <Link to="/lab" className="group relative bg-zinc-900/40 border border-zinc-800 p-6 lg:p-8 rounded-3xl overflow-hidden transition-all duration-300 hover:border-indigo-500/50 hover:bg-zinc-900/70 shadow-2xl flex flex-col justify-between gap-6">
                <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10 text-left flex flex-col gap-4">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20">
                    <Sparkles className="w-5 h-5 lg:w-6 lg:h-6 text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-xl lg:text-2xl font-black tracking-tight mb-2 uppercase text-zinc-100">HD Creator Lab</h2>
                    <p className="text-zinc-500 text-[10px] lg:text-xs font-bold leading-normal">
                      Generate premium posters using prompts. Upscale your designs to ultra-high resolution and convert them to vector files.
                    </p>
                  </div>
                </div>

                {/* Visual Preview */}
                <div className="relative z-10">
                  <PromptTyper />
                </div>

                <div className="relative z-10 text-left mt-auto">
                  <span className="inline-flex items-center gap-2 text-indigo-400 font-bold text-[10px] lg:text-xs uppercase tracking-wider group-hover:gap-4 transition-all">
                    Open Creator Lab <ArrowRight className="w-3 h-3 lg:w-3.5 lg:h-3.5" />
                  </span>
                </div>
              </Link>

              {/* CARD 3: CUSTOM MUSIC POSTERS */}
              <Link to="/music-posters" className="group relative bg-zinc-900/40 border border-zinc-800 p-6 lg:p-8 rounded-3xl overflow-hidden transition-all duration-300 hover:border-indigo-500/50 hover:bg-zinc-900/70 shadow-2xl flex flex-col justify-between gap-6">
                <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10 text-left flex flex-col gap-4">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20">
                    <Music className="w-5 h-5 lg:w-6 lg:h-6 text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-xl lg:text-2xl font-black tracking-tight mb-2 uppercase text-zinc-100">Music Posters</h2>
                    <p className="text-zinc-500 text-[10px] lg:text-xs font-bold leading-normal">
                      Design stunning Album Cover layouts or Spotify-style Song posters. Personalize colors, layouts, and barcodes.
                    </p>
                  </div>
                </div>

                {/* Visual Preview */}
                <div className="relative z-10">
                  <MusicPosterPreview />
                </div>

                <div className="relative z-10 text-left mt-auto">
                  <span className="inline-flex items-center gap-2 text-indigo-400 font-bold text-[10px] lg:text-xs uppercase tracking-wider group-hover:gap-4 transition-all">
                    Start Designing <ArrowRight className="w-3 h-3 lg:w-3.5 lg:h-3.5" />
                  </span>
                </div>
              </Link>

              {/* CARD 4: TREND POSTERS (NEW) */}
              <Link to="/trend-posters" className="group relative bg-zinc-900/40 border border-zinc-800 p-6 lg:p-8 rounded-3xl overflow-hidden transition-all duration-300 hover:border-indigo-500/50 hover:bg-zinc-900/70 shadow-2xl flex flex-col justify-between gap-6">
                <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10 text-left flex flex-col gap-4">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20">
                    <Star className="w-5 h-5 lg:w-6 lg:h-6 text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-xl lg:text-2xl font-black tracking-tight mb-2 uppercase text-zinc-100">Trend Posters</h2>
                    <p className="text-zinc-500 text-[10px] lg:text-xs font-bold leading-normal">
                      Create unique Soundwave posters, modern typographic prints, map coordinates, and personalized quote designs.
                    </p>
                  </div>
                </div>

                {/* Visual Preview */}
                <div className="relative z-10 w-full h-28 rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950/80 p-4 flex items-center justify-center gap-1.5 shadow-inner">
                  {/* Soundwave animation preview */}
                  {[...Array(12)].map((_, i) => (
                    <div 
                      key={i} 
                      className="w-1.5 bg-indigo-500 rounded-full" 
                      style={{ 
                        height: `${20 + Math.random() * 80}%`,
                        animation: `pulse ${1 + Math.random() * 2}s infinite alternate`
                      }} 
                    />
                  ))}
                </div>

                <div className="relative z-10 text-left mt-auto">
                  <span className="inline-flex items-center gap-2 text-indigo-400 font-bold text-[10px] lg:text-xs uppercase tracking-wider group-hover:gap-4 transition-all">
                    Explore Trends <ArrowRight className="w-3 h-3 lg:w-3.5 lg:h-3.5" />
                  </span>
                </div>
              </Link>

            </div>
              
              {/* CARD 1: AI ROOM DESIGNER */}
              <Link to="/special" className="group relative bg-zinc-900/40 border border-zinc-800 p-8 rounded-3xl overflow-hidden transition-all duration-300 hover:border-indigo-500/50 hover:bg-zinc-900/70 shadow-2xl flex flex-col justify-between gap-6">
                <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10 text-left flex flex-col gap-4">
                  <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20">
                    <Camera className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black tracking-tight mb-2 uppercase text-zinc-100">AI Room Designer</h2>
                    <p className="text-zinc-500 text-xs font-bold leading-normal">
                      Upload a photo of your space. Our AI analyzes lighting and perspective to visualize the perfect posters on your walls.
                    </p>
                  </div>
                </div>
                
                {/* Visual Preview */}
                <div className="relative z-10">
                  <RoomVisualizerPreview />
                </div>

                <div className="relative z-10 text-left">
                  <span className="inline-flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider group-hover:gap-4 transition-all">
                    Design For Room <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>

              {/* CARD 2: HD CREATOR LAB */}
              <Link to="/lab" className="group relative bg-zinc-900/40 border border-zinc-800 p-8 rounded-3xl overflow-hidden transition-all duration-300 hover:border-indigo-500/50 hover:bg-zinc-900/70 shadow-2xl flex flex-col justify-between gap-6">
                <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10 text-left flex flex-col gap-4">
                  <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20">
                    <Sparkles className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black tracking-tight mb-2 uppercase text-zinc-100">HD Creator Lab</h2>
                    <p className="text-zinc-500 text-xs font-bold leading-normal">
                      Generate premium posters using prompts. Upscale your designs to ultra-high resolution and convert them to vector files.
                    </p>
                  </div>
                </div>

                {/* Visual Preview */}
                <div className="relative z-10">
                  <PromptTyper />
                </div>

                <div className="relative z-10 text-left">
                  <span className="inline-flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider group-hover:gap-4 transition-all">
                    Open Creator Lab <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>

              {/* CARD 3: CUSTOM MUSIC POSTERS */}
              <Link to="/music-posters" className="group relative bg-zinc-900/40 border border-zinc-800 p-8 rounded-3xl overflow-hidden transition-all duration-300 hover:border-indigo-500/50 hover:bg-zinc-900/70 shadow-2xl flex flex-col justify-between gap-6">
                <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10 text-left flex flex-col gap-4">
                  <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20">
                    <Music className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black tracking-tight mb-2 uppercase text-zinc-100">Custom Music Posters</h2>
                    <p className="text-zinc-500 text-xs font-bold leading-normal">
                      Design stunning Album Cover layouts or Spotify-style Song posters. Personalize colors, layouts, and barcodes instantly.
                    </p>
                  </div>
                </div>

                {/* Visual Preview */}
                <div className="relative z-10">
                  <MusicPosterPreview />
                </div>

                <div className="relative z-10 text-left">
                  <span className="inline-flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider group-hover:gap-4 transition-all">
                    Start Designing <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>

            </div>
          </div>
        </section>

        {/* MARKETPLACE SECTION */}
        <section className="max-w-7xl mx-auto px-6 pb-24">
          
          {/* Header & Filter Controls */}
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between mb-16 border-b border-zinc-900 pb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4 text-indigo-400" />
                </div>
                <h2 className="text-3xl font-black tracking-tight uppercase">Community Gallery</h2>
              </div>
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Discover & Buy Community Masterpieces</p>
            </div>

            {/* Filter Tabs & Search */}
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
              {/* Category selector */}
              <div className="flex items-center bg-zinc-900/60 border border-zinc-800/80 p-1 rounded-full relative w-full sm:w-auto overflow-hidden">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 text-[10px] font-bold tracking-widest uppercase rounded-full relative z-10 transition-colors duration-305 cursor-pointer ${
                      selectedCategory === cat ? 'text-zinc-950 font-black' : 'text-zinc-400 hover:text-zinc-50'
                    }`}
                  >
                    {cat}
                    {selectedCategory === cat && (
                      <motion.div
                        layoutId="activeCategoryTab"
                        className="absolute inset-0 bg-zinc-50 rounded-full z-[-1]"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="flex bg-zinc-900 border border-zinc-800 rounded-full px-4 py-2 items-center gap-2 w-full sm:w-auto">
                <Search className="w-3.5 h-3.5 text-zinc-500" />
                <input 
                  type="text" 
                  placeholder="Search masterpieces..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-xs font-bold outline-none w-full sm:w-48 text-zinc-300 placeholder-zinc-650" 
                />
              </div>
            </div>
          </div>

          {/* Product Grid */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-[4/5] bg-zinc-900/60 rounded-3xl animate-pulse border border-zinc-850" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((product) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    key={product.id} 
                    className="group cursor-pointer"
                    onClick={() => console.log("[LOG] Home: Viewing product", product.id)}
                  >
                    <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-zinc-900 border border-zinc-800 mb-4 shadow-2xl transition-all duration-300 group-hover:border-indigo-500/30">
                      
                      {/* Image scale hover */}
                      <img 
                        src={product.thumbnail || product.image} 
                        alt={product.title} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                        <button className="w-full py-3 bg-zinc-50 hover:bg-zinc-200 text-zinc-950 font-bold text-xs uppercase rounded-full shadow-2xl flex items-center justify-center gap-2 transform translate-y-3 group-hover:translate-y-0 transition-transform duration-300 cursor-pointer">
                          <Eye className="w-3.5 h-3.5" /> Quick View
                        </button>
                      </div>

                      {/* Floating Price badge */}
                      <div className="absolute top-4 right-4 bg-zinc-950/70 backdrop-blur-md border border-zinc-800/80 px-3 py-1.5 rounded-xl">
                        <span className="text-xs font-black text-indigo-300 tracking-tight">${product.price}</span>
                      </div>
                    </div>

                    <div className="px-3">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">{product.category}</span>
                        <div className="flex items-center gap-0.5 opacity-60">
                          {[...Array(5)].map((_, i) => <Star key={i} className="w-2 h-2 fill-white text-white" />)}
                        </div>
                      </div>
                      <h3 className="text-sm font-bold tracking-tight text-zinc-100 truncate uppercase transition-colors group-hover:text-indigo-300">{product.title}</h3>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Empty Results state */}
          {!loading && filteredProducts.length === 0 && (
            <div className="text-center py-20 border border-dashed border-zinc-800 rounded-3xl bg-zinc-900/10">
              <Search className="w-8 h-8 text-zinc-600 mx-auto mb-4" />
              <p className="text-sm font-bold text-zinc-400 uppercase tracking-wider">No masterpieces found matching search criteria</p>
            </div>
          )}

          {/* Explore Button */}
          <div className="mt-16 text-center">
            <button 
              className="px-8 py-4 bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 rounded-2xl text-[10px] font-black uppercase tracking-[0.25em] hover:bg-zinc-900 transition-all cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
              onClick={() => console.log("[LOG] Home: Loading more products")}
            >
              Explore Full Collection
            </button>
          </div>
        </section>

        {/* TRUST & VALUES GRID */}
        <section className="border-t border-zinc-900 bg-zinc-950/60 relative overflow-hidden py-24">
          <div className="absolute inset-0 bg-grid-dots opacity-40 pointer-events-none" />
          <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
            <div className="flex flex-col gap-4 text-left p-6 rounded-2xl border border-zinc-900/60 bg-zinc-900/10 backdrop-blur-md">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-inner">
                <Shield className="w-5 h-5 text-indigo-400" />
              </div>
              <h3 className="text-lg font-black uppercase tracking-tight text-zinc-100">Museum-Grade Canvas</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Printed on heavy museum-grade cotton-mix canvas with archival fade-resistant pigment inks. Designed to last over a century.
              </p>
            </div>
            <div className="flex flex-col gap-4 text-left p-6 rounded-2xl border border-zinc-900/60 bg-zinc-900/10 backdrop-blur-md">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-inner">
                <Zap className="w-5 h-5 text-indigo-400" />
              </div>
              <h3 className="text-lg font-black uppercase tracking-tight text-zinc-100">AI Upscaled to 300 DPI</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Every prompt and image generated in our studio is upscaled up to 4K resolution at 300 DPI, guaranteeing clean, razor-sharp details.
              </p>
            </div>
            <div className="flex flex-col gap-4 text-left p-6 rounded-2xl border border-zinc-900/60 bg-zinc-900/10 backdrop-blur-md">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-inner">
                <Check className="w-5 h-5 text-indigo-400" />
              </div>
              <h3 className="text-lg font-black uppercase tracking-tight text-zinc-100">Secure Insured Shipping</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Shipped globally in rigid heavy-duty protective cardboard tubes. Insured against transport damages with free replacement.
              </p>
            </div>
          </div>
        </section>

        {/* VIP BANNER / NEWSLETTER */}
        <section className="max-w-5xl mx-auto px-6 py-24">
          <div className="relative rounded-3xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-xl p-8 md:p-12 overflow-hidden shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-transparent pointer-events-none" />
            <div className="text-left relative z-10 flex flex-col gap-2 max-w-md">
              <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-zinc-100">Join the Collective</h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-bold">
                Subscribe to our newsletter to receive exclusive drops, early access to new AI models, and 15% discount on your first canvas order.
              </p>
            </div>
            <div className="w-full md:w-auto relative z-10 flex flex-col sm:flex-row items-center gap-3">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="w-full sm:w-64 bg-zinc-950/80 border border-zinc-800/80 focus:border-indigo-500/50 rounded-xl px-4 py-3 text-xs font-bold outline-none text-zinc-200 placeholder-zinc-650 transition-colors" 
              />
              <button className="w-full sm:w-auto px-6 py-3 bg-zinc-50 hover:bg-zinc-200 text-zinc-950 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer">
                Subscribe
              </button>
            </div>
          </div>
        </section>
      </div>

    </div>
  );
}
