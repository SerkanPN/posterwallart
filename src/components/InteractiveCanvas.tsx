import { useRef, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Move } from 'lucide-react';

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
  const [displayScale, setDisplayScale] = useState(1);

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

  // Ölçek düzeltmesi: PPI'yı %20 daha küçük alarak devasalığı önlüyoruz
  const effectivePPI = naturalPixelsPerInch * displayScale * 0.8;
  const widthPx = physicalWidth * effectivePPI;
  const heightPx = physicalHeight * effectivePPI;

  return (
    <div ref={containerRef} className="relative w-full h-full rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 flex items-center justify-center shadow-2xl">
      {backgroundImage && <img src={backgroundImage} alt="Room" className="absolute inset-0 w-full h-full object-contain pointer-events-none" />}
      
      {/* Çerçeve alanı */}
      <motion.div
        drag
        dragConstraints={containerRef}
        className="absolute cursor-grab active:cursor-grabbing flex items-center justify-center z-10 rounded-sm"
        style={{ 
          width: widthPx, 
          height: heightPx,
          padding: frameColor ? '4px' : '0px',
          backgroundColor: frameColor || (mountedArt ? 'transparent' : 'rgba(255,255,255,0.05)'),
          border: !mountedArt ? '1px dashed rgba(255,255,255,0.2)' : 'none',
          boxShadow: mountedArt ? '0 30px 60px rgba(0,0,0,0.6)' : 'none',
          transform: `perspective(1200px) rotateY(${perspective.rotateY}deg) skewY(${perspective.skewY}deg)`
        }}
      >
        {mountedArt ? (
          <img src={mountedArt} className="w-full h-full object-cover pointer-events-none rounded-sm" draggable={false} />
        ) : (
          <div className="flex flex-col items-center gap-2 opacity-20"><Move className="w-4 h-4" /><span className="text-[10px] font-mono">Empty Frame</span></div>
        )}
      </motion.div>
    </div>
  );
}
