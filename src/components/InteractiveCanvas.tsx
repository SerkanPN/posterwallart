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
    if (!backgroundImage) return;
    const img = new Image();
    img.src = backgroundImage;
    img.onload = () => {
      const container = containerRef.current;
      if (!container || container.clientHeight === 0 || container.clientWidth === 0) return;
      const containerRatio = container.clientWidth / container.clientHeight;
      const imgRatio = img.width / img.height;
      const renderedWidth = containerRatio > imgRatio ? container.clientHeight * imgRatio : container.clientWidth;
      setDisplayScale(renderedWidth / img.width);
    };
  }, [backgroundImage]);

  const effectivePPI = naturalPixelsPerInch * displayScale;
  const widthPx = physicalWidth * effectivePPI;
  const heightPx = physicalHeight * effectivePPI;
  
  // Çerçeve kalınlığı sabit ve narin (4px)
  const fixedFrameThicknessPx = 4;

  return (
    <div ref={containerRef} className="relative w-full h-full rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 flex items-center justify-center shadow-2xl">
      {backgroundImage && <img src={backgroundImage} alt="Room" className="absolute inset-0 w-full h-full object-contain pointer-events-none" />}

      {/* Daima bir çerçeve alanı var, sadece içi değişiyor */}
      <motion.div
        drag
        dragConstraints={containerRef}
        className="absolute cursor-grab active:cursor-grabbing flex items-center justify-center z-10 rounded-sm"
        style={{ 
          width: widthPx, 
          height: heightPx,
          padding: frameColor ? `${fixedFrameThicknessPx}px` : '0px',
          backgroundColor: frameColor || (mountedArt ? 'transparent' : 'rgba(255,255,255,0.05)'),
          border: !mountedArt ? '1px dashed rgba(255,255,255,0.2)' : 'none',
          boxShadow: mountedArt ? '0 30px 60px rgba(0,0,0,0.6)' : 'none',
          transform: `perspective(1200px) rotateY(${perspective.rotateY}deg) skewY(${perspective.skewY}deg)`
        }}
      >
        {mountedArt ? (
          <img 
            src={mountedArt} 
            alt="Art" 
            className="w-full h-full object-cover pointer-events-none" 
            draggable={false} 
            style={{ boxShadow: frameColor ? 'inset 0 0 10px rgba(0,0,0,0.5)' : 'none' }}
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-zinc-500">
            <Move className="w-5 h-5 opacity-20" />
            <span className="text-[10px] uppercase font-bold tracking-widest opacity-20">Empty Frame</span>
          </div>
        )}
      </motion.div>
    </div>
  );
}
