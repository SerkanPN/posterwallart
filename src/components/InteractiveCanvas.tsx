import { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue } from 'motion/react';
import { Move, ZoomIn } from 'lucide-react';

interface InteractiveCanvasProps {
  backgroundImage: string;
  mountedArt: string | null;
  physicalWidth: number;
  physicalHeight: number;
  naturalPixelsPerInch: number;
  frameColor: string | null;
  perspective: { rotateY: number; skewY: number };
}

export function InteractiveCanvas({ 
  backgroundImage, mountedArt, physicalWidth, physicalHeight, 
  naturalPixelsPerInch, frameColor, perspective 
}: InteractiveCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [displayScale, setDisplayScale] = useState(1);
  const [globalZoom, setGlobalZoom] = useState(1); // Slider kontrolü için
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  useEffect(() => {
    if (!backgroundImage || !containerRef.current) return;
    const img = new Image();
    img.src = backgroundImage;
    img.onload = () => {
      const container = containerRef.current;
      if (!container) return;
      const containerRatio = container.clientWidth / container.clientHeight;
      const imgRatio = img.width / img.height;
      const renderedWidth = containerRatio > imgRatio ? container.clientHeight * imgRatio : container.clientWidth;
      setDisplayScale(renderedWidth / img.width);
    };
  }, [backgroundImage]);

  // PPI dengesi: 24x36 seçildiğinde odaya göre cüce kalmaması için 5-10 arası tutuyoruz.
  const safePPI = Math.min(Math.max(naturalPixelsPerInch || 6, 5), 10);
  const effectivePPI = safePPI * displayScale;
  
  const widthPx = physicalWidth * effectivePPI;
  const heightPx = physicalHeight * effectivePPI;

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center group">
      {/* CANVAS ALANI */}
      <div 
        ref={containerRef} 
        className="relative w-full h-full rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 flex items-center justify-center cursor-move"
      >
        <motion.div
          drag
          dragConstraints={containerRef}
          style={{ x, y, scale: globalZoom }}
          className="relative w-full h-full flex items-center justify-center"
        >
          {backgroundImage && (
            <img src={backgroundImage} className="w-full h-full object-contain pointer-events-none" />
          )}
          
          <motion.div
            drag
            dragConstraints={containerRef}
            dragMomentum={false}
            className="absolute cursor-grab active:cursor-grabbing flex items-center justify-center z-10"
            style={{ 
              width: widthPx, height: heightPx,
              padding: frameColor ? '4px' : '0px',
              backgroundColor: frameColor || (mountedArt ? 'transparent' : 'rgba(255,255,255,0.1)'),
              border: !mountedArt ? '1px dashed rgba(255,255,255,0.3)' : 'none',
              boxShadow: mountedArt ? '0 30px 60px rgba(0,0,0,0.6)' : 'none',
              transform: `perspective(1200px) rotateY(${perspective.rotateY}deg) skewY(${perspective.skewY}deg)`
            }}
          >
            {mountedArt ? (
              <img src={mountedArt} className="w-full h-full object-cover rounded-sm" draggable={false} />
            ) : (
              <div className="flex flex-col items-center gap-2 opacity-20">
                <Move className="w-4 h-4 text-white" />
                <span className="text-[8px] uppercase font-bold tracking-widest text-white">Position<br/>Art</span>
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>

      {/* ZOOM SLIDER - Alt tarafta sabit durur */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-zinc-900/80 backdrop-blur-xl px-6 py-3 rounded-2xl border border-white/10 flex items-center gap-4 shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-50">
        <ZoomIn className="w-4 h-4 text-zinc-400" />
        <input 
          type="range" 
          min="1" 
          max="3" 
          step="0.01" 
          value={globalZoom} 
          onChange={(e) => setGlobalZoom(parseFloat(e.target.value))}
          className="w-40 accent-emerald-500 bg-zinc-800 h-1 rounded-full appearance-none cursor-pointer"
        />
        <span className="text-[10px] font-mono text-zinc-400 w-8">{Math.round(globalZoom * 100)}%</span>
      </div>
    </div>
  );
}
