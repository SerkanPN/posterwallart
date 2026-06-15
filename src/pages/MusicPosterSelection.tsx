import { Link } from 'react-router-dom';
import { Disc, Music, ArrowRight } from 'lucide-react';

export function MusicPosterSelection() {
  return (
    <div className="min-h-[80vh] pt-24 pb-20 px-6 bg-zinc-950 flex flex-col items-center justify-center">
      <div className="max-w-5xl mx-auto text-center w-full">
        <h1 className="text-5xl md:text-6xl font-black italic tracking-tighter mb-4 uppercase text-white">
          Select Poster Type
        </h1>
        <p className="text-zinc-400 font-medium mb-16 max-w-2xl mx-auto">
          Do you want to showcase an entire album's tracklist and color palette, or focus on the player design of a single favorite song?
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* ALBUM COVER POSTER CARD */}
          <Link 
            to="/custom-album" 
            className="group relative bg-zinc-900 border border-zinc-800 p-10 rounded-[32px] overflow-hidden transition-all hover:border-indigo-500/50 hover:bg-zinc-900/80 text-left flex flex-col items-center text-center"
          >
            <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mb-6 transition-transform group-hover:scale-110 duration-500">
              <Disc className="w-10 h-10 text-indigo-500" />
            </div>
            <h2 className="text-3xl font-black italic tracking-tighter mb-3 uppercase text-zinc-100">Album Cover Poster</h2>
            <p className="text-zinc-500 text-sm font-bold mb-8 leading-relaxed">
              Design a minimalist, classic or vinyl-style poster featuring the full tracklist and extracted color palettes of an album.
            </p>
            <span className="mt-auto inline-flex items-center gap-2 text-indigo-500 font-black text-xs uppercase tracking-widest group-hover:gap-4 transition-all">
              Start Designing <ArrowRight className="w-4 h-4" />
            </span>
          </Link>

          {/* SONG POSTER CARD */}
          <Link 
            to="/song-poster" 
            className="group relative bg-zinc-900 border border-zinc-800 p-10 rounded-[32px] overflow-hidden transition-all hover:border-emerald-500/50 hover:bg-zinc-900/80 text-left flex flex-col items-center text-center"
          >
            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 transition-transform group-hover:scale-110 duration-500">
              <Music className="w-10 h-10 text-emerald-500" />
            </div>
            <h2 className="text-3xl font-black italic tracking-tighter mb-3 uppercase text-zinc-100">Song Poster</h2>
            <p className="text-zinc-500 text-sm font-bold mb-8 leading-relaxed">
              Create a Spotify-style playing screen for your favorite song. Customize the progress bar, barcode, and layout.
            </p>
            <span className="mt-auto inline-flex items-center gap-2 text-emerald-500 font-black text-xs uppercase tracking-widest group-hover:gap-4 transition-all">
              Start Designing <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
