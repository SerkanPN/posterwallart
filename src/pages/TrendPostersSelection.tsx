import { Link } from 'react-router-dom';
import { ArrowLeft, Activity, AlignLeft, MapPin, ReceiptText, Star, Mic2, FileText, Camera } from 'lucide-react';

export default function TrendPostersSelection() {
  const templates = [
    {
      id: 'soundwave',
      title: 'Soundwave Art',
      desc: 'Visualize real audio files or voice messages into aesthetic soundwave posters.',
      icon: Activity,
      path: '/trend-posters/soundwave',
      active: true
    },
    {
      id: 'typography',
      title: 'Modern Typography',
      desc: 'Swiss-style minimalist text layouts for quotes and personal manifestos.',
      icon: AlignLeft,
      path: '#',
      active: false
    },
    {
      id: 'coordinates',
      title: 'Map Coordinates',
      desc: 'Minimalist map pins and precise GPS coordinates of your special locations.',
      icon: MapPin,
      path: '#',
      active: false
    },
    {
      id: 'receipt',
      title: 'Vintage Receipt',
      desc: 'Turn memories, playlists, or marathon stats into retro supermarket receipts.',
      icon: ReceiptText,
      path: '#',
      active: false
    },
    {
      id: 'starmap',
      title: 'Astronomy Star Map',
      desc: 'Accurate constellations of the night sky based on a specific date and place.',
      icon: Star,
      path: '#',
      active: false
    },
    {
      id: 'cassette',
      title: 'Retro Cassette Tape',
      desc: 'Nostalgic 80s mixtape designs customized with your own text and colors.',
      icon: Mic2,
      path: '#',
      active: false
    },
    {
      id: 'typewriter',
      title: 'Typewriter Letter',
      desc: 'Classic typed letters on aged paper backgrounds for vows and poetry.',
      icon: FileText,
      path: '#',
      active: false
    },
    {
      id: 'polaroid',
      title: 'Polaroid Gallery',
      desc: 'Photo collage templates styled like vintage polaroid films with captions.',
      icon: Camera,
      path: '#',
      active: false
    }
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col relative overflow-hidden font-sans">
      
      {/* Background gradients */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] bg-indigo-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[10%] right-[10%] w-[600px] h-[600px] bg-purple-500/5 blur-[150px] rounded-full" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 relative z-10 w-full max-w-7xl mx-auto">
        
        {/* Header section matching the reference image */}
        <div className="text-center mb-16 mt-8">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-2">
            Choose Trend Poster Style
          </h1>
          <p className="text-zinc-400 text-sm font-medium">
            Select a template concept to start designing your personalized artwork.
          </p>
        </div>

        {/* 4 Cards per row Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl">
          {templates.map((tpl) => (
            <Link 
              key={tpl.id}
              to={tpl.path}
              className={`group flex flex-col items-center text-center p-8 rounded-2xl border transition-all duration-300
                ${tpl.active 
                  ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800/80 cursor-pointer' 
                  : 'bg-zinc-900/50 border-zinc-800/50 opacity-60 cursor-not-allowed'
                }
              `}
              onClick={(e) => {
                if (!tpl.active) e.preventDefault();
              }}
            >
              {/* Graphic Icon Container */}
              <div className={`w-32 h-32 mb-8 rounded-xl flex items-center justify-center
                ${tpl.active ? 'bg-zinc-100 text-zinc-950' : 'bg-zinc-800 text-zinc-600'}
              `}>
                <tpl.icon className="w-16 h-16 stroke-[1.5]" />
              </div>

              {/* Texts */}
              <h3 className="text-lg font-bold text-white tracking-tight mb-3">
                {tpl.title}
                {!tpl.active && <span className="ml-2 text-[9px] uppercase tracking-widest text-zinc-500 border border-zinc-700 px-2 py-0.5 rounded-full">Soon</span>}
              </h3>
              <p className="text-zinc-400 text-xs leading-relaxed font-medium">
                {tpl.desc}
              </p>
            </Link>
          ))}
        </div>

        {/* Back Button matching reference */}
        <div className="mt-16">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Main Menu
          </Link>
        </div>

      </div>
    </div>
  );
}
