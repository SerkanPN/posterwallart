import { useRef, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Move, Maximize } from 'lucide-react';

interface InteractiveCanvasProps {
  backgroundImage: string;
  mountedArt: string | null;
  physicalWidth: number;
  physicalHeight: number;
  naturalPixelsPerInch: number;
  frameColor: string | null;
  perspective?: { rotateY: number; skewY: number };
}

export function InteractiveCanvas({ 
  backgroundImage, 
  mountedArt, 
  physicalWidth, 
  physicalHeight, 
  naturalPixelsPerInch, 
  frameColor,
  perspective = { rotateY: 0, skewY: 0 }
}: InteractiveCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [imageDims, setImageDims] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!backgroundImage) return;
    const img = new Image();
    img.src = backgroundImage;
    img.onload = () => setImageDims({ width: img.width, height: img.height });
  }, [backgroundImage]);

  const getScale = () => {
    if (!containerRef.current || imageDims.width === 0) return 1;
    const { clientWidth, clientHeight } = containerRef.current;
    const containerRatio = clientWidth / clientHeight;
    const imageRatio = imageDims.width / imageDims.height;
    return containerRatio > imageRatio ? clientHeight / imageDims.height : clientWidth / imageDims.width;
  };

  const scale = getScale();
  // Ölçeği %10 daha küçülterek odaya daha doğal oturmasını sağlıyoruz
  const widthPx = physicalWidth * naturalPixelsPerInch * scale * 0.9;
  const heightPx = physicalHeight * naturalPixelsPerInch * scale * 0.9;
  const frameThicknessPx = (naturalPixelsPerInch * scale) * 0.04;

  return (
    <div ref={containerRef} className="relative w-full h-full rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 flex items-center justify-center shadow-2xl">
      {backgroundImage && (
        <img 
          src={backgroundImage} 
          alt="Room" 
          className="absolute inset-0 w-full h-full object-contain pointer-events-none" 
        />
      )}

      {mountedArt ? (
        <motion.div
          drag
          dragConstraints={containerRef}
          dragElastic={0.1}
          className="absolute cursor-grab active:cursor-grabbing flex items-center justify-center z-10"
          style={{ 
            width: widthPx, 
            height: heightPx,
            padding: frameColor ? `${frameThicknessPx}px` : '0px',
            backgroundColor: frameColor || 'transparent',
            boxShadow: '0 30px 60px rgba(0,0,0,0.7), inset 0 0 20px rgba(0,0,0,0.3)',
            // AI PERSPEKTİF VERİSİ BURADA UYGULANIYOR
            transform: `perspective(1200px) rotateY(${perspective.rotateY}deg) skewY(${perspective.skewY}deg)`,
          }}
        >
          <img 
            src={mountedArt} 
            alt="Art" 
            className="w-full h-full object-cover pointer-events-none rounded-sm" 
            draggable={false} 
          />
          <div className="absolute -bottom-10 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 px-3 py-1 rounded text-[10px] font-mono uppercase tracking-tighter text-zinc-400">
            {physicalWidth}" x {physicalHeight}"
          </div>
        </motion.div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="bg-black/60 backdrop-blur-xl px-8 py-4 rounded-3xl border border-white/5 text-sm font-bold text-zinc-100 uppercase tracking-[0.2em] flex items-center gap-4 shadow-2xl">
            <Maximize className="w-5 h-5 text-indigo-400" />
            <span>Select art to mount</span>
          </div>
        </div>
      )}
    </div>
  );
}
